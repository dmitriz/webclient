import firebase from "firebase/app";
import "firebase/firestore";
import Ping from 'ping.js';
import {DatabaseRouter} from "./models";

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

export const getFastestRouter2 = (): Promise<DatabaseRouter> => {
    return firebase
        .firestore()
        .collection("routers")
        .get()
        .then((querySnapshot: firebase.firestore.QuerySnapshot) => querySnapshot.docs)
        .then(async (docs: Array<firebase.firestore.QueryDocumentSnapshot>) => {
            const p: Ping = new Ping({
                favicon: "/ping"
            });
            let fastestRouter: DatabaseRouter = null;
            let lowestLatency = -1;
            for (const doc of docs) {
                const router: DatabaseRouter = {
                    id: doc.id,
                    ...doc.data()
                } as DatabaseRouter;
                const latency = await new Promise<number>((resolve, reject) => {
                    p.ping("https://" + router.domain + ":" + router.port, (err, data) => {
                        if (err)
                            return reject(data);
                        return resolve(data);
                    });
                })
                console.log("Latency of router " + router.domain + ": " + latency);
                if (lowestLatency === -1 || lowestLatency > latency) {
                    fastestRouter = router;
                }
            }
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
