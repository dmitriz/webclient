import {useCallback, useEffect, useState} from "react";
import LocalSoundjackDevice from "./LocalSoundjackDevice";

export default (user: firebase.User) => {
    const [localSoundjackDevice, setLocalSoundjackDevice] = useState<LocalSoundjackDevice>();
    const [sendAudio, setSendAudioInternal] = useState<boolean>();
    const [receiveAudio, setReceiveAudioInternal] = useState<boolean>();
    const [isAvailable, setAvailable] = useState<boolean>();

    useEffect(() => {
        if (user)
            setLocalSoundjackDevice(new LocalSoundjackDevice(user));
    }, [user])
    useEffect(() => {
        if (localSoundjackDevice) {
            localSoundjackDevice.on("send-audio", sendAudio => setSendAudioInternal(sendAudio));
            localSoundjackDevice.on("receive-audio", receiveAudio => setReceiveAudioInternal(receiveAudio));
            localSoundjackDevice.on("is-available", isAvailable => setAvailable(isAvailable));
        }
    }, [localSoundjackDevice]);

    const setSendAudio = useCallback((enable: boolean) => {
        return localSoundjackDevice.setSendAudio(enable)
    }, [localSoundjackDevice]);

    const setReceiveAudio = useCallback((enable: boolean) => {
        return localSoundjackDevice.setReceiveAudio(enable)
    }, [localSoundjackDevice]);

    return {
        sendAudio,
        setSendAudio,
        receiveAudio,
        setReceiveAudio,
        localSoundjackDevice,
        isAvailable
    }
}
