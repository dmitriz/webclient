import firebase from "firebase/app";
import "firebase/firestore";
import Ping from 'ping.js';
import {DatabaseRouter} from "./models";
import mediasoupClient from "mediasoup-client";
import {IAudioContext} from "standardized-audio-context";
import {MediasoupAudioTrack, MediasoupVideoTrack, MediaTrack} from "../../model";

export const getFastestRouter = (): Promise<DatabaseRouter> => {
    return new Promise<DatabaseRouter>((resolve, reject) => {
        return firebase
            .database()
            .ref("routers")
            .once("value")
            .then(async (snapshot: firebase.database.DataSnapshot) => {
                let fastestRouter: DatabaseRouter = null;
                let lowestLatency = -1;
                const p: Ping = new Ping({
                    favicon: "/ping"
                });
                console.log(snapshot.val());
                const routers: {
                    [id: string]: DatabaseRouter
                } = snapshot.val();
                for (const router of Object.values(routers)) {
                    const latency = await new Promise<number>((resolve, reject) => {
                        p.ping("https://" + router.domain + ":" + router.port, (err, data) => {
                            if (err)
                                return reject(data);
                            return resolve(data);
                        });
                    });
                    console.log("Latency of router " + router.domain + ": " + latency);
                    if (lowestLatency === -1 || lowestLatency > latency) {
                        fastestRouter = router;
                    }
                }
                if (fastestRouter) {
                    return resolve(fastestRouter);
                }
                return reject("No routers available");
            });
    });
}

export const getLocalAudioTracks = (): Promise<MediaStreamTrack[]> => {
    return navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {}
    })
        .then((stream: MediaStream) => stream.getAudioTracks())
}

export const getLocalVideoTracks = (): Promise<MediaStreamTrack[]> => {
    return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    })
        .then((stream: MediaStream) => stream.getVideoTracks())
}

export const createMediasoupMediaTrack = (id: string, consumer: mediasoupClient.types.Consumer, audioContext: IAudioContext): MediaTrack => {
    if (consumer.kind === "audio") {
        return new MediasoupAudioTrack(id, audioContext.createMediaStreamTrackSource(consumer.track));
    }
    return {
        id: id,
        type: "video",
        track: consumer.track
    } as MediasoupVideoTrack;
}
