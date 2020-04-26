import {SocketWithRequest} from "../../../util/SocketWithRequest";
import * as mediasoup from 'mediasoup-client';
import {RtpCapabilities} from "mediasoup-client/src/RtpParameters";


interface MediasoupStage {
    id: string;
    clients: MediasoupClient[];
}

interface MediasoupClient {
    uid: string;
    producerIds: string[];
    // Keine transports
    // Keine cosumer
}

export default class MediasoupController {
    private readonly socket: SocketWithRequest;
    private readonly uid: string;
    private device: mediasoup.Device;
    private sendTransport: mediasoup.types.Transport;
    private recvTransport: mediasoup.types.Transport;
    private producers: mediasoup.types.Producer[] = [];
    private consumers: mediasoup.types.Consumer[] = [];

    public onConsumerAdded?: (userId: string, consumer: mediasoup.types.Consumer) => void;

    constructor(socket: SocketWithRequest, uid: string) {
        this.socket = socket;
        this.uid = uid;
    }

    connect(): Promise<void> {
        this.device = new mediasoup.Device();
        // Get general informations from server
        return this.getRtcCapabilities()
            .then(async (rtpCapabilities: any) => {
                console.log(rtpCapabilities);
                await this.device.load({routerRtpCapabilities: rtpCapabilities});
                // Create a transport to receive streams
                this.recvTransport = await this.createRecvTransport(this.device);
                // Create a transport to send streams
                this.sendTransport = await this.createSendTransport(this.device);

                // Listen for added producers
                this.socket.on('stg/ms/producer/added', async (data: {
                    producer: string,
                    userId: string,
                }) => {
                    console.log('s > c: stg/ms/producer/added: userId=' + data.userId + ' producer=' + data.producer);
                    console.log('c > s: stg/ms/producer/consume');
                    const consumerOptions = await this.socket.request('stg/ms/consume', {
                        producerId: data.producer,
                        transportId: this.recvTransport.id,
                        rtpCapabilities: this.device.rtpCapabilities
                    });
                    console.log('c > s: stg/ms/producer/finish-consume');
                    const consumer: mediasoup.types.Consumer = await this.recvTransport.consume(consumerOptions);
                    await this.socket.request('stg/ms/finish-consume', {
                        id: consumerOptions.id
                    });
                    consumer.resume();
                    this.consumers.push(consumer);
                    console.log("ms: emit onConsumerAdded for event listener");
                    if (this.onConsumerAdded)
                        this.onConsumerAdded(data.userId, consumer);
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

    publishTack(track: MediaStreamTrack): Promise<void> {
        if (!this.device.canProduce('video')) {
            console.error('cannot produce video');
            return;
        }
        if (!this.device.canProduce('audio')) {
            console.error('cannot produce audio');
            return;
        }
        console.log("ms: sendTransport.produce(" + track.kind + ")");
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
        console.log("c > s: stg/ms/get-rtp-capabilities");
        return this.socket.request('stg/ms/get-rtp-capabilities', {})
            .then((routerRtpCapabilities) => routerRtpCapabilities);
    };

    createSendTransport = (device: mediasoup.Device): Promise<mediasoup.types.Transport> => {
        console.log("c > s: stg/ms/create-send-transport");
        return this.socket.request('stg/ms/create-send-transport', {
            forceTcp: false,
            rtpCapabilities: this.device.rtpCapabilities,
        })
            .then((sendTransportOptions: mediasoup.types.TransportOptions) => {
                console.log('c > s: stg/ms/create-send-transport');
                const sendTransport: mediasoup.types.Transport = device.createSendTransport(sendTransportOptions);

                // Add handler
                sendTransport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    this.socket.request('stg/ms/connect-transport', {
                        transportId: sendTransportOptions.id,
                        dtlsParameters
                    })
                        .then(callback)
                        .then(() => console.log('c > s: stg/ms/connect-transport'))
                        .catch(errCallback);
                });
                sendTransport.on('produce', async ({kind, rtpParameters, appData}, callback) => {
                    console.log('c > s: stg/ms/send-track (kind=' + kind + ')');
                    const result = await this.socket.request('stg/ms/send-track', {
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
        console.log("c > s: stg/ms/create-receive-transport");
        return this.socket.request('stg/ms/create-receive-transport', {
            forceTcp: false,
            rtpCapabilities: this.device.rtpCapabilities,
        })
            .then((receiveTransportOptions: mediasoup.types.TransportOptions) => {
                const receiveTransport: mediasoup.types.Transport = device.createRecvTransport(receiveTransportOptions);

                // Add handler
                receiveTransport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    await this.socket.request('stg/ms/connect-transport', {
                        transportId: receiveTransportOptions.id,
                        dtlsParameters
                    })
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
    };

    private findProducerForTrack = (track: MediaStreamTrack): mediasoup.types.Producer | null => {
        return this.producers.find((producer: mediasoup.types.Producer) => producer.track != null && producer.track.id === track.id);
    }
}
