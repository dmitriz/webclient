import IBaseController from "../IBaseController";
import {Participant} from "../Connection";
import {SocketWithRequest} from "../../../util/SocketWithRequest";
import * as mediasoup from 'mediasoup-client';
import {RtpCapabilities} from "mediasoup-client/src/RtpParameters";

export default class MediasoupController implements IBaseController {
    private readonly socket: SocketWithRequest;
    private readonly uid: string;
    private device: mediasoup.Device;
    private sendTransport: mediasoup.types.Transport;
    private recvTransport: mediasoup.types.Transport;
    private producers: mediasoup.types.Producer[] = [];
    private consumers: mediasoup.types.Consumer[] = [];

    constructor(socket: SocketWithRequest, uid: string) {
        this.socket = socket;
        this.uid = uid;
    }

    connect(): Promise<void> {
        this.device = new mediasoup.Device();
        // Get general informations from server
        return this.getRtcCapabilities()
            .then(async (rtpCapabilities: any) => {
                await this.device.load({routerRtpCapabilities: rtpCapabilities});
                // Create a transport to receive streams
                this.recvTransport = await this.createRecvTransport(this.device);
                // Create a transport to send streams
                this.sendTransport = await this.createSendTransport(this.device);

                // Listen for added producers
                this.socket.on('con/ms/producer-added', async (data: {
                    userId: string,
                    producerId: string
                }) => {
                    console.log("mediasoup: new producer" + data.producerId + ', so lets create an consumer for it');
                    console.log("mediasoup: ask server for new consumer");
                    const consumerOptions = await this.socket.request('con/ms/consume', {
                        producerId: data.producerId,
                        transportId: this.recvTransport.id,
                        rtpCapabilities: this.device.rtpCapabilities
                    });
                    const consumer: mediasoup.types.Consumer = await this.recvTransport.consume(consumerOptions);
                    await this.socket.request('con/ms/finish-consume', {
                        id: consumerOptions.id
                    });
                    consumer.resume();
                    this.consumers.push(consumer);
                    console.log("mediasoup: We finally got an consumer for the producer! We will now receive its stream!");
                    //TODO: Throw new consumer event
                });

                this.socket.request("con/ms/get-existing-clients").then(
                    async (response: {
                        clients: {
                            uid: string;
                            producerIds: string[]
                        }[]
                    }) => {
                        response.clients.forEach((c) => {
                            // I know who is who

                            c.producerIds.forEach(async (pi) => {
                                const consumerOptions = await this.socket.request('con/ms/consume', {
                                    producerId: pi,
                                    transportId: this.recvTransport.id,
                                    rtpCapabilities: this.device.rtpCapabilities
                                });
                            })
                        })
                    });
                return;
            })
    }

    disconnect(): Promise<void> {
        return new Promise<void>(resolve => {
            this.producers.forEach((producer: mediasoup.types.Producer) => producer.close());
            this.consumers.forEach((consumer: mediasoup.types.Consumer) => consumer.close());
            this.sendTransport.close();
            this.recvTransport.close();
            return;
        });
    }

    handleParticipantAdded(participant: Participant): Promise<void> {
        return undefined;
    }

    publishTack(track: MediaStreamTrack): Promise<void> {
        return this.sendTransport.produce({
            track: track,
            appData: {
                uid: this.uid
            }
        }).then(
            (producer: mediasoup.types.Producer) => {
                this.producers.push(producer);
            }
        );
    }

    unpublishTrack(track: MediaStreamTrack): Promise<void> {
        return new Promise<void>(resolve => {
            const producer: mediasoup.types.Producer = this.findProducerForTrack(track);
            if (producer) {
                producer.close();
                resolve();
            } else {
                throw new Error("Could not find any publication of track with id=" + track.id);
            }
        });
    }

    getRtcCapabilities = (): Promise<RtpCapabilities> => {
        console.log("mediasoup: getRtcCapabilities");
        return this.socket.request('con/ms/get-rtp-capabilities', {})
            .then((routerRtpCapabilities) => routerRtpCapabilities);
    };

    createSendTransport = (device: mediasoup.Device): Promise<mediasoup.types.Transport> => {
        console.log("mediasoup: createSendTransport");
        return this.socket.request('con/ms/create-send-transport', {
            forceTcp: false,
            rtpCapabilities: this.device.rtpCapabilities,
        })
            .then((sendTransportOptions: mediasoup.types.TransportOptions) => {
                const sendTransport: mediasoup.types.Transport = device.createSendTransport(sendTransportOptions);

                // Add handler
                sendTransport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    console.log("mediasoup: sendTransport: connect");
                    this.socket.request('con/ms/connect-transport', {
                        transportId: sendTransportOptions.id,
                        dtlsParameters
                    })
                        .then(callback)
                        .catch(errCallback);
                });
                sendTransport.on('produce', async ({kind, rtpParameters, appData}, callback) => {
                    console.log("mediasoup: sendTransport: produce");
                    const result = await this.socket.request('con/ms/send-track', {
                        transportId: sendTransportOptions.id,
                        kind,
                        rtpParameters,
                    });
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
    };

    createRecvTransport = (device: mediasoup.Device): Promise<mediasoup.types.Transport> => {
        console.log("mediasoup: createRecvTransport");
        return this.socket.request('con/ms/create-receive-transport', {
            forceTcp: false,
            rtpCapabilities: this.device.rtpCapabilities,
        })
            .then((receiveTransportOptions: mediasoup.types.TransportOptions) => {
                const receiveTransport: mediasoup.types.Transport = device.createRecvTransport(receiveTransportOptions);

                // Add handler
                receiveTransport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    console.log("mediasoup: receive transport: connect");
                    await this.socket.request('con/ms/connect-transport', {
                        transportId: receiveTransportOptions.id,
                        dtlsParameters
                    })
                        .then(callback)
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
    };

    private findProducerForTrack = (track: MediaStreamTrack): mediasoup.types.Producer | null => {
        return this.producers.find((producer: mediasoup.types.Producer) => producer.track != null && producer.track.id === track.id);
    }
}
