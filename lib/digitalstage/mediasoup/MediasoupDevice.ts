import {Debugger, DeviceEvents, DigitalStageAPI, RealtimeDatabaseDevice} from "../base";
import mediasoupClient from 'mediasoup-client'
import unfetch from 'isomorphic-unfetch'
import {Device as MediasoupClientDevice} from 'mediasoup-client/lib/Device'
import {MediasoupRouter} from './types'
import {getFastestRouter, getLocalAudioTracks, getLocalVideoTracks} from './utils'
import {RouterGetUrls, RouterPostUrls} from './queries'
import {Producer} from './types/Producer'
import {Consumer} from './types/Consumer'
import {DatabaseDevice, DatabaseGlobalProducer} from "../base/types";
import {detect} from "detect-browser";
import {ProducerEvent} from "../base/api/DigitalStageAPI";

const omit = require('lodash.omit');

export type MediasoupEventType =
    | "connected"
    | "consumer-added"
    | "consumer-changed"
    | "consumer-paused"
    | "consumer-resumed"
    | "consumer-removed"
    | "producer-added"
    | "producer-changed"
    | "producer-paused"
    | "producer-resumed"
    | "producer-removed"
    | "producer-published";

export interface GlobalProducer extends DatabaseGlobalProducer {
    id: string
}

export class MediasoupDevice extends RealtimeDatabaseDevice {
    protected readonly device: MediasoupClientDevice
    protected connected: boolean = false
    protected router?: MediasoupRouter = undefined
    protected sendTransport?: mediasoupClient.types.Transport
    protected receiveTransport?: mediasoupClient.types.Transport
    protected stageId: string;
    protected availableGlobalProducers: {
        [globalProducerId: string]: GlobalProducer
    } = {}

    protected producers: {
        [trackId: string]: Producer
    } = {}

    protected consumers: {
        [globalProducerId: string]: Consumer
    } = {};


    constructor(api: DigitalStageAPI) {
        super(api, false);
        this.device = new MediasoupClientDevice();
    }


    private registerDeviceListeners() {
        Debugger.debug("registerDeviceListeners()", this);
        this.on('sendAudio', (sendAudio: boolean) => {
            Debugger.debug("sendAudio", this);
            console.log(sendAudio);
            if (sendAudio) {
                Debugger.debug("Activate sendAudio", this);
                getLocalAudioTracks().then((tracks: MediaStreamTrack[]) => {
                    Debugger.debug("Sending in sum " + tracks.length + " audio tracks", this);
                    tracks.forEach((track: MediaStreamTrack) =>
                        this.createProducer(track)
                    )
                })
            } else {
                Debugger.debug("Deactivate sendAudio", this);
                Object.keys(this.producers).forEach((trackId: string) => {
                    if (this.producers[trackId].producer.kind === 'audio')
                        return this.stopProducer(trackId)
                })
            }
        })
        this.on('sendVideo', (sendVideo: boolean) => {
            if (sendVideo) {
                Debugger.debug("Activate sendVideo", this);
                getLocalVideoTracks().then((tracks: MediaStreamTrack[]) => {
                    Debugger.debug("Sending in sum " + tracks.length + " video tracks", this);
                    tracks.forEach((track: MediaStreamTrack) =>
                        this.createProducer(track)
                    )
                })
            } else {
                Debugger.debug("Deactivate sendVideo", this);
                Object.keys(this.producers).forEach((trackId: string) => {
                    if (this.producers[trackId].producer.kind === 'video')
                        return this.stopProducer(trackId)
                })
            }
        })
        this.on('receiveAudio', (receiveAudio: boolean) => {
            if (receiveAudio) {
                Debugger.debug("Activate receiveAudio", this);
                Object.values(this.availableGlobalProducers).forEach(
                    (globalProducer: GlobalProducer) => {
                        if (globalProducer.kind === 'audio')
                            return this.createConsumer(globalProducer)
                    }
                )
            } else {
                Debugger.debug("Deactivate receiveAudio", this);
                Object.values(this.consumers).forEach((consumer: Consumer) => {
                    if (consumer.globalProducer.kind === 'audio')
                        return this.closeConsumer(consumer.globalProducer.id)
                })
            }
        })
        this.on('receiveVideo', (receiveVideo: boolean) => {
            if (receiveVideo) {
                Debugger.debug("Activate receiveVideo", this);
                Object.values(this.availableGlobalProducers).forEach(
                    (globalProducer: GlobalProducer) => {
                        if (globalProducer.kind === 'video')
                            return this.createConsumer(globalProducer)
                    }
                )
            } else {
                Debugger.debug("Deactivate receiveVideo", this);
                Object.values(this.consumers).forEach((consumer: Consumer) => {
                    if (consumer.globalProducer.kind === 'video')
                        return this.closeConsumer(consumer.globalProducer.id)
                })
            }
        });
        this.mApi.on("producer-added", (event: ProducerEvent) => {
            Debugger.debug("Handling new global producer " + event.id, this);
            this.availableGlobalProducers[event.id] = {
                ...event.producer,
                id: event.id
            } as GlobalProducer;
            if (
                (event.producer.kind === 'audio' && this.receiveAudio) ||
                (event.producer.kind === 'video' && this.receiveVideo)
            ) {
                this.createConsumer(this.availableGlobalProducers[event.id]);
            }
        });
        this.mApi.on("producer-removed", (event: ProducerEvent) => {
            Debugger.debug("Handling removal of global producer " + event.id, this);
            this.availableGlobalProducers = omit(this.availableGlobalProducers, event.id);
            if (this.consumers[event.id]) this.closeConsumer(event.id)
        });

        /*
        const userRef: firebase.firestore.DocumentReference = firebase.firestore().collection("users").doc(this.mApi.getUid());
        userRef
            .onSnapshot(snapshot => {
                const databaseUser: DatabaseUser = snapshot.data() as DatabaseUser;
                if (this.stageId !== databaseUser.stageId) {
                    this.stageId = databaseUser.stageId;
                    //TODO: We expect, that the stageId only change between something and undefined - not beween different stages
                    if (this.stageId) {
                        // Publish all local producers
                        Object.values(this.producers).forEach((producer: Producer) =>
                            this.publishProducerToStage(databaseUser.stageId, producer)
                        )
                        userRef
                            .collection('producers')
                            .onSnapshot(this.handleRemoteProducer)
                    } else {
                        // Un-publish all local producers
                        firebase
                            .firestore()
                            .collection('producers')
                            .where('deviceId', '==', this.id)
                            .get()
                            .then((snapshots: firebase.firestore.QuerySnapshot) =>
                                snapshots.forEach((snapshot) => snapshot.ref.delete())
                            )
                    }
                }
            });*/
    }

    public on(event: MediasoupEventType | DeviceEvents, listener: (arg: any) => void): this {
        return super.on(event, listener);
    }

    public once(event: MediasoupEventType | DeviceEvents, listener: (arg: any) => void): this {
        return super.once(event, listener);
    }

    public emit(event: MediasoupEventType | DeviceEvents, arg: any): boolean {
        return super.emit(event, arg);
    }

    public off(event: MediasoupEventType | DeviceEvents, listener: (arg: any) => void): this {
        return super.off(event, listener);
    }

    public connect(): Promise<void> {
        Debugger.debug("connect()", this);
        if (this.connected) {
            return Promise.resolve();
        }
        const browser = detect();
        const caption: string = browser ? browser.os + "(" + browser.name + ")" : "";
        const initialDatabaseDevice: DatabaseDevice = {
            uid: this.mApi.getUid(),
            name: "Browser",
            caption: caption,
            canAudio: true,
            canVideo: true,
            sendVideo: false,
            sendAudio: false,
            receiveAudio: false,
            receiveVideo: false,
            audioDevices: []
        };
        return this.mApi.registerDevice(this, initialDatabaseDevice)
            .then((deviceId: string) => this.setDeviceId(deviceId))
            .then(() => getFastestRouter())
            .then(async (router: MediasoupRouter) => {
                    this.router = router
                    const rtpCapabilities: mediasoupClient.types.RtpCapabilities = await this.getRtpCapabilities()
                    if (!this.device.loaded)
                        await this.device.load({routerRtpCapabilities: rtpCapabilities})
                    this.sendTransport = await this.createWebRTCTransport('send')
                    this.receiveTransport = await this.createWebRTCTransport('receive')
                    this.connected = true
                    this.emit('connected', true)
                }
            )
            .then(() => this.registerDeviceListeners())
            .catch((error) => {
                Debugger.handleError(error, this);
                alert('Video & Audio not available right now ... sorry :(')
                this.disconnect()
            });
    }

    public disconnect() {
        Debugger.debug("disconnect()", this);
        if (!this.connected) return
        if (this.sendTransport) {
            this.sendTransport.close()
        }
        if (this.receiveTransport) {
            this.receiveTransport.close()
        }
        this.emit('connected', false)
        this.router = undefined
        this.connected = false
    }

    protected async createConsumer(
        globalProducer: GlobalProducer
    ): Promise<void> {
        Debugger.debug("createConsumer(" + globalProducer.id + ")", this);
        if (!this.receiveTransport) {
            Debugger.warn("createConsumer: no receive transport available", this);
            return;
        }

        return this.fetchPostJson(RouterPostUrls.CreateConsumer, {
            globalProducerId: globalProducer.id,
            transportId: this.receiveTransport.id,
            rtpCapabilities: this.device.rtpCapabilities // TODO: Necessary?
        })
            .then(
                async (data: {
                    id: string
                    producerId: string
                    kind: 'audio' | 'video'
                    rtpParameters: mediasoupClient.types.RtpParameters
                    paused: boolean
                    type: 'simple' | 'simulcast' | 'svc' | 'pipe'
                }) => {
                    if (this.receiveTransport) {
                        const consumer = await this.receiveTransport.consume(data)
                        if (data.paused) consumer.pause()
                        return consumer
                    }
                    throw Error("Receive transport not initialized");
                }
            )
            .then((consumer: mediasoupClient.types.Consumer) => {
                this.consumers[globalProducer.id] = {
                    globalProducer: globalProducer,
                    consumer: consumer
                } as Consumer
                this.emit('consumer-added', this.consumers[globalProducer.id])
                return consumer.paused
            })
            .then((paused: boolean) => {
                if (paused)
                    return this.resumeConsumer(globalProducer.id)
            })
            .catch((error) => {
                Debugger.handleError(error, this);
            })
    }

    public async pauseConsumer(globalProducerId: string): Promise<void> {
        Debugger.debug('pauseConsumer(' + globalProducerId + ')', this);
        const consumer: Consumer = this.consumers[globalProducerId]
        if (consumer && !consumer.consumer.paused) {
            return this.fetchPostJson(RouterPostUrls.PauseConsumer, {
                id: consumer.consumer.id
            })
                .then(() => {
                    consumer.consumer.pause()
                    this.emit('consumer-paused', consumer)
                    this.emit('consumer-changed', consumer)
                })
                .catch((error) => {
                    Debugger.handleError(error, this);
                })
        }
    }

    public async resumeConsumer(globalProducerId: string): Promise<void> {
        Debugger.debug('resumeConsumer(' + globalProducerId + ')', this);
        const consumer: Consumer = this.consumers[globalProducerId]
        if (consumer && consumer.consumer.paused) {
            return this.fetchPostJson(RouterPostUrls.ResumeConsumer, {
                id: consumer.consumer.id
            })
                .then(() => {
                    consumer.consumer.resume()
                    this.emit('consumer-resumed', consumer)
                    this.emit('consumer-changed', consumer)
                })
                .catch((error) => {
                    Debugger.handleError(error);
                })
        }
    }

    public async closeConsumer(globalProducerId: string): Promise<void> {
        Debugger.debug('closeConsumer(' + globalProducerId + ')', this);
        const consumer: Consumer = this.consumers[globalProducerId]
        if (consumer) {
            return this.fetchPostJson(RouterPostUrls.CloseConsumer, {
                id: consumer.consumer.id
            })
                .then(() => {
                    consumer.consumer.close()
                    this.consumers = omit(this.consumers, globalProducerId)
                    this.emit('consumer-removed', consumer)
                })
                .catch((error) => {
                    Debugger.handleError(error, this);
                })
        }
    }

    public async createProducer(track: MediaStreamTrack): Promise<void> {
        Debugger.debug('createProducer(' + track.id + ')', this);
        if (!this.sendTransport) {
            Debugger.warn('createProducer: no send transport available', this);
            return;
        }
        return this.sendTransport
            .produce({
                track: track,
                appData: {
                    trackId: track.id
                }
            })
            .then((producer: mediasoupClient.types.Producer) => {
                producer.on('pause', () => {
                    Debugger.debug('createProducer(' + track.id + '): pause', this);
                })
                producer.on('close', () => {
                    Debugger.debug('createProducer(' + track.id + '): close', this);
                })
                this.producers[track.id] = {
                    producer: producer
                }
                this.emit('producer-added', this.producers[track.id])
                this.publishProducer(this.producers[track.id]);
            })
            .catch((error) => {
                Debugger.handleError(error, this);
            })
    }

    public async pauseProducer(track: MediaStreamTrack): Promise<void> {
        Debugger.debug('pauseProducer(' + track.id + ')', this);
        if (this.producers[track.id] && !this.producers[track.id].producer.paused) {
            this.fetchPostJson(RouterPostUrls.PauseProducer, {
                id: this.producers[track.id].producer.id
            })
                .then(() => {
                    this.producers[track.id].producer.pause()
                    this.emit('producer-paused', track.id)
                    this.emit('producer-changed', this.producers[track.id])
                })
                .catch((error) => {
                    Debugger.handleError(error, this);
                })
        }
    }

    public async resumeProducer(track: MediaStreamTrack): Promise<void> {
        Debugger.debug('resumeProducer(' + track.id + ')', this);
        if (this.producers[track.id] && this.producers[track.id].producer.paused) {
            this.fetchPostJson(RouterPostUrls.ResumeProducer, {
                id: this.producers[track.id].producer.id
            })
                .then(() => {
                    this.producers[track.id].producer.resume()
                    this.emit('producer-resumed', this.producers[track.id])
                    this.emit('producer-changed', this.producers[track.id])
                })
                .catch((error) => {
                    Debugger.handleError(error, this);
                })
        }
    }

    public async stopProducer(trackId: string): Promise<void> {
        Debugger.debug('stopProducer(' + trackId + ')', this);
        if (this.producers[trackId]) {
            return this.fetchPostJson(RouterPostUrls.CloseProducer, {
                id: this.producers[trackId].producer.id
            })
                .then(() => {
                    console.log("Closing local producer");
                    this.producers[trackId].producer.close()
                    // Remove public offer
                    console.log("Global ID: " + this.producers[trackId].globalProducerId);
                    if (this.producers[trackId].globalProducerId)
                        this.mApi.unpublishProducer(this.producers[trackId].globalProducerId);
                    this.producers = omit(this.producers, trackId)
                    this.emit('producer-removed', trackId)
                })
                .catch((error) => {
                    Debugger.handleError(error, this);
                })
        }
    }

    private handleRemoteProducer = (
        querySnapshot: firebase.firestore.QuerySnapshot
    ) => {
        Debugger.debug('handleRemoteProducer(...)', this);
        return querySnapshot
            .docChanges()
            .forEach((change: firebase.firestore.DocumentChange) => {
                    const globalProducer: DatabaseGlobalProducer = change.doc.data() as DatabaseGlobalProducer
                    if (change.type === 'added') {
                        this.availableGlobalProducers[change.doc.id] = {
                            ...globalProducer,
                            id: change.doc.id
                        }
                        if (
                            (globalProducer.kind === 'audio' && this.receiveAudio) ||
                            (globalProducer.kind === 'video' && this.receiveVideo)
                        ) {
                            this.createConsumer({
                                ...globalProducer,
                                id: change.doc.id
                            })
                        }
                    } else if (change.type === 'removed') {
                        this.availableGlobalProducers = omit(
                            this.availableGlobalProducers,
                            change.doc.id
                        )
                        if (this.consumers[change.doc.id]) this.closeConsumer(change.doc.id)
                    }
                }
            )
    }

    private publishProducer(producer: Producer) {
        Debugger.debug('publishProducer(' + producer.producer.id + ')', this);
        return this.mApi.publishProducer({
            uid: this.mApi.getUid(),
            deviceId: this.id,
            routerId: this.router ? this.router.id : 0,
            producerId: producer.producer.id,
            kind: producer.producer.kind
        } as DatabaseGlobalProducer)
            .then((producerId: string) => {
                Debugger.debug("publishProducer(...): global producer ID: " + producerId, this);
                producer.globalProducerId = producerId;
                this.emit('producer-published', producerId);
            });
    }

    private async getRtpCapabilities(): Promise<mediasoupClient.types.RtpCapabilities> {
        Debugger.debug('getRtpCapabilities()', this);
        return this.fetchGetJson(RouterGetUrls.GetRTPCapabilities)
    }

    private async createWebRTCTransport(
        type: 'send' | 'receive'
    ): Promise<mediasoupClient.types.Transport> {
        Debugger.debug('createWebRTCTransport(' + type + ')', this);
        return this.fetchGetJson(RouterGetUrls.CreateTransport).then(
            (transportOptions: mediasoupClient.types.TransportOptions) => {
                const transport: mediasoupClient.types.Transport =
                    type === 'send'
                        ? this.device.createSendTransport(transportOptions)
                        : this.device.createRecvTransport(transportOptions)
                transport.on(
                    'connect',
                    async ({dtlsParameters}, callback, errCallback) => {
                        return this.fetchPostJson(RouterPostUrls.ConnectTransport, {
                            transportId: transport.id,
                            dtlsParameters: dtlsParameters
                        })
                            .then(() => callback())
                            .catch((error) => errCallback(error))
                    }
                )
                transport.on('connectionstatechange', async (state) => {
                    if (
                        state === 'closed' ||
                        state === 'failed' ||
                        state === 'disconnected'
                    ) {
                        Debugger.warn('createWebRTCTransport(' + type + '): Disconnect by server side', this);
                    }
                })
                if (type === 'send') {
                    transport.on('produce', async (producer, callback, errCallback) => {
                        return this.fetchPostJson(RouterPostUrls.CreateProducer, {
                            transportId: transport.id,
                            kind: producer.kind,
                            rtpParameters: producer.rtpParameters,
                            appData: producer.appData
                        })
                            .then((payload: { id: string }) => {
                                producer.id = payload.id
                                return callback(producer)
                            })
                            .catch((error) => errCallback(error))
                    })
                }
                return transport
            }
        )
    }

    private fetchGetJson = (url: string): Promise<any> => {
        Debugger.debug('fetchGetJson(' + url + ')', this);
        return new Promise<any>((resolve, reject) => {
            if (!this.router) {
                return reject(new Error('Router not available'))
            }
            return unfetch(
                'https://' + this.router.domain + ':' + this.router.port + url,
                {
                    method: 'GET',
                    headers: {'Content-Type': 'application/json'}
                }
            )
                .then((response) => {
                    if (!response.ok) {
                        return reject(response.statusText)
                    }
                    return response.json()
                })
                .then((json: any) => resolve(json))
                .catch((error) => reject(new Error(error)));
        })
    }

    private fetchPostJson = (url: string, body?: any): Promise<any> => {
        Debugger.debug('fetchPostJson(' + url + ')', this);
        return new Promise<any>((resolve, reject) => {
            if (!this.router) {
                return reject(new Error('Router not available'))
            }
            return unfetch(
                'https://' + this.router.domain + ':' + this.router.port + url,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: body ? JSON.stringify(body) : null
                }
            )
                .then((response) => {
                    if (!response.ok) {
                        return reject(response.statusText)
                    }
                    return response.json()
                })
                .then((json: any) => resolve(json))
                .catch((error) => reject(new Error(error)));
        })
    }
}
