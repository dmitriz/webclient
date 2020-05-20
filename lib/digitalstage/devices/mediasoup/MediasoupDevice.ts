import {IDeviceAPI} from "../IDeviceAPI";
import mediasoupClient from "mediasoup-client";
import firebase from "firebase";
import {DatabaseGlobalProducer, DatabaseRouter} from "./models";
import {Device as MediasoupClientDevice} from "mediasoup-client/lib/Device";
import unfetch from "isomorphic-unfetch";
import {RouterPostUrls} from "../../mediasoup/events";
import {RouterGetUrls} from "./events";
import {getFastestRouter, getLocalAudioTracks} from "./utils";

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
    protected router: DatabaseRouter;
    protected sendTransport: mediasoupClient.types.Transport;
    protected receiveTransport: mediasoupClient.types.Transport;
    private unlistenRemoteProducers: () => void;
    protected producers: {
        [trackId: string]: mediasoupClient.types.Producer
    } = {};
    protected consumers: {
        [globalProducerId: string]: GlobalProducerConsumer
    } = {};

    constructor(user: firebase.User) {
        super(user, {
            canAudio: true,
            canVideo: true
        });
        this.device = new MediasoupClientDevice();
    }

    public async setReceiveAudio(receiveAudio: boolean): Promise<void> {
        if (this.receiveAudio != receiveAudio) {
            if (receiveAudio) {
                getLocalAudioTracks()
                    .then()
            } else {

            }
            return super.setReceiveAudio(receiveAudio);
        }
    }

    public async setReceiveVideo(receiveVideo: boolean): Promise<void> {
        return super.setReceiveVideo(receiveVideo);
    }

    public async setSendAudio(sendAudio: boolean): Promise<void> {
        if (this.sendAudio != sendAudio) {


            return super.setSendAudio(sendAudio);
        }
    }

    isReceivingAudio() {
    }

    isReceivingVideo() {
    }

    isSendingAudio() {
    }

    isSendingVideo() {
    }


    public connect() {
        getFastestRouter()
            .then(async (router: DatabaseRouter) => {
                const rtpCapabilities: mediasoupClient.types.RtpCapabilities = await this.getRtpCapabilities();
                await this.device.load({routerRtpCapabilities: rtpCapabilities});
                this.sendTransport = await this.createWebRTCTransport("send");
                this.receiveTransport = await this.createWebRTCTransport("receive");
                this.router = router;
                this.emit("connected", this.router);
            });
    }

    public disconnect() {

    }

    public setStageId(stageId: string) {
        if (this.stageId === stageId)
            return;
        this.stageId = stageId;
        if (this.stageId) {
            // Publish all local producers
            Object.values(this.producers)
                .forEach((producer: mediasoupClient.types.Producer) => this.publishProducerToStage(this.stageId, producer));
            this.unlistenRemoteProducers = firebase.firestore()
                .collection("users/" + this.user.uid + "/producers")
                .onSnapshot(snapshot => this.handleRemoteProducer);
        } else {
            // Un-publish all local producers
            this.unlistenRemoteProducers();
            firebase.firestore()
                .collection("producers")
                .where("deviceId", "==", this.getDeviceId())
                .get()
                .then((snapshots: firebase.firestore.QuerySnapshot) => snapshots.forEach((snapshot) => snapshot.ref.delete()));
        }
    }

    protected async createConsumer(globalProducer: GlobalProducer): Promise<void> {
        console.log("create consumer");

        this.fetchPostJson(RouterPostUrls.CreateConsumer, {
            globalProducerId: globalProducer.id,
            transportId: this.receiveTransport.id,
            rtpCapabilities: this.device.rtpCapabilities    //TODO: Necessary?
        })
            .then((data: {
                id: string;
                producerId: string;
                kind: "audio" | "video";
                rtpParameters: mediasoupClient.types.RtpParameters,
                producerPaused: boolean,
                type: 'simple' | 'simulcast' | 'svc' | 'pipe'
            }) => this.receiveTransport.consume(data))
            .then((consumer: mediasoupClient.types.Consumer) => {
                this.consumers[globalProducer.id] = {
                    globalProducer: globalProducer,
                    consumer: consumer
                } as GlobalProducerConsumer;
                this.emit("consumer-created", this.consumers[globalProducer.id]);
                return consumer.paused;
            })
            .then((paused: boolean) => paused && this.resumeConsumer(globalProducer.id));
    }

    public async pauseConsumer(globalProducerId: string): Promise<void> {
        console.log("pause consumer");
        const consumer: GlobalProducerConsumer = this.consumers[globalProducerId];
        if (consumer && !consumer.consumer.paused) {
            this.fetchPostJson(RouterPostUrls.PauseConsumer, {
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
            this.fetchPostJson(RouterPostUrls.ResumeConsumer, {
                id: consumer.consumer.id
            }).then(() => {
                consumer.consumer.resume();
                this.emit("consumer-resumed", consumer);
            })
        }
    }

    public async closeConsumer(globalProducerId: string): Promise<void> {
        console.log("close consumer");
        const consumer: GlobalProducerConsumer = this.consumers[globalProducerId];
        if (consumer) {
            this.fetchPostJson(RouterPostUrls.CloseConsumer, {
                id: consumer.consumer.id
            }).then(() => {
                consumer.consumer.close();
                this.emit("consumer-closed", consumer);
            })
        }
    }

    public async createProducer(track: MediaStreamTrack): Promise<void> {
        console.log("create producer");
        return this.sendTransport.produce({
            track: track,
            appData: {
                trackId: track.id
            }
        }).then((producer: mediasoupClient.types.Producer) => {
            this.producers[track.id] = producer;
            producer.on("pause", () => {
                console.log("pause");
            })
            producer.on("close", () => {
                console.log("close");
            });
        });
    }

    public async pauseProducer(track: MediaStreamTrack): Promise<void> {
        console.log("pause producer");
        if (this.producers[track.id] && !this.producers[track.id].paused) {
            this.fetchPostJson(RouterPostUrls.PauseProducer, {
                id: this.producers[track.id].id
            }).then(() => {
                this.producers[track.id].pause();
                this.emit("producer-paused", track.id);
            })
        }
    }

    public async resumeProducer(track: MediaStreamTrack): Promise<void> {
        console.log("resume producer");
        if (this.producers[track.id] && this.producers[track.id].paused) {
            this.fetchPostJson(RouterPostUrls.ResumeProducer, {
                id: this.producers[track.id].id
            }).then(() => {
                this.producers[track.id].resume();
                this.emit("producer-resumed", track.id);
            })
        }
    }

    public async stopProducer(track: MediaStreamTrack): Promise<void> {
        console.log("stop producer");
        if (this.producers[track.id]) {
            this.fetchPostJson(RouterPostUrls.CloseProducer, {
                id: this.producers[track.id].id
            }).then(() => {
                this.producers[track.id].close();
                this.emit("producer-resumed", track.id);
            })
        }
    }

    private handleRemoteProducer = (querySnapshot: firebase.firestore.QuerySnapshot) => {
        return querySnapshot.docChanges().forEach((change: firebase.firestore.DocumentChange<DatabaseGlobalProducer>) => {
            const globalProducer: DatabaseGlobalProducer = change.doc.data();
            if (change.type === "added") {
                if (globalProducer.kind === "audio" && !this.receiveAudio) {
                    return;
                }
                if (globalProducer.kind === "video" && !this.receiveVideo) {
                    return;
                }
                return this.createConsumer({
                    ...globalProducer,
                    id: change.doc.id
                });
            }
            if (change.type === "removed") {
                return this.closeConsumer(change.doc.id);
            }
        })
    }

    private publishProducerToStage(stageId: string, producer: mediasoupClient.types.Producer) {
        return firebase.firestore()
            .collection("producers")
            .add({
                uid: this.user.uid,
                deviceId: this.getDeviceId(),
                routerId: this.router.id,
                producerId: producer.id,
                stageId: stageId,
                kind: producer.kind
            } as DatabaseGlobalProducer)
            .then((ref) => {
                console.log("Published global producer " + ref.id);
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
                                this.emit("producer-added", this.producers[producer.appData.trackId]);
                                if (this.stageId) {
                                    this.publishProducerToStage(this.stageId, this.producers[producer.appData.trackId]);
                                }
                                return callback(payload.id);   //TODO: Is this necessary?
                            })
                            .catch((error) => errCallback(error));
                    });
                }
                return transport;
            });
    }

    private fetchGetJson = (url: string): Promise<any> => unfetch("https://" + this.router.domain + ":" + this.router.port + url, {
        method: "GET",
        headers: {'Content-Type': 'application/json'},
    })
        .then((res) => {
            if (!res.ok)
                throw new Error(res.statusText);
            return res;
        })
        .then((res) => res.json());
    private fetchPostJson = (url: string, body?: any): Promise<any> => unfetch("https://" + this.router.domain + ":" + this.router.port + url, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: body ? JSON.stringify(body) : null
    })
        .then((res) => {
            if (!res.ok)
                throw new Error(res.statusText);
            return res;
        })
        .then((res) => res.json());

}
