import {SocketWithRequest} from "../../../../util/SocketWithRequest";
import {Participant, Stage} from "../../model";
import {useCallback, useEffect, useState} from "react";
import * as mediasoup from "mediasoup-client";
import {Device} from "mediasoup-client";
import {
    MediasoupConnectTransportPayload,
    MediasoupFinishConsumePayload,
    MediasoupRequests,
    MediasoupSendTrackPayload,
    MediasoupTransportPayload
} from "../../events/mediasoup";
import {Transport} from "mediasoup-client/lib/Transport";
import {Consumer} from "mediasoup-client/lib/Consumer";

export const useMediasoup = (props: {
    socket: SocketWithRequest,
    stage: Stage
}) => {
    const [device, setDevice] = useState<Device>();
    const [receiveTransport, setReceiveTransport] = useState<Transport>();
    const [sendTransport, setSendTransport] = useState<Transport>();
    const [publishedTracks, setPublishedTracks] = useState<{
        [trackId: string]: MediaStreamTrack
    }>();

    useEffect(() => {
        if (props.socket) {
            // Add socket handler
            console.log('Connetct Mediasoup');
            props.socket.request(MediasoupRequests.GetRTPCapabilities, {})
                .then(async (routerRtpCapabilities) => {
                    console.log('get rtp Mediasoup');
                    const device: Device = new Device();
                    await device.load({routerRtpCapabilities: routerRtpCapabilities});
                    setSendTransport(await createSendTransport(device));
                    setReceiveTransport(await createRecvTransport(device));
                    setDevice(new mediasoup.Device());
                    if (publishedTracks) {
                        Object.values(publishedTracks).forEach((track: MediaStreamTrack) => publishTack(track))
                    }
                });
        }
    }, [props.socket]);

    useEffect(() => {
        if (publishedTracks) {
            if (device) {
                Object.values(publishedTracks).forEach((track: MediaStreamTrack) => publishTack(track))
            }
        }
    }, [publishedTracks]);


    useEffect(() => {
        if (props.stage) {
            // Check for new producers
            Object.values(props.stage.participants).forEach((remoteParticipant: Participant) => {
                // Clean up
                Object.values(remoteParticipant.consumers).forEach((consumer: Consumer) => {
                    if (!remoteParticipant.producerIds.find((producerId: string) => producerId !== consumer.producerId)) {
                        consumer.close();
                        delete remoteParticipant.consumers[consumer.producerId];
                    }
                });
                // Add new ones
                remoteParticipant.producerIds.forEach((producerId: string) => {
                    if (!remoteParticipant.consumers[producerId]) {
                        consume(remoteParticipant, producerId);
                    }
                });
            });
        }
    }, [props.stage]);


    const publishTack = useCallback((track: MediaStreamTrack): Promise<void> => {
        if (!device.canProduce('video')) {
            console.error('cannot produce video');
            return;
        }
        if (!device.canProduce('audio')) {
            console.error('cannot produce audio');
            return;
        }
        console.log("ms: sendTransport.produce(" + track.kind + ")");
        return sendTransport.produce({
            track: track
        }).then(
            (producer: mediasoup.types.Producer) => {
                console.log("Created producer");
            }
        );
    }, [sendTransport, device]);

    const consume = useCallback(async (remoteParticipant: Participant, producerId: string) => {
        console.log('c > s: stg/ms/consume');
        const consumerOptions = await props.socket.request(MediasoupRequests.Consume, {
            producerId: producerId,
            transportId: receiveTransport.id,
            rtpCapabilities: device.rtpCapabilities
        });
        console.log('c > s: stg/ms/finish-consume');
        console.log(consumerOptions);
        const consumer: Consumer = await receiveTransport.consume(consumerOptions);
        await props.socket.request(MediasoupRequests.FinishConsume, {
            userId: remoteParticipant.userId,
            consumerId: consumerOptions.id
        } as MediasoupFinishConsumePayload);
        consumer.resume();
        remoteParticipant.consumers[producerId] = consumer; // Without setStage
        remoteParticipant.stream.addTrack(consumer.track);
    }, [props.socket, receiveTransport, device]);

    const createSendTransport = useCallback((device: mediasoup.Device): Promise<mediasoup.types.Transport> => {
        console.log("c > s: stg/ms/create-send-transport");
        return props.socket.request(MediasoupRequests.CreateSendTransport, {
            preferTcp: false,
            rtpCapabilities: device.rtpCapabilities,
        } as MediasoupTransportPayload)
            .then((sendTransportOptions: mediasoup.types.TransportOptions) => {
                console.log('c > s: stg/ms/create-send-transport');
                const sendTransport: mediasoup.types.Transport = device.createSendTransport(sendTransportOptions);

                // Add handler
                sendTransport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    props.socket.request(MediasoupRequests.ConnectTransport, {
                        transportId: sendTransportOptions.id,
                        dtlsParameters: dtlsParameters
                    } as MediasoupConnectTransportPayload)
                        .then(callback)
                        .then(() => console.log('c > s: stg/ms/connect-transport'))
                        .catch(errCallback);
                });
                sendTransport.on('produce', async ({kind, rtpParameters, appData}, callback) => {
                    console.log('c > s: stg/ms/send-track (kind=' + kind + ')');
                    const result = await props.socket.request(MediasoupRequests.SendTrack, {
                        transportId: sendTransportOptions.id,
                        kind,
                        rtpParameters,
                    } as MediasoupSendTrackPayload);
                    if (result.error) {
                        console.error(result.error);
                        return;
                    }
                    callback(result.id);
                });
                sendTransport.on('connectionstatechange', async (state) => {
                    console.log("mediasoup: sendTransport: connectionstatechange " + state);
                    if (state === 'closed' || state === 'failed' || state === 'disconnected') {
                        console.error("mediasoup: Disconnect by server side");
                    }
                });

                return sendTransport;
            })
    }, [props.socket]);

    const createRecvTransport = useCallback((device: mediasoup.Device): Promise<mediasoup.types.Transport> => {
        console.log("c > s: stg/ms/create-receive-transport");
        return props.socket.request(MediasoupRequests.CreateReceiveTransport, {
            preferTcp: false,
            rtpCapabilities: device.rtpCapabilities,
        } as MediasoupTransportPayload)
            .then((receiveTransportOptions: mediasoup.types.TransportOptions) => {
                const receiveTransport: mediasoup.types.Transport = device.createRecvTransport(receiveTransportOptions);

                // Add handler
                receiveTransport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    await props.socket.request(MediasoupRequests.ConnectTransport, {
                        transportId: receiveTransportOptions.id,
                        dtlsParameters: dtlsParameters
                    } as MediasoupConnectTransportPayload)
                        .then(callback)
                        .then(() => console.log('c > s: stg/ms/connect-transport'))
                        .catch(errCallback);
                });
                receiveTransport.on('connectionstatechange', async (state) => {
                    console.log("mediasoup: receive transport - connectionstatechange " + state);
                    if (state === 'closed' || state === 'failed' || state === 'disconnected') {
                        console.error("mediasoup: Disconnect by server side");
                        //TODO: Throw disconnected event
                    }
                });

                return receiveTransport;
            })
    }, [props.socket]);

    return {
        setPublishedTracks
    }
};
