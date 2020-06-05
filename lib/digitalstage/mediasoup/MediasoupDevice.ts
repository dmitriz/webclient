import {AbstractDevice, types} from 'digitalstage-client-base'
import mediasoupClient from 'mediasoup-client'
import * as firebase from 'firebase/app'
import 'firebase/firestore'
import unfetch from 'isomorphic-unfetch'
const omit = require('lodash.omit');
import 'firebase/auth'
import {Device as MediasoupClientDevice} from 'mediasoup-client/lib/Device'
import {MediasoupRouter} from './types'
import {getFastestRouter, getLocalAudioTracks, getLocalVideoTracks} from './utils'
import {RouterGetUrls, RouterPostUrls} from './queries'
import {Producer} from './types/Producer'
import {Consumer} from './types/Consumer'

export interface GlobalProducer extends types.DatabaseGlobalProducer {
    id: string
}

export class MediasoupDevice extends AbstractDevice {
    protected readonly device: MediasoupClientDevice
    protected router?: MediasoupRouter = undefined
    protected sendTransport?: mediasoupClient.types.Transport
    protected receiveTransport?: mediasoupClient.types.Transport
    protected availableGlobalProducers: {
        [globalProducerId: string]: GlobalProducer
    } = {}

    protected producers: {
        [trackId: string]: Producer
    } = {}

    protected consumers: {
        [globalProducerId: string]: Consumer
    } = {}

    protected connected: boolean = false

    constructor(firebaseApp: firebase.app.App, user: firebase.User) {
        super(firebaseApp, user, 'Browser', {
            canVideo: true,
            canAudio: true
        })
        this.device = new MediasoupClientDevice();
        this.registerDeviceListeners()
    }

    private registerDeviceListeners() {
        this.on('send-audio', (sendAudio: boolean) => {
            console.log('SEND_AUDIO')
            if (sendAudio) {
                getLocalAudioTracks().then((tracks: MediaStreamTrack[]) => {
                    tracks.forEach((track: MediaStreamTrack) =>
                        this.createProducer(track)
                    )
                })
            } else {
                Object.keys(this.producers).forEach((trackId: string) => {
                    if (this.producers[trackId].producer.kind === 'audio')
                        this.stopProducer(trackId)
                })
            }
        })
        this.on('send-video', (sendVideo: boolean) => {
            console.log('SEND_VIDEO')
            if (sendVideo) {
                getLocalVideoTracks().then((tracks: MediaStreamTrack[]) => {
                    tracks.forEach((track: MediaStreamTrack) =>
                        this.createProducer(track)
                    )
                })
            } else {
                Object.keys(this.producers).forEach((trackId: string) => {
                    if (this.producers[trackId].producer.kind === 'video')
                        this.stopProducer(trackId)
                })
            }
        })
        this.on('receive-audio', (receiveAudio: boolean) => {
            if (receiveAudio) {
                Object.values(this.availableGlobalProducers).forEach(
                    (globalProducer: GlobalProducer) => {
                        console.log('HAVE GLOBAL PRODUCER')
                        if (globalProducer.kind === 'audio')
                            this.createConsumer(globalProducer)
                    }
                )
            } else {
                Object.values(this.consumers).forEach((consumer: Consumer) => {
                    if (consumer.globalProducer.kind === 'audio')
                        this.closeConsumer(consumer.globalProducer.id)
                })
            }
        })
        this.on('receive-video', (receiveVideo: boolean) => {
            if (receiveVideo) {
                Object.values(this.availableGlobalProducers).forEach(
                    (globalProducer: GlobalProducer) => {
                        console.log('HAVE GLOBAL PRODUCER')
                        if (globalProducer.kind === 'video')
                            this.createConsumer(globalProducer)
                    }
                )
            } else {
                Object.values(this.consumers).forEach((consumer: Consumer) => {
                    if (consumer.globalProducer.kind === 'video')
                        this.closeConsumer(consumer.globalProducer.id)
                })
            }
        })
        this.on(
            'stage-ref',
            async (stageRef: firebase.firestore.DocumentReference) => {
                if (stageRef) {
                    // Publish all local producers
                    Object.values(this.producers).forEach((producer: Producer) =>
                        this.publishProducerToStage(stageRef.id, producer)
                    )
                    this.userRef
                        .collection('producers')
                        .onSnapshot(this.handleRemoteProducer)
                } else {
                    // Un-publish all local producers
                    firebase
                        .firestore()
                        .collection('producers')
                        .where('deviceId', '==', this.getDeviceId())
                        .get()
                        .then((snapshots: firebase.firestore.QuerySnapshot) =>
                            snapshots.forEach((snapshot) => snapshot.ref.delete())
                        )
                }
            }
        )
    }

    public connect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.connected) return resolve()
            return getFastestRouter(this.firebaseApp)
                .then(async (router: MediasoupRouter) => {
                    this.router = router
                    const rtpCapabilities: mediasoupClient.types.RtpCapabilities = await this.getRtpCapabilities()
                    if (!this.device.loaded)
                        await this.device.load({routerRtpCapabilities: rtpCapabilities})
                    this.sendTransport = await this.createWebRTCTransport('send')
                    this.receiveTransport = await this.createWebRTCTransport('receive')
                    this.connected = true
                    this.emit('connected', true)
                    resolve()
                })
                .catch((error) => {
                    console.error(error)
                    alert('Video & Audio not available right now ... sorry :(')
                    this.disconnect()
                    reject(new Error('No router available'))
                })
        })
    }

    public disconnect() {
        if (!this.connected) return
        console.log('MEDIASOUP: disconnecting')
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
        if (!this.receiveTransport) return
        console.log('create consumer for ' + globalProducer.id);

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
                console.log('Paused: ' + paused)
                return this.resumeConsumer(globalProducer.id)
            })
    }

    public async pauseConsumer(globalProducerId: string): Promise<void> {
        console.log('pause consumer')
        const consumer: Consumer = this.consumers[globalProducerId]
        if (consumer && !consumer.consumer.paused) {
            return this.fetchPostJson(RouterPostUrls.PauseConsumer, {
                id: consumer.consumer.id
            }).then(() => {
                consumer.consumer.pause()
                this.emit('consumer-paused', consumer)
                this.emit('consumer-changed', consumer)
            })
        }
    }

    public async resumeConsumer(globalProducerId: string): Promise<void> {
        console.log('resume consumer')
        const consumer: Consumer = this.consumers[globalProducerId]
        if (consumer && consumer.consumer.paused) {
            return this.fetchPostJson(RouterPostUrls.ResumeConsumer, {
                id: consumer.consumer.id
            }).then(() => {
                console.log('really resume consumer')
                consumer.consumer.resume()
                this.emit('consumer-resumed', consumer)
                this.emit('consumer-changed', consumer)
            })
        }
    }

    public async closeConsumer(globalProducerId: string): Promise<void> {
        console.log('close consumer')
        const consumer: Consumer = this.consumers[globalProducerId]
        if (consumer) {
            return this.fetchPostJson(RouterPostUrls.CloseConsumer, {
                id: consumer.consumer.id
            }).then(() => {
                consumer.consumer.close()
                this.consumers = omit(this.consumers, globalProducerId)
                this.emit('consumer-removed', consumer)
            })
        }
    }

    public async createProducer(track: MediaStreamTrack): Promise<void> {
        if (!this.sendTransport) return
        console.log('create producer')
        return this.sendTransport
            .produce({
                track: track,
                appData: {
                    trackId: track.id
                }
            })
            .then((producer: mediasoupClient.types.Producer) => {
                console.log('First')
                producer.on('pause', () => {
                    console.log('pause')
                })
                producer.on('close', () => {
                    console.log('close')
                })
                this.producers[track.id] = {
                    producer: producer
                }
                console.log(producer.id)
                this.emit('producer-added', this.producers[track.id])
                const stageId: string | undefined = this.getStageId()
                if (stageId) {
                    this.publishProducerToStage(stageId, this.producers[track.id])
                }
            })
    }

    public async pauseProducer(track: MediaStreamTrack): Promise<void> {
        console.log('pause producer')
        if (this.producers[track.id] && !this.producers[track.id].producer.paused) {
            this.fetchPostJson(RouterPostUrls.PauseProducer, {
                id: this.producers[track.id].producer.id
            }).then(() => {
                this.producers[track.id].producer.pause()
                this.emit('producer-paused', track.id)
                this.emit('producer-changed', this.producers[track.id])
            })
        }
    }

    public async resumeProducer(track: MediaStreamTrack): Promise<void> {
        console.log('resume producer')
        if (this.producers[track.id] && this.producers[track.id].producer.paused) {
            this.fetchPostJson(RouterPostUrls.ResumeProducer, {
                id: this.producers[track.id].producer.id
            }).then(() => {
                this.producers[track.id].producer.resume()
                this.emit('producer-resumed', this.producers[track.id])
                this.emit('producer-changed', this.producers[track.id])
            })
        }
    }

    public async stopProducer(trackId: string): Promise<void> {
        console.log('stop producer')
        if (this.producers[trackId]) {
            this.fetchPostJson(RouterPostUrls.CloseProducer, {
                id: this.producers[trackId].producer.id
            }).then(() => {
                this.producers[trackId].producer.close()
                // Remove public offer
                if (this.producers[trackId].globalProducerId)
                    firebase
                        .firestore()
                        .collection('producers')
                        .doc(this.producers[trackId].globalProducerId)
                        .delete()
                this.producers = omit(this.producers, trackId)
                this.emit('producer-removed', trackId)
            })
        }
    }

    private handleRemoteProducer = (
        querySnapshot: firebase.firestore.QuerySnapshot
    ) => {
        return querySnapshot
            .docChanges()
            .forEach((change: firebase.firestore.DocumentChange) => {
                    const globalProducer: types.DatabaseGlobalProducer = change.doc.data() as types.DatabaseGlobalProducer
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

    private publishProducerToStage(stageId: string, producer: Producer) {
        return this.firebaseApp
            .firestore()
            .collection('producers')
            .add({
                uid: this.user.uid,
                deviceId: this.getDeviceId(),
                routerId: this.router ? this.router.id : 0,
                producerId: producer.producer.id,
                stageId: stageId,
                kind: producer.producer.kind
            } as types.DatabaseGlobalProducer)
            .then((ref: firebase.firestore.DocumentReference) => {
                console.log('Published global producer ' + ref.id)
                producer.globalProducerId = ref.id
                this.emit('producer-published', ref.id)
            })
    }

    private async getRtpCapabilities(): Promise<mediasoupClient.types.RtpCapabilities> {
        return this.fetchGetJson(RouterGetUrls.GetRTPCapabilities)
    }

    private async createWebRTCTransport(
        type: 'send' | 'receive'
    ): Promise<mediasoupClient.types.Transport> {
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
                    console.log('mediasoup: connectionstatechange ' + state)
                    if (
                        state === 'closed' ||
                        state === 'failed' ||
                        state === 'disconnected'
                    ) {
                        console.error('mediasoup: Disconnect by server side')
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
        console.log('fetchGetJson(' + url + ')')
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
                .catch((error) => reject(error));
        })
    }

    private fetchPostJson = (url: string, body?: any): Promise<any> => {
        console.log('fetchPostJson(' + url + ')')
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
                .catch((error) => reject(error));
        })
    }
}
