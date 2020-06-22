import {DeviceEvents, DigitalStageAPI, RealtimeDatabaseDevice} from "../base";
import mediasoupClient from 'mediasoup-client'
import unfetch from 'isomorphic-unfetch'
import {Device as MediasoupClientDevice} from 'mediasoup-client/lib/Device'
import {MediasoupRouter} from './types'
import {getFastestRouter, getLocalAudioTracks, getLocalVideoTracks} from './utils'
import {RouterGetUrls, RouterPostUrls} from './queries'
import {Producer} from './types/Producer'
import {Consumer} from './types/Consumer'
import {DatabaseGlobalProducer} from "../base/types";
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
        const browser = detect();
        const caption: string = browser ? browser.os + "(" + browser.name + ")" : "";
        this.mLatestSnapshot = {
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
    }

    public connect(): Promise<boolean> {
        this.mDebug && this.mDebug.debug("connect()", this);
        return super.connect()
            .then(result => result ? getFastestRouter(this.mDebug) : null)
            .then(async (router: MediasoupRouter | null) => {
                    if (router) {
                        this.router = router
                        const rtpCapabilities: mediasoupClient.types.RtpCapabilities = await this.getRtpCapabilities()
                        if (!this.device.loaded)
                            await this.device.load({routerRtpCapabilities: rtpCapabilities})
                        this.sendTransport = await this.createWebRTCTransport('send')
                        this.receiveTransport = await this.createWebRTCTransport('receive')
                        this.emit('connected', true)
                        this.registerDeviceListeners();
                        return true;
                    }
                    return false;
                }
            )
    }

    public disconnect(): Promise<boolean> {
        this.mDebug && this.mDebug.debug("disconnect()", this);
        return super.disconnect()
            .then(result => {
                if (result) {
                    if (this.sendTransport) {
                        this.sendTransport.close()
                    }
                    if (this.receiveTransport) {
                        this.receiveTransport.close()
                    }
                    this.router = undefined
                }
                return result;
            })
    }

    private registerDeviceListeners() {
        this.mDebug && this.mDebug.debug("registerDeviceListeners()", this);
        this.on('sendAudio', (sendAudio: boolean) => {
            if (sendAudio) {
                this.mDebug && this.mDebug.debug("Activate sendAudio", this);
                getLocalAudioTracks().then((tracks: MediaStreamTrack[]) => {
                    this.mDebug && this.mDebug.debug("Sending in sum " + tracks.length + " audio tracks", this);
                    tracks.forEach((track: MediaStreamTrack) =>
                        this.createProducer(track)
                    )
                })
            } else {
                this.mDebug && this.mDebug.debug("Deactivate sendAudio", this);
                Object.keys(this.producers).forEach((trackId: string) => {
                    if (this.producers[trackId].producer.kind === 'audio')
                        return this.stopProducer(trackId)
                })
            }
        })
        this.on('sendVideo', (sendVideo: boolean) => {
            if (sendVideo) {
                this.mDebug && this.mDebug.debug("Activate sendVideo", this);
                getLocalVideoTracks().then((tracks: MediaStreamTrack[]) => {
                    this.mDebug && this.mDebug.debug("Sending in sum " + tracks.length + " video tracks", this);
                    tracks.forEach((track: MediaStreamTrack) =>
                        this.createProducer(track)
                    )
                })
            } else {
                this.mDebug && this.mDebug.debug("Deactivate sendVideo", this);
                Object.keys(this.producers).forEach((trackId: string) => {
                    if (this.producers[trackId].producer.kind === 'video')
                        return this.stopProducer(trackId)
                })
            }
        })
        this.on('receiveAudio', (receiveAudio: boolean) => {
            if (receiveAudio) {
                this.mDebug && this.mDebug.debug("Activate receiveAudio", this);
                Object.values(this.availableGlobalProducers).forEach(
                    (globalProducer: GlobalProducer) => {
                        if (globalProducer.kind === 'audio')
                            return this.createConsumer(globalProducer)
                    }
                )
            } else {
                this.mDebug && this.mDebug.debug("Deactivate receiveAudio", this);
                Object.values(this.consumers).forEach((consumer: Consumer) => {
                    if (consumer.globalProducer.kind === 'audio')
                        return this.closeConsumer(consumer.globalProducer.id)
                })
            }
        })
        this.on('receiveVideo', (receiveVideo: boolean) => {
            if (receiveVideo) {
                this.mDebug && this.mDebug.debug("Activate receiveVideo", this);
                Object.values(this.availableGlobalProducers).forEach(
                    (globalProducer: GlobalProducer) => {
                        if (globalProducer.kind === 'video')
                            return this.createConsumer(globalProducer)
                    }
                )
            } else {
                this.mDebug && this.mDebug.debug("Deactivate receiveVideo", this);
                Object.values(this.consumers).forEach((consumer: Consumer) => {
                    if (consumer.globalProducer.kind === 'video')
                        return this.closeConsumer(consumer.globalProducer.id)
                })
            }
        });
        this.mApi.on("producer-added", (event: ProducerEvent) => {
            this.mDebug && this.mDebug.debug("Handling new global producer " + event.id, this);
            this.availableGlobalProducers[event.id] = {
                ...event.producer,
                id: event.id
            } as GlobalProducer;
            if (
                (event.producer.kind === 'audio' && this.receiveAudio) ||
                (event.producer.kind === 'video' && this.receiveVideo)
            ) {
                return this.createConsumer(this.availableGlobalProducers[event.id]);
            }
        });
        this.mApi.on("producer-removed", (event: ProducerEvent) => {
            this.mDebug && this.mDebug.debug("Handling removal of global producer " + event.id, this);
            this.availableGlobalProducers = omit(this.availableGlobalProducers, event.id);
            if (this.consumers[event.id]) return this.closeConsumer(event.id)
        });
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


    protected createConsumer(
        globalProducer: GlobalProducer
    ): Promise<void> {
        this.mDebug && this.mDebug.debug("createConsumer(" + globalProducer.id + ")", this);
        if (!this.receiveTransport) {
            this.mDebug && this.mDebug.warn("createConsumer: no receive transport available", this);
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
                this.mDebug && this.mDebug.handleError(error, this);
            })
    }

    public pauseConsumer(globalProducerId: string): Promise<void> {
        this.mDebug && this.mDebug.debug('pauseConsumer(' + globalProducerId + ')', this);
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
                    this.mDebug && this.mDebug.handleError(error, this);
                })
        }
    }

    public resumeConsumer(globalProducerId: string): Promise<void> {
        this.mDebug && this.mDebug.debug('resumeConsumer(' + globalProducerId + ')', this);
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
                    this.mDebug && this.mDebug.handleError(error);
                })
        }
    }

    public closeConsumer(globalProducerId: string): Promise<void> {
        this.mDebug && this.mDebug.debug('closeConsumer(' + globalProducerId + ')', this);
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
                    this.mDebug && this.mDebug.handleError(error, this);
                })
        }
    }

    public createProducer(track: MediaStreamTrack): Promise<void> {
        this.mDebug && this.mDebug.debug('createProducer(' + track.id + ')', this);
        if (!this.sendTransport) {
            this.mDebug && this.mDebug.warn('createProducer: no send transport available', this);
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
                    this.mDebug && this.mDebug.debug('createProducer(' + track.id + '): pause', this);
                })
                producer.on('close', () => {
                    this.mDebug && this.mDebug.debug('createProducer(' + track.id + '): close', this);
                })
                this.producers[track.id] = {
                    producer: producer
                }
                this.emit('producer-added', this.producers[track.id])
                this.publishProducer(this.producers[track.id]);
            })
            .catch((error) => {
                this.mDebug && this.mDebug.handleError(error, this);
            })
    }

    public pauseProducer(track: MediaStreamTrack): Promise<void> {
        this.mDebug && this.mDebug.debug('pauseProducer(' + track.id + ')', this);
        if (this.producers[track.id] && !this.producers[track.id].producer.paused) {
            return this.fetchPostJson(RouterPostUrls.PauseProducer, {
                id: this.producers[track.id].producer.id
            })
                .then(() => {
                    this.producers[track.id].producer.pause()
                    this.emit('producer-paused', track.id)
                    this.emit('producer-changed', this.producers[track.id])
                })
                .catch((error) => {
                    this.mDebug && this.mDebug.handleError(error, this);
                })
        }
        return Promise.resolve();
    }

    public resumeProducer(track: MediaStreamTrack): Promise<void> {
        this.mDebug && this.mDebug.debug('resumeProducer(' + track.id + ')', this);
        if (this.producers[track.id] && this.producers[track.id].producer.paused) {
            return this.fetchPostJson(RouterPostUrls.ResumeProducer, {
                id: this.producers[track.id].producer.id
            })
                .then(() => {
                    this.producers[track.id].producer.resume()
                    this.emit('producer-resumed', this.producers[track.id])
                    this.emit('producer-changed', this.producers[track.id])
                })
                .catch((error) => {
                    this.mDebug && this.mDebug.handleError(error, this);
                })
        }
        return Promise.resolve();
    }

    public stopProducer(trackId: string): Promise<void> {
        this.mDebug && this.mDebug.debug('stopProducer(' + trackId + ')', this);
        if (this.producers[trackId]) {
            return this.fetchPostJson(RouterPostUrls.CloseProducer, {
                id: this.producers[trackId].producer.id
            })
                .then(() => {
                    this.producers[trackId].producer.close()
                    // Remove public offer
                    if (this.producers[trackId].globalProducerId)
                        this.mApi.unpublishProducer(this.producers[trackId].globalProducerId);
                    this.producers = omit(this.producers, trackId)
                    this.emit('producer-removed', trackId)
                })
                .catch((error) => {
                    this.mDebug && this.mDebug.handleError(error, this);
                })
        }
        return Promise.resolve();
    }

    private handleRemoteProducer = (
        querySnapshot: firebase.firestore.QuerySnapshot
    ) => {
        this.mDebug && this.mDebug.debug('handleRemoteProducer(...)', this);
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
        this.mDebug && this.mDebug.debug('publishProducer(' + producer.producer.id + ')', this);
        return this.mApi.publishProducer({
            uid: this.mApi.getUid(),
            deviceId: this.id,
            routerId: this.router ? this.router.id : 0,
            producerId: producer.producer.id,
            kind: producer.producer.kind
        } as DatabaseGlobalProducer)
            .then((producerId: string) => {
                this.mDebug && this.mDebug.debug("publishProducer(...): global producer ID: " + producerId, this);
                producer.globalProducerId = producerId;
                this.emit('producer-published', producerId);
            });
    }

    private async getRtpCapabilities(): Promise<mediasoupClient.types.RtpCapabilities> {
        this.mDebug && this.mDebug.debug('getRtpCapabilities()', this);
        return this.fetchGetJson(RouterGetUrls.GetRTPCapabilities)
    }

    private async createWebRTCTransport(
        type: 'send' | 'receive'
    ): Promise<mediasoupClient.types.Transport> {
        this.mDebug && this.mDebug.debug('createWebRTCTransport(' + type + ')', this);
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
                        this.mDebug && this.mDebug.warn('createWebRTCTransport(' + type + '): Disconnect by server side', this);
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
        this.mDebug && this.mDebug.debug('fetchGetJson(' + url + ')', this);
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
        this.mDebug && this.mDebug.debug('fetchPostJson(' + url + ')', this);
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
