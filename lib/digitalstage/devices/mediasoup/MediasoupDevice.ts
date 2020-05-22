import {IDeviceAPI} from "../IDeviceAPI";
import mediasoupClient from "mediasoup-client";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import {Device as MediasoupClientDevice} from "mediasoup-client/lib/Device";
import unfetch from "isomorphic-unfetch";
import {RouterGetUrls, RouterPostUrls} from "./events";
import {getFastestRouter, getLocalAudioTracks, getLocalVideoTracks} from "./utils";
import * as omit from "lodash.omit";
import {DatabaseGlobalProducer} from "../../database.model";
import {MediasoupRouter} from "../../client.model";

export interface PublishableProducer {
    producer: mediasoupClient.types.Producer,
    globalProducerId?: string;
}

export interface GlobalProducer extends DatabaseGlobalProducer {
    id: string;
}

export interface GlobalProducerConsumer {
    globalProducer: GlobalProducer,
    consumer: mediasoupClient.types.Consumer,
}

export class MediasoupDevice extends IDeviceAPI {
    protected readonly device: MediasoupClientDevice;
    protected stageId: string = null;
    protected router: MediasoupRouter = undefined;
    protected sendTransport: mediasoupClient.types.Transport;
    protected receiveTransport: mediasoupClient.types.Transport;
    protected availableGlobalProducers: {
        [globalProducerId: string]: GlobalProducer
    } = {};
    protected producers: {
        [trackId: string]: PublishableProducer
    } = {};
    protected consumers: {
        [globalProducerId: string]: GlobalProducerConsumer
    } = {};

    constructor(user: firebase.User) {
        super(user, "Browser", {
            canAudio: true,
            canVideo: true
        });
        this.device = new MediasoupClientDevice();
        this.registerDeviceListeners();
        this.connect();
    }

    private registerDeviceListeners() {
        this.on("send-audio", (sendAudio: boolean) => {
            console.log("SEND_AUDIO");
            if (sendAudio) {
                getLocalAudioTracks()
                    .then((tracks: MediaStreamTrack[]) => {
                        tracks.forEach((track: MediaStreamTrack) => this.createProducer(track))
                    });
            } else {
                Object.keys(this.producers)
                    .forEach((trackId: string) => {
                        if (this.producers[trackId].producer.kind === "audio")
                            return this.stopProducer(trackId);
                    })
            }
        });
        this.on("send-video", (sendVideo: boolean) => {
            console.log("SEND_VIDEO");
            if (sendVideo) {
                getLocalVideoTracks()
                    .then((tracks: MediaStreamTrack[]) => {
                        tracks.forEach((track: MediaStreamTrack) => this.createProducer(track))
                    });
            } else {
                Object.keys(this.producers)
                    .forEach((trackId: string) => {
                        if (this.producers[trackId].producer.kind === "video")
                            return this.stopProducer(trackId);
                    })
            }
        });
        this.on("receive-audio", (receiveAudio: boolean) => {
            if (receiveAudio) {
                Object.values(this.availableGlobalProducers)
                    .forEach((globalProducer: GlobalProducer) => {
                        console.log("HAVE GLOBAL PRODUCER");
                        if (globalProducer.kind === "audio")
                            return this.createConsumer(globalProducer);
                    });
            } else {
                Object.values(this.consumers)
                    .forEach((consumer: GlobalProducerConsumer) => {
                        if (consumer.globalProducer.kind === "audio")
                            return this.closeConsumer(consumer.globalProducer.id)
                    });
            }
        });
        this.on("receive-video", (receiveVideo: boolean) => {
            if (receiveVideo) {
                Object.values(this.availableGlobalProducers)
                    .forEach((globalProducer: GlobalProducer) => {
                        console.log("HAVE GLOBAL PRODUCER");
                        if (globalProducer.kind === "video")
                            return this.createConsumer(globalProducer);
                    });
            } else {
                Object.values(this.consumers)
                    .forEach((consumer: GlobalProducerConsumer) => {
                        if (consumer.globalProducer.kind === "video")
                            return this.closeConsumer(consumer.globalProducer.id)
                    });
            }
        });
    }

    public connect() {
        return getFastestRouter()
            .then(async (router: MediasoupRouter) => {
                this.router = router;
                const rtpCapabilities: mediasoupClient.types.RtpCapabilities = await this.getRtpCapabilities();
                await this.device.load({routerRtpCapabilities: rtpCapabilities});
                this.sendTransport = await this.createWebRTCTransport("send");
                this.receiveTransport = await this.createWebRTCTransport("receive");
                this.emit("connected", this.router);
            })
            .catch((error) => {
                console.error(error);
                alert("Video & Audio not available right now ... sorry :(");
                this.disconnect();
            })
    }

    public disconnect() {
        console.log("MEDIASOUP: disconnecting");
        if (this.sendTransport) {
            this.sendTransport.close();
        }
        if (this.receiveTransport) {
            this.receiveTransport.close();
        }
        this.emit("disconnected", this.router);
        this.router = undefined;
    }

    public setStageId(stageId: string) {
        if (this.stageId === stageId)
            return;
        this.stageId = stageId;
        if (this.stageId) {
            // Publish all local producers
            Object.values(this.producers)
                .forEach((producer: PublishableProducer) => this.publishProducerToStage(this.stageId, producer));
            firebase.firestore()
                .doc("users/" + this.user.uid)
                .collection("producers")
                .onSnapshot(this.handleRemoteProducer);
        } else {
            // Un-publish all local producers
            firebase.firestore()
                .collection("producers")
                .where("deviceId", "==", this.getDeviceId())
                .get()
                .then((snapshots: firebase.firestore.QuerySnapshot) => snapshots.forEach((snapshot) => snapshot.ref.delete()));
        }
    }

    protected async createConsumer(globalProducer: GlobalProducer): Promise<void> {
        if (!this.receiveTransport)
            return;
        console.log("create consumer");

        return this.fetchPostJson(RouterPostUrls.CreateConsumer, {
            globalProducerId: globalProducer.id,
            transportId: this.receiveTransport.id,
            rtpCapabilities: this.device.rtpCapabilities    //TODO: Necessary?
        })
            .then(async (data: {
                id: string;
                producerId: string;
                kind: "audio" | "video";
                rtpParameters: mediasoupClient.types.RtpParameters,
                paused: boolean,
                type: 'simple' | 'simulcast' | 'svc' | 'pipe'
            }) => {
                const consumer = await this.receiveTransport.consume(data);
                if (data.paused)
                    consumer.pause();
                return consumer;
            })
            .then((consumer: mediasoupClient.types.Consumer) => {
                this.consumers[globalProducer.id] = {
                    globalProducer: globalProducer,
                    consumer: consumer
                } as GlobalProducerConsumer;
                this.emit("consumer-created", this.consumers[globalProducer.id]);
                return consumer.paused;
            })
            .then((paused: boolean) => {
                console.log("Paused: " + paused);
                return this.resumeConsumer(globalProducer.id)
            });
    }

    public async pauseConsumer(globalProducerId: string): Promise<void> {
        console.log("pause consumer");
        const consumer: GlobalProducerConsumer = this.consumers[globalProducerId];
        if (consumer && !consumer.consumer.paused) {
            return this.fetchPostJson(RouterPostUrls.PauseConsumer, {
                id: consumer.consumer.id
            }).then(() => {
                consumer.consumer.pause();
                this.emit("consumer-paused", consumer);
            })
        }
    }

    public async resumeConsumer(globalProducerId: string): Promise<void> {
        console.log("resume consumer");
        const consumer: GlobalProducerConsumer = this.consumers[globalProducerId];
        if (consumer && consumer.consumer.paused) {
            return this.fetchPostJson(RouterPostUrls.ResumeConsumer, {
                id: consumer.consumer.id
            }).then(() => {
                console.log("really resume consumer");
                consumer.consumer.resume();
                this.emit("consumer-resumed", consumer);
            })
        }
    }

    public async closeConsumer(globalProducerId: string): Promise<void> {
        console.log("close consumer");
        const consumer: GlobalProducerConsumer = this.consumers[globalProducerId];
        if (consumer) {
            return this.fetchPostJson(RouterPostUrls.CloseConsumer, {
                id: consumer.consumer.id
            }).then(() => {
                consumer.consumer.close();
                this.consumers = omit(this.consumers, globalProducerId);
                this.emit("consumer-closed", consumer);
            })
        }
    }

    public async createProducer(track: MediaStreamTrack): Promise<void> {
        if (!this.sendTransport)
            return;
        console.log("create producer");
        return this.sendTransport.produce({
            track: track,
            appData: {
                trackId: track.id
            }
        }).then((producer: mediasoupClient.types.Producer) => {
            console.log("First");
            producer.on("pause", () => {
                console.log("pause");
            })
            producer.on("close", () => {
                console.log("close");
            });
            this.producers[track.id] = {
                producer: producer
            };
            console.log(producer.id);
            this.emit("producer-added", this.producers[track.id]);
            if (this.stageId) {
                this.publishProducerToStage(this.stageId, this.producers[track.id]);
            }
        });
    }

    public async pauseProducer(track: MediaStreamTrack): Promise<void> {
        console.log("pause producer");
        if (this.producers[track.id] && !this.producers[track.id].producer.paused) {
            this.fetchPostJson(RouterPostUrls.PauseProducer, {
                id: this.producers[track.id].producer.id
            }).then(() => {
                this.producers[track.id].producer.pause();
                this.emit("producer-paused", track.id);
            })
        }
    }

    public async resumeProducer(track: MediaStreamTrack): Promise<void> {
        console.log("resume producer");
        if (this.producers[track.id] && this.producers[track.id].producer.paused) {
            this.fetchPostJson(RouterPostUrls.ResumeProducer, {
                id: this.producers[track.id].producer.id
            }).then(() => {
                this.producers[track.id].producer.resume();
                this.emit("producer-resumed", track.id);
            })
        }
    }

    public async stopProducer(trackId: string): Promise<void> {
        console.log("stop producer");
        if (this.producers[trackId]) {
            this.fetchPostJson(RouterPostUrls.CloseProducer, {
                id: this.producers[trackId].producer.id
            }).then(() => {
                this.producers[trackId].producer.close();
                // Remove public offer
                if (this.producers[trackId].globalProducerId)
                    firebase.firestore()
                        .collection("producers")
                        .doc(this.producers[trackId].globalProducerId)
                        .delete();
                this.producers = omit(this.producers, trackId);
                this.emit("producer-stopped", trackId);
            })
        }
    }

    private handleRemoteProducer = (querySnapshot: firebase.firestore.QuerySnapshot) => {
        return querySnapshot.docChanges().forEach((change: firebase.firestore.DocumentChange<DatabaseGlobalProducer>) => {
            const globalProducer: DatabaseGlobalProducer = change.doc.data();
            if (change.type === "added") {
                this.availableGlobalProducers[change.doc.id] = {
                    ...globalProducer,
                    id: change.doc.id
                }
                if (globalProducer.kind === "audio" && this.receiveAudio ||
                    globalProducer.kind === "video" && this.receiveVideo) {
                    return this.createConsumer({
                        ...globalProducer,
                        id: change.doc.id
                    });
                }
            } else if (change.type === "removed") {
                this.availableGlobalProducers = omit(this.availableGlobalProducers, change.doc.id);
                if (this.consumers[change.doc.id])
                    return this.closeConsumer(change.doc.id);
            }
        })
    }

    private publishProducerToStage(stageId: string, producer: PublishableProducer) {
        return firebase.firestore()
            .collection("producers")
            .add({
                uid: this.user.uid,
                deviceId: this.getDeviceId(),
                routerId: this.router.id,
                producerId: producer.producer.id,
                stageId: stageId,
                kind: producer.producer.kind
            } as DatabaseGlobalProducer)
            .then((ref) => {
                console.log("Published global producer " + ref.id);
                producer.globalProducerId = ref.id;
                this.emit("producer-published", ref.id);
            });
    }

    private async getRtpCapabilities(): Promise<mediasoupClient.types.RtpCapabilities> {
        return this.fetchGetJson(RouterGetUrls.GetRTPCapabilities);
    }

    private async createWebRTCTransport(type: "send" | "receive"): Promise<mediasoupClient.types.Transport> {
        return this.fetchGetJson(RouterGetUrls.CreateTransport)
            .then((transportOptions: mediasoupClient.types.TransportOptions) => {
                const transport: mediasoupClient.types.Transport = (type === "send" ? this.device.createSendTransport(transportOptions) : this.device.createRecvTransport(transportOptions));
                transport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                    return this.fetchPostJson(RouterPostUrls.ConnectTransport, {
                            transportId: transport.id,
                            dtlsParameters: dtlsParameters
                        }
                    )
                        .then(() => callback())
                        .catch((error) => errCallback(error));
                });
                transport.on('connectionstatechange', async (state) => {
                    console.log("mediasoup: connectionstatechange " + state);
                    if (state === 'closed' || state === 'failed' || state === 'disconnected') {
                        console.error("mediasoup: Disconnect by server side");
                    }
                });
                if (type === "send") {
                    transport.on('produce', async (producer, callback, errCallback) => {
                        return this.fetchPostJson(RouterPostUrls.CreateProducer, {
                            transportId: transport.id,
                            kind: producer.kind,
                            rtpParameters: producer.rtpParameters,
                            appData: producer.appData
                        })
                            .then((payload: {
                                id: string;
                            }) => {
                                producer.id = payload.id;
                                return callback(producer);
                            })
                            .catch((error) => errCallback(error));
                    });
                }
                return transport;
            });
    }

    private fetchGetJson = (url: string): Promise<any> => {
        console.log("fetchGetJson(" + url + ")");
        return new Promise<any>((resolve, reject) => {
            return unfetch("https://" + this.router.domain + ":" + this.router.port + url, {
                method: "GET",
                headers: {'Content-Type': 'application/json'},
            })
                .then((response) => {
                    if (!response.ok) {
                        return reject(response.statusText);
                    }
                    return response.json();
                })
                .then((json: any) => resolve(json));
        })
    }

    private fetchPostJson = (url: string, body?: any): Promise<any> => {
        console.log("fetchPostJson(" + url + ")");
        return new Promise<any>((resolve, reject) => {
            return unfetch("https://" + this.router.domain + ":" + this.router.port + url, {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: body ? JSON.stringify(body) : null
            })
                .then((response) => {
                    if (!response.ok) {
                        return reject(response.statusText);
                    }
                    return response.json();
                })
                .then((json: any) => resolve(json));
        });
    }
}
