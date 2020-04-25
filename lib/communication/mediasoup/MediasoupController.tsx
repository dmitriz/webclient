import IBaseController from "../IBaseController";
import {Participant} from "../Connection";
import {SocketWithRequest} from "../../../util/SocketWithRequest";
import {RtpCapabilities} from "mediasoup-client/lib/RtpParameters";
import * as mediasoup from 'mediasoup-client';

export default class MediasoupController implements IBaseController {
    private readonly socket: SocketWithRequest;
    private readonly uid: string;
    private device: mediasoup.Device;
    private sendTransport: mediasoup.types.Transport;
    private recvTransport: mediasoup.types.Transport;

    constructor(socket: SocketWithRequest, uid: string) {
        this.socket = socket;
        this.uid = uid;
    }

    connect(): Promise<void> {
        this.device = new mediasoup.Device();
        // Get general informations from server
        return this.getRtcCapabilities()
            .then(async (rtpCapabilities: RtpCapabilities) => {
                // Create a transport to receive streams
                this.recvTransport = await this.createRecvTransport(this.device);
                // Create a transport to send streams
                this.sendTransport = await this.createSendTransport(this.device);

                // Listen for added producers
                this.socket.on('ms-producer-added', async (data: {
                    userId: string,
                    producerId: string
                }) => {
                    console.log("mediasoup: new producer" + data.producerId + ', so lets create an consumer for it');
                    console.log("mediasoup: ask server for new consumer");
                    const consumerOptions = await this.socket.request('ms-consume', {
                        producerId: data.producerId,
                        transportId: this.recvTransport.id,
                        rtpCapabilities: this.device.rtpCapabilities
                    });
                    const consumer: mediasoup.types.Consumer = await this.recvTransport.consume(consumerOptions);
                    await this.socket.request('ms-finish-consume', {
                        id: consumerOptions.id
                    });
                    consumer.resume();
                    console.log("mediasoup: We finally got an consumer for the producer! We will now receive its stream!");
                    //TODO: Throw new consumer event
                });
                return;
            })
    }

    disconnect(): Promise<void> {
        return new Promise<void>(resolve => {
            //TODO: Close all active producers and consumers first
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
        return undefined;
    }

    getRtcCapabilities = (): Promise<RtpCapabilities> => {
        console.log("mediasoup: getRtcCapabilities");
        return this.socket.request('ms-get-rtp-capabilities', {})
            .then((routerRtpCapabilities) => routerRtpCapabilities);
    };

    createSendTransport = (device: mediasoup.Device): Promise<mediasoup.types.Transport> => {
        console.log("mediasoup: createSendTransport");
        return this.socket.request('ms-create-send-transport', {
            forceTcp: false,
            rtpCapabilities: this.device.rtpCapabilities,
        })
            .then((sendTransportOptions: mediasoup.types.TransportOptions) => {
                const sendTransport: mediasoup.types.Transport = device.createSendTransport(sendTransportOptions);

                // Add handler
                sendTransport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    console.log("mediasoup: sendTransport: connect");
                    this.socket.request('ms-connect-transport', {
                        transportId: sendTransportOptions.id,
                        dtlsParameters
                    })
                        .then(callback)
                        .catch(errCallback);
                });
                sendTransport.on('produce', async ({kind, rtpParameters, appData}, callback) => {
                    console.log("mediasoup: sendTransport: produce");
                    const result = await this.socket.request('ms-send-track', {
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
        return this.socket.request('ms-create-receive-transport', {
            forceTcp: false,
            rtpCapabilities: this.device.rtpCapabilities,
        })
            .then((receiveTransportOptions: mediasoup.types.TransportOptions) => {
                const receiveTransport: mediasoup.types.Transport = device.createRecvTransport(receiveTransportOptions);

                // Add handler
                receiveTransport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    console.log("mediasoup: receive transport: connect");
                    await this.socket.request('ms-connect-transport', {
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
}
