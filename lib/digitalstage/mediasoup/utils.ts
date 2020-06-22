import * as firebase from 'firebase/app'
import 'firebase/firestore'

import {MediasoupRouter} from './types'
import {DatabaseRouter} from '../base/types';
import {IDebugger} from "../base";

export const getFastestRouter = (debug?: IDebugger): Promise<MediasoupRouter> => {
    return new Promise<MediasoupRouter>((resolve, reject) => {
        let fastestRouter: MediasoupRouter
        return firebase
            .database()
            .ref('routers')
            .once('value')
            .then(async (snapshot: firebase.database.DataSnapshot) => {
                if (!snapshot.exists()) {
                    return reject(new Error('No routers available'))
                }
                const lowestLatency = -1
                const routers: {
                    [id: string]: DatabaseRouter
                } = snapshot.val()
                for (const routerId of Object.keys(routers)) {
                    const router: DatabaseRouter = routers[routerId]
                    const latency: number = await ping(
                        'https://' + router.domain + ':' + router.port + '/ping'
                    ).catch((err) => {
                        err.message = 'Could not ping router' + err.message;
                        debug && debug.handleError(err, "Mediasoup Utils")
                        return 99999
                    })
                    debug && debug.debug('Latency of router ' + router.domain + ': ' + latency, "Mediasoup Utils");
                    if (lowestLatency === -1 || lowestLatency > latency) {
                        fastestRouter = {
                            ...router,
                            id: routerId
                        }
                    }
                }
                if (fastestRouter) {
                    debug && debug.debug('USING ' + fastestRouter.domain, "Mediasoup Utils");
                    return resolve(fastestRouter)
                }
                return reject(new Error('No routers available'))
            })
    })
}

export const getLocalAudioTracks = (): Promise<MediaStreamTrack[]> => {
    return navigator.mediaDevices
        .getUserMedia({
            video: false,
            audio: {
                autoGainControl: false,
                channelCount: 1,
                echoCancellation: false,
                latency: 0,
                noiseSuppression: false,
                sampleRate: 48000,
                sampleSize: 2,
            }
        })
        .then((stream: MediaStream) => stream.getAudioTracks())
}

export const getLocalVideoTracks = (): Promise<MediaStreamTrack[]> => {
    return navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: false
        })
        .then((stream: MediaStream) => stream.getVideoTracks())
}

function requestImage(url: string) {
    return new Promise(function (resolve, reject) {
        const img = new Image()
        img.onload = function () {
            resolve(img)
        }
        img.onerror = function () {
            reject(url)
        }
        img.src =
            url +
            '?random-no-cache=' +
            Math.floor((1 + Math.random()) * 0x10000).toString(16)
    })
}

function ping(url: string, multiplier?: number): Promise<number> {
    return new Promise<number>(function (resolve, reject) {
        const start: number = new Date().getTime()
        const response = function () {
            let delta: number = new Date().getTime() - start
            delta *= multiplier || 1
            resolve(delta)
        }
        requestImage(url)
            .then(response)
            .catch(() => reject(Error('Error')))

        // Set a timeout for max-pings, 300ms.
        setTimeout(function () {
            reject(Error('Timeout'))
        }, 300)
    })
}
