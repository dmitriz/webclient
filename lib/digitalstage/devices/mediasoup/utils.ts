import firebase from "firebase";
import Ping from 'ping.js';
import {DatabaseRouter} from "./models";

export const getFastestRouter = (): Promise<DatabaseRouter> => {
    return firebase
        .firestore()
        .collection("routers")
        .get()
        .then((querySnapshot: firebase.firestore.QuerySnapshot) => querySnapshot.docs)
        .then(async (docs: Array<firebase.firestore.QueryDocumentSnapshot>) => {
            const p: Ping = new Ping();
            let fastestRouter: DatabaseRouter = null;
            let lowestLatency = -1;
            for (const doc of docs) {
                const router: DatabaseRouter = {
                    id: doc.id,
                    ...doc.data()
                } as DatabaseRouter;
                const latency = await p.ping("https://" + router.domain + ":" + router.port);
                console.log("Latency of router " + router.domain + ": " + latency);
                if (lowestLatency === -1 || lowestLatency > latency) {
                    fastestRouter = router;
                }
            }
            if (fastestRouter)
                return fastestRouter;
        })
};

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
