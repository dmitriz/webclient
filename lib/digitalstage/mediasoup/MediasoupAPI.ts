import {EnhancedEventEmitter} from "mediasoup-client/lib/EnhancedEventEmitter";
import firebase from "firebase";
import {Device as MediasoupClientDevice} from "mediasoup-client/lib/Device";
import mediasoupClient from "mediasoup-client";
import fetch from "isomorphic-unfetch";
import {RouterGetUrls, RouterPostUrls} from "./events";
import {DatabaseProducer, DatabaseRouter} from "../model";
import * as omit from "lodash.omit";

const getNearestServer = (): Promise<string> => {
    //TODO: implement logic
    return firebase
        .database()
        .ref("routers")
        .limitToLast(1)
        .once("child_added")
        .then((snapshot: firebase.database.DataSnapshot) => {
            const router: DatabaseRouter = snapshot.val();
            console.log("MEDIASOUP: Nearest server: " + router);
            return "https://" + router.domain + ":" + router.port;
        });
};

const post = (url: string, body: any, token?: string): Promise<Response> => {
    return fetch(url, {
        method: "POST",
        headers: {
            authorization: token ? token : undefined,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

export class MediasoupConnection extends EnhancedEventEmitter {
    protected readonly user: firebase.User;
    protected readonly device: MediasoupClientDevice;
    protected serverAddress: string = undefined
    protected sendTransport: mediasoupClient.types.Transport;
    protected receiveTransport: mediasoupClient.types.Transport;
    protected producers: {
        [trackId: string]: {
            globalProducerId?: string;
            producer?: mediasoupClient.types.Producer;
        }
    } = {};
    protected consumers: {
        [globalProducerId: string]: mediasoupClient.types.Consumer
    } = {};

    constructor(user: firebase.User) {
        super();
        this.user = user;
        this.device = new MediasoupClientDevice();
    }

    public isConnected(): boolean {
        return this.serverAddress !== undefined;
    }

    public async connect() {
        if (this.isConnected()) {
            await this.disconnect();
        }
        this.serverAddress = await getNearestServer();
        console.log("MEDIASOUP: Connecting to " + this.serverAddress);
        const rtpCapabilities: mediasoupClient.types.RtpCapabilities = await this.getRtpCapabilities();
        await this.device.load({routerRtpCapabilities: rtpCapabilities});
        this.sendTransport = await this.createWebRTCTransport("send");
        this.receiveTransport = await this.createWebRTCTransport("receive");
        this.emit("connected", this.serverAddress);
    }

    public async disconnect() {
        console.log("MEDIASOUP: disconnecting");
        if (this.sendTransport) {
            this.sendTransport.close();
        }
        if (this.receiveTransport) {
            this.receiveTransport.close();
        }
        this.emit("disconnected", this.serverAddress);
        this.serverAddress = undefined;
    }

    public async createConsumer(globalProducerId: string): Promise<boolean> {
        return this.user.getIdToken()
            .then((token: string) => post(this.serverAddress + RouterPostUrls.CreateConsumer, {
                globalProducerId: globalProducerId,
                transportId: this.receiveTransport.id,
                rtpCapabilities: this.device.rtpCapabilities    //TODO: Necessary?
            }, token))
            .then(response => response.ok && response.json())
            .then((data: {
                id: string;
                producerId: string;
                kind: "audio" | "video";
                rtpParameters: mediasoupClient.types.RtpParameters,
                producerPaused: boolean,
                type: 'simple' | 'simulcast' | 'svc' | 'pipe'
            }) => this.receiveTransport.consume(data))
            .then((consumer: mediasoupClient.types.Consumer) => this.consumers[globalProducerId] = consumer)
            .then(() => this.resumeConsumer(globalProducerId));
    }

    public async pauseConsumer(globalProducerId: string): Promise<boolean> {
        const consumer: mediasoupClient.types.Consumer = this.consumers[globalProducerId];
        if (consumer && !consumer.paused) {
            consumer.pause();
            this.emit("consumer-paused", globalProducerId);
            return this.user.getIdToken()
                .then((token: string) => post(this.serverAddress + RouterPostUrls.PauseConsumer, {consumerId: consumer.id}, token))
                .then(response => response.ok);
        }
    }

    public async resumeConsumer(globalProducerId: string): Promise<boolean> {
        const consumer: mediasoupClient.types.Consumer = this.consumers[globalProducerId];
        if (consumer && consumer.paused) {
            consumer.resume();
            this.emit("consumer-resumed", globalProducerId);
            return this.user.getIdToken()
                .then((token: string) => post(this.serverAddress + RouterPostUrls.ResumeConsumer, {consumerId: consumer.id}, token))
                .then(response => response.ok);
        }
    }

    public async closeConsumer(globalProducerId: string): Promise<boolean> {
        const consumer: mediasoupClient.types.Consumer = this.consumers[globalProducerId];
        if (consumer) {
            consumer.resume();
            this.emit("consumer-closed", globalProducerId);
            return this.user.getIdToken()
                .then((token: string) => post(this.serverAddress + RouterPostUrls.CreateConsumer, {consumerId: consumer.id}, token))
                .then(response => response.ok);
        }
    }

    public async createProducer(track: MediaStreamTrack): Promise<boolean> {
        return this.sendTransport.produce({
            track: track,
            appData: {
                trackId: track.id
            }
        }).then((producer: mediasoupClient.types.Producer) => {
            this.producers[track.id] = {
                ...this.producers[track.id],
                producer: producer
            };
            producer.on("pause", () => {
                console.log("pause");
            })
            producer.on("close", () => {
                console.log("close");
            });
            return true;
        });
    }

    public async pauseProducer(track: MediaStreamTrack): Promise<boolean> {
        if (this.producers[track.id] && this.producers[track.id].producer && !this.producers[track.id].producer.paused) {
            this.producers[track.id].producer.pause();
            this.emit("producer-paused", track.id);
            if (this.producers[track.id].globalProducerId) {
                return this.user.getIdToken()
                    .then((token: string) => post(this.serverAddress + RouterPostUrls.PauseProducer, {globalProducerId: this.producers[track.id].globalProducerId}, token))
                    .then(res => res.ok);
            }
        }
    }

    public async resumeProducer(track: MediaStreamTrack): Promise<boolean> {
        if (this.producers[track.id] && this.producers[track.id].producer && this.producers[track.id].producer.paused) {
            this.producers[track.id].producer.resume();
            this.emit("producer-resumed", track.id);
            if (this.producers[track.id].globalProducerId) {
                return this.user.getIdToken()
                    .then((token: string) => post(this.serverAddress + RouterPostUrls.ResumeProducer, {globalProducerId: this.producers[track.id].globalProducerId}, token))
                    .then(res => res.ok);
            }
        }
    }

    public async stopProducer(track: MediaStreamTrack): Promise<boolean> {
        if (this.producers[track.id] && this.producers[track.id].producer) {
            this.producers[track.id].producer.close();
            this.emit("producer-closed", track.id);
            if (this.producers[track.id].globalProducerId)
                return this.user.getIdToken()
                    .then((token: string) => post(this.serverAddress + RouterPostUrls.CloseProducer, {globalProducerId: this.producers[track.id].globalProducerId}, token))
                    .then(res => res.ok && (this.producers = omit(this.producers, track.id)))
        }
    }

    protected async getRtpCapabilities(): Promise<mediasoupClient.types.RtpCapabilities> {
        return fetch(this.serverAddress + RouterGetUrls.GetRTPCapabilities)
            .then(response => response.json())
    }

    protected async createWebRTCTransport(type: "send" | "receive"): Promise<mediasoupClient.types.Transport> {
        return this.user.getIdToken()
            .then((token: string) => {
                console.log("Create " + type + " transport");
                return fetch(this.serverAddress + RouterGetUrls.CreateTransport)
                    .then((response) => response.ok && response.json())
                    .then((transportOptions: mediasoupClient.types.TransportOptions) => {
                        const transport: mediasoupClient.types.Transport = (type === "send" ? this.device.createSendTransport(transportOptions) : this.device.createRecvTransport(transportOptions));
                        transport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                            return this.user.getIdToken()
                                .then((token) => {
                                    post(this.serverAddress + RouterPostUrls.ConnectTransport, {
                                        transportId: transport.id,
                                        dtlsParameters: dtlsParameters
                                    }, token)
                                        .then(response => response.ok)
                                        .then(() => callback())
                                        .catch((error) => errCallback(error));
                                })
                        });
                        transport.on('connectionstatechange', async (state) => {
                            console.log("mediasoup: connectionstatechange " + state);
                            if (state === 'closed' || state === 'failed' || state === 'disconnected') {
                                console.error("mediasoup: Disconnect by server side");
                            }
                        });
                        if (type === "send") {
                            transport.on('produce', async (producer, callback, errCallback) => {
                                console.log('c > s: stg/ms/send-track (kind=' + producer.kind + ')');
                                console.log(producer);
                                return this.user.getIdToken()
                                    .then((token) => {
                                        return post(this.serverAddress + RouterPostUrls.CreateProducer, {
                                            transportId: transport.id,
                                            kind: producer.kind,
                                            rtpParameters: producer.rtpParameters,
                                            appData: producer.appData
                                        }, token)
                                            .then(response => response.ok && response.json())
                                            .then((payload: {
                                                id: string;
                                                localProducerId: string;
                                            }) => {
                                                this.producers[producer.appData.trackId] = {
                                                    ...this.producers[producer.appData.trackId],
                                                    globalProducerId: payload.id
                                                };
                                                this.emit("producer-added", producer.appData.trackId);
                                                return payload.localProducerId;
                                            })
                                            .then((localProducerId: string) => callback(localProducerId))
                                            .catch((error) => errCallback(error));
                                    });
                            });
                        }
                        return transport;
                    })
            })
    };
}

export class MediasoupStageConnection extends MediasoupConnection {
    private foreignProducers: {
        [globalProducerId: string]: DatabaseProducer
    } = {};
    private consumeAudioAutomatically: boolean = false;
    private consumeVideoAutomatically: boolean = false;

    constructor(user: firebase.User) {
        super(user);
        firebase.database()
            .ref("users")
            .child(this.user.uid)
            .child("producers")
            .on("child_added", this.handleForeignProducerAdded);
        firebase.database()
            .ref("users")
            .child(this.user.uid)
            .child("producers")
            .on("child_changed", this.handleForeignProducerChanged);
        firebase.database()
            .ref("users")
            .child(this.user.uid)
            .child("producers")
            .on("child_removed", this.handleForeignProducerRemoved);
    }


    public consumeAutomaticallyVideo(consumeAudioAutomatically: boolean) {
        if (this.consumeAudioAutomatically != consumeAudioAutomatically) {
            this.consumeAudioAutomatically = consumeAudioAutomatically;
            if (!this.isConnected())
                return;
            if (this.consumeAudioAutomatically) {
                Object.keys(this.foreignProducers)
                    .forEach((globalProducerId: string) => {
                        if (this.foreignProducers[globalProducerId].kind === "video") {
                            console.log("CONSUMING: " + globalProducerId);
                            this.createConsumer(globalProducerId);
                        }
                    })
            } else {
                Object.keys(this.foreignProducers)
                    .forEach((globalProducerId: string) => {
                        if (this.foreignProducers[globalProducerId].kind === "video") {
                            console.log("STOP CONSUMING: " + globalProducerId);
                            this.closeConsumer(globalProducerId);
                        }
                    })
            }
        }
    }

    public consumeAutomaticallyAudio(consumeVideoAutomatically: boolean) {
        if (this.consumeVideoAutomatically != consumeVideoAutomatically) {
            this.consumeVideoAutomatically = consumeVideoAutomatically;
            if (!this.isConnected())
                return;
            if (this.consumeVideoAutomatically) {
                Object.keys(this.foreignProducers)
                    .forEach((globalProducerId: string) => {
                        if (this.foreignProducers[globalProducerId].kind === "audio") {
                            console.log("CONSUMING: " + globalProducerId);
                            this.createConsumer(globalProducerId);
                        }
                    })
            } else {
                Object.keys(this.foreignProducers)
                    .forEach((globalProducerId: string) => {
                        if (this.foreignProducers[globalProducerId].kind === "audio") {
                            console.log("STOP CONSUMING: " + globalProducerId);
                            this.closeConsumer(globalProducerId);
                        }
                    })
            }
        }
    }

    private handleForeignProducerAdded = async (snapshot: firebase.database.DataSnapshot) => {
        const globalProducerId: string = snapshot.key;
        const foreignProducer: DatabaseProducer = snapshot.val();
        console.log("New foreign producer: " + globalProducerId);
        this.foreignProducers = {
            ...this.foreignProducers,
            [globalProducerId]: foreignProducer
        }
        if (this.isConnected() && (
            foreignProducer.kind === "audio" && this.consumeAudioAutomatically ||
            foreignProducer.kind === "video" && this.consumeVideoAutomatically)) {
            console.log("CONSUMING: " + globalProducerId);
            return super.createConsumer(globalProducerId);
        }
    }

    private handleForeignProducerRemoved = async (snapshot: firebase.database.DataSnapshot) => {
        const globalProducerId: string = snapshot.key;
        this.foreignProducers = omit(this.foreignProducers, globalProducerId);
        console.log("Removed foreign producer: " + globalProducerId);
        return super.closeConsumer(globalProducerId);
    }

    private handleForeignProducerChanged = async (snapshot: firebase.database.DataSnapshot) => {
        const globalProducerId: string = snapshot.key;
        //TODO: Discuss, what to do here
    }

}
