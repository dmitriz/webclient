import {useCallback, useEffect, useState} from "react";
import {MediasoupDevice} from "./MediasoupDevice";
import {fixWebRTC} from "../../../../util/fixWebRTC";
import {Stage} from "../../client.model";
import firebase from "firebase/app";

export default (user: firebase.User, stage: Stage) => {
    const [connected, setConnected] = useState<boolean>(false);
    const [localMediasoupDevice, setLocalMediasoupDevice] = useState<MediasoupDevice>();
    const [sendAudio, setSendAudioInternal] = useState<boolean>();
    const [sendVideo, setSendVideoInternal] = useState<boolean>();
    const [receiveAudio, setReceiveAudioInternal] = useState<boolean>();
    const [receiveVideo, setReceiveVideoInternal] = useState<boolean>();

    useEffect(() => {
        if (user && stage) {
            const mediasoupDevice: MediasoupDevice = new MediasoupDevice(user);
            mediasoupDevice.on("connected", (isConnected) => setConnected(isConnected));
            setLocalMediasoupDevice(mediasoupDevice);
        }
    }, [user, stage]);
/*
    useEffect(() => {
        if (localMediasoupDevice && stage) {
            fixWebRTC();
            localMediasoupDevice.connect();
        }
    }, [localMediasoupDevice, stage])*/

    useEffect(() => {
        if (localMediasoupDevice) {
            localMediasoupDevice.on("send-audio", sendAudio => setSendAudioInternal(sendAudio));
            localMediasoupDevice.on("send-video", sendAudio => setSendVideoInternal(sendAudio));
            localMediasoupDevice.on("receive-audio", receiveAudio => setReceiveAudioInternal(receiveAudio));
            localMediasoupDevice.on("receive-video", receiveVideo => setReceiveVideoInternal(receiveVideo));
        }
    }, [localMediasoupDevice]);

    const setSendAudio = useCallback((enable: boolean) => {
        if (connected) {
            return localMediasoupDevice.setSendAudio(enable);
        }
    }, [connected, localMediasoupDevice]);
    const setSendVideo = useCallback((enable: boolean) => {
        if (connected) {
            return localMediasoupDevice.setSendVideo(enable);
        }
    }, [connected, localMediasoupDevice]);
    const setReceiveAudio = useCallback((enable: boolean) => {
        if (connected) {
            return localMediasoupDevice.setReceiveAudio(enable);
        }
    }, [connected, localMediasoupDevice]);
    const setReceiveVideo = useCallback((enable: boolean) => {
        if (connected) {
            return localMediasoupDevice.setReceiveVideo(enable);
        }
    }, [connected, localMediasoupDevice]);

    const connect = useCallback(() => {
        return localMediasoupDevice.connect();
    }, [localMediasoupDevice]);

    const disconnect = useCallback(() => {
        return localMediasoupDevice.disconnect();
    }, [localMediasoupDevice]);

    return {
        connect,
        disconnect,
        connected,
        sendAudio,
        setSendAudio,
        receiveAudio,
        setReceiveAudio,
        sendVideo,
        setSendVideo,
        receiveVideo,
        setReceiveVideo,
        localMediasoupDevice
    }
};
