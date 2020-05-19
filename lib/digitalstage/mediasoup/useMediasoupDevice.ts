import {Device, useDevice} from "./../useDevice";
import firebase from "firebase/app";
import "firebase/database";
import {useEffect, useState} from "react";
import mediasoupClient from "mediasoup-client";
import {MediasoupStageConnection} from "./MediasoupAPI";

export interface MediasoupConsumer {
    uid: string;
    consumer: mediasoupClient.types.Consumer;
}

export interface MediasoupDevice extends Device {
    consumers: {
        [globalProducerId: string]: MediasoupConsumer
    };
}

export const useMediasoupDevice = (user: firebase.User) => {
    const [userRef, setUserRef] = useState<firebase.database.Reference>();
    const [mediasoupConnection, setMediasoupConnection] = useState<MediasoupStageConnection>();
    const [consumers, setConsumers] = useState<{
        [globalProducerId: string]: MediasoupConsumer
    }>({});
    const device: Device = useDevice(user, {
        canVideo: true,
        canAudio: true
    });

    useEffect(() => {
        if (user) {
            const mediasoup: MediasoupStageConnection = new MediasoupStageConnection(user);
            mediasoup.connect()
                .then(() => {
                    setMediasoupConnection(mediasoup);
                })
                .catch((error) => console.error(error));
            setUserRef(
                firebase
                    .database()
                    .ref("users/" + user.uid)
            );
        }
    }, [user]);

    useEffect(() => {
        if (mediasoupConnection) {
            if (device.sendAudio) {
                if (!mediasoupConnection.isConnected()) {
                    console.error("Mediasoup not ready");
                    device.setSendAudio(false);
                }
                navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                })
                    .then((stream: MediaStream) => stream.getAudioTracks().forEach(track => mediasoupConnection.createProducer(track).then(() => setPublishedTracks(prev => [...prev, track]))));
            } else {
                publishedTracks.forEach((track) => {
                    if (track.kind === "audio") {
                        mediasoupConnection.stopProducer(track).then(() => setPublishedTracks(prev => prev.filter((t) => t.id !== track.id)));
                    }
                });
            }
        }
    }, [mediasoupConnection, device.sendAudio]);

    const [publishedTracks, setPublishedTracks] = useState<MediaStreamTrack[]>([]);

    useEffect(() => {
        if (mediasoupConnection) {
            if (device.sendVideo) {
                if (!mediasoupConnection.isConnected()) {
                    console.error("Mediasoup not ready");
                    device.setSendVideo(false);
                }
                navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                })
                    .then((stream: MediaStream) => stream.getVideoTracks().forEach(track => mediasoupConnection.createProducer(track).then(() => setPublishedTracks(prev => [...prev, track]))));
            } else {
                publishedTracks.forEach((track) => {
                    if (track.kind === "video") {
                        mediasoupConnection.stopProducer(track).then(() => setPublishedTracks(prev => prev.filter((t) => t.id !== track.id)));
                    }
                });
            }
        }
    }, [mediasoupConnection, device.sendVideo]);

    useEffect(() => {
        if (mediasoupConnection)
            mediasoupConnection.consumeAutomaticallyVideo(device.receiveVideo);
    }, [mediasoupConnection, device.receiveVideo]);

    useEffect(() => {
        if (mediasoupConnection)
            mediasoupConnection.consumeAutomaticallyAudio(device.receiveAudio);
    }, [mediasoupConnection, device.receiveAudio]);

    return {
        ...device,
        consumers
    }
};
