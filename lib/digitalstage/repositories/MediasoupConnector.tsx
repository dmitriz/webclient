import {SocketWithRequest} from "../../../util/SocketWithRequest";
import {Participant, Stage} from "../model";
import * as mediasoup from "mediasoup-client";
import {RtpCapabilities} from "mediasoup-client/src/RtpParameters";
import {
    MediasoupConnectTransportPayload,
    MediasoupConsumePayload,
    MediasoupConsumeResult,
    MediasoupFinishConsumePayload,
    MediasoupRequests,
    MediasoupSendTrackPayload,
    MediasoupSendTrackResult,
    MediasoupTransportPayload,
    MediasoupTransportResult
} from "../events/mediasoup";
import {Consumer} from "mediasoup-client/lib/Consumer";
import {Producer} from "mediasoup-client/lib/Producer";

export class MediasoupConnector {
    private readonly socket: SocketWithRequest;
    private readonly stage: Stage;
    private device: mediasoup.Device;
    private sendTransport: mediasoup.types.Transport;
    private recvTransport: mediasoup.types.Transport;
    private producers: {
        [trackId: string]: Producer
    };

    public onConsumerCreated: (userId: string, producerId: string, consumer: Consumer) => void;

    public constructor(socket: SocketWithRequest, stage: Stage) {
        this.stage = stage;
        this.socket = socket;

        //TODO: Maybe call this outside the constructor?
        this.connect();
    };

    public publishTrack = (track: MediaStreamTrack) => {
        console.log(track);
        if (!this.sendTransport) {
            console.error("WTF?");
            return;
        }
        return this.sendTransport.produce({
            track: track
        }).then(
            () => console.log("Producing!")
        ).catch((error) => console.error(error));
    };

    public consume = async (remoteParticipant: Participant, producerId: string): Promise<Consumer> => {
        console.log('c > s: stg/ms/consume');
        const consumerOptions: MediasoupConsumeResult = await this.socket.request(MediasoupRequests.Consume, {
            producerId: producerId,
            transportId: this.recvTransport.id,
            rtpCapabilities: this.device.rtpCapabilities
        } as MediasoupConsumePayload);
        console.log('c > s: stg/ms/finish-consume');
        const consumer: Consumer = await this.recvTransport.consume(consumerOptions);
        await this.socket.request(MediasoupRequests.FinishConsume, {
            transportId: this.recvTransport.id,
            consumerId: consumerOptions.id
        } as MediasoupFinishConsumePayload);
        consumer.resume();
        if (this.onConsumerCreated)
            this.onConsumerCreated(remoteParticipant.userId, producerId, consumer);
        return consumer;
    };

    private connect = () => {
        this.getRtcCapabilities()
            .then(async (routerRtpCapabilities: RtpCapabilities) => {
                this.device = new mediasoup.Device();
                await this.device.load({routerRtpCapabilities: routerRtpCapabilities});
                // Create a transport to receive streams
                this.recvTransport = await this.createRecvTransport(this.device);
                // Create a transport to send streams
                this.sendTransport = await this.createSendTransport(this.device);

                // Consume existing producers
                Object.values(this.stage.participants)
                    .forEach((remoteParticipant: Participant) => {
                        remoteParticipant.producerIds
                            .forEach((producerId: string) => {
                                this.consume(remoteParticipant, producerId);
                            })
                    });

                console.log("Connected to mediasoup server");
            });
    };

    private getRtcCapabilities = (): Promise<RtpCapabilities> => {
        console.log("c > s: stg/ms/get-rtp-capabilities");
        return this.socket.request(MediasoupRequests.GetRTPCapabilities, {})
            .then((routerRtpCapabilities) => routerRtpCapabilities);
    };


    private createSendTransport = (device: mediasoup.Device): Promise<mediasoup.types.Transport> => {
        console.log("c > s: stg/ms/create-send-transport");
        return this.socket.request(MediasoupRequests.CreateSendTransport, {
            preferTcp: false,
            rtpCapabilities: this.device.rtpCapabilities,
        } as MediasoupTransportPayload)
            .then((sendTransportOptions: MediasoupTransportResult) => {
                if (sendTransportOptions.error) {
                    console.error(sendTransportOptions.error);
                    return;
                }
                const sendTransport: mediasoup.types.Transport = device.createSendTransport(sendTransportOptions);

                // Add handler
                sendTransport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    this.socket.request(MediasoupRequests.ConnectTransport, {
                        transportId: sendTransportOptions.id,
                        dtlsParameters: dtlsParameters
                    } as MediasoupConnectTransportPayload)
                        .then(callback)
                        .then(() => console.log('c > s: stg/ms/connect-transport'))
                        .catch(errCallback);
                });
                sendTransport.on('produce', async ({kind, rtpParameters, appData}, callback) => {
                    console.log('c > s: stg/ms/send-track (kind=' + kind + ')');
                    const result: MediasoupSendTrackResult = await this.socket.request(MediasoupRequests.SendTrack, {
                        transportId: sendTransportOptions.id,
                        kind: kind,
                        rtpParameters: rtpParameters
                    } as MediasoupSendTrackPayload);
                    callback({id: result.id});
                });
                sendTransport.on('connectionstatechange', async (state) => {
                    console.log("mediasoup: sendTransport: connectionstatechange " + state);
                    if (state === 'closed' || state === 'failed' || state === 'disconnected') {
                        console.error("mediasoup: Disconnect by server side");
                    }
                });

                console.log("Got sendTransport");
                return sendTransport;
            })
    };

    private createRecvTransport = (device: mediasoup.Device): Promise<mediasoup.types.Transport> => {
        console.log("c > s: stg/ms/create-receive-transport");
        return this.socket.request(MediasoupRequests.CreateReceiveTransport, {
            preferTcp: false,
            rtpCapabilities: this.device.rtpCapabilities,
        } as MediasoupTransportPayload)
            .then((receiveTransportOptions: MediasoupTransportResult) => {
                if (receiveTransportOptions.error) {
                    console.error(receiveTransportOptions.error);
                    return;
                }
                const receiveTransport: mediasoup.types.Transport = device.createRecvTransport(receiveTransportOptions);

                // Add handler
                receiveTransport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    await this.socket.request(MediasoupRequests.ConnectTransport, {
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
                console.log("Got recv transport");
                return receiveTransport;
            })
    };
}
