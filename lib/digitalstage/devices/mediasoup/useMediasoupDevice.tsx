import {useCallback, useEffect, useState} from "react";
import {MediasoupDevice} from "./MediasoupDevice";
import {fixWebRTC} from "../../../../util/fixWebRTC";

export default (user: firebase.User) => {
    const [localMediasoupDevice, setLocalMediasoupDevice] = useState<MediasoupDevice>();
    const [sendAudio, setSendAudioInternal] = useState<boolean>();
    const [sendVideo, setSendVideoInternal] = useState<boolean>();
    const [receiveAudio, setReceiveAudioInternal] = useState<boolean>();
    const [receiveVideo, setReceiveVideoInternal] = useState<boolean>();

    useEffect(() => {
        if (user) {
            fixWebRTC();
            setLocalMediasoupDevice(new MediasoupDevice(user));
        }
    }, [user])

    useEffect(() => {
        if (localMediasoupDevice) {
            localMediasoupDevice.on("send-audio", sendAudio => setSendAudioInternal(sendAudio));
            localMediasoupDevice.on("send-video", sendAudio => setSendVideoInternal(sendAudio));
            localMediasoupDevice.on("receive-audio", receiveAudio => setReceiveAudioInternal(receiveAudio));
            localMediasoupDevice.on("receive-video", receiveVideo => setReceiveVideoInternal(receiveVideo));
        }
    }, [localMediasoupDevice]);

    const setSendAudio = useCallback((enable: boolean) => {
        return localMediasoupDevice.setSendAudio(enable)
    }, [localMediasoupDevice]);
    const setSendVideo = useCallback((enable: boolean) => {
        return localMediasoupDevice.setSendVideo(enable)
    }, [localMediasoupDevice]);
    const setReceiveAudio = useCallback((enable: boolean) => {
        return localMediasoupDevice.setReceiveAudio(enable)
    }, [localMediasoupDevice]);
    const setReceiveVideo = useCallback((enable: boolean) => {
        return localMediasoupDevice.setReceiveVideo(enable)
    }, [localMediasoupDevice]);

    return {
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
