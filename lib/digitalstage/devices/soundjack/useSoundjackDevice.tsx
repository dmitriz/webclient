import {useCallback, useEffect, useState} from "react";
import LocalSoundjackDevice from "./LocalSoundjackDevice";
import firebase from "firebase/app";
import {Stage} from "../../client.model";

export default (user: firebase.User, stage: Stage) => {
    const [connected, setConnected] = useState<boolean>(false);
    const [localSoundjackDevice, setLocalSoundjackDevice] = useState<LocalSoundjackDevice>();
    const [sendAudio, setSendAudioInternal] = useState<boolean>();
    const [receiveAudio, setReceiveAudioInternal] = useState<boolean>();

    useEffect(() => {
        if (user && stage) {
            const localSoundjackDevice = new LocalSoundjackDevice(user);
            localSoundjackDevice.on("connected", (isConnected) => setConnected(isConnected));
            setLocalSoundjackDevice(localSoundjackDevice);
        }
    }, [user, stage])
    useEffect(() => {
        if (localSoundjackDevice) {
            localSoundjackDevice.on("send-audio", sendAudio => setSendAudioInternal(sendAudio));
            localSoundjackDevice.on("receive-audio", receiveAudio => setReceiveAudioInternal(receiveAudio));
        }
    }, [localSoundjackDevice]);

    const setSendAudio = useCallback((enable: boolean) => {
        if( enable ) {
            const audio = new Audio('easter.mp3');
            audio.play();
        }

        return localSoundjackDevice.setSendAudio(enable)
    }, [localSoundjackDevice]);

    const setReceiveAudio = useCallback((enable: boolean) => {
        return localSoundjackDevice.setReceiveAudio(enable)
    }, [localSoundjackDevice]);

    const connect = useCallback(() => {
        return localSoundjackDevice.connect();
    }, [localSoundjackDevice]);

    const disconnect = useCallback(() => {
        return localSoundjackDevice.disconnect();
    }, [localSoundjackDevice]);

    return {
        connected,
        connect,
        disconnect,
        sendAudio,
        setSendAudio,
        receiveAudio,
        setReceiveAudio,
        localSoundjackDevice
    }
}
