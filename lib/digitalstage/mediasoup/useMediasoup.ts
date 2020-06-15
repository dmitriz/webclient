import {MediasoupDevice} from './MediasoupDevice'
import {useCallback, useEffect, useState} from 'react'
import * as firebase from 'firebase/app'
import {Consumer, Producer} from "./types";
import {handleError} from "../../Debugger";
import {DigitalStageAPI} from "digitalstage-client-base";
import {useAudioContext} from "../../useAudioContext";

export const useMediasoup = (firebaseApp: firebase.app.App, api: DigitalStageAPI) => {
    const [connected, setConnected] = useState<boolean>(false)
    const [device, setDevice] = useState<MediasoupDevice>()
    const [sendAudio, setSendAudioInternal] = useState<boolean>()
    const [sendVideo, setSendVideoInternal] = useState<boolean>()
    const [receiveAudio, setReceiveAudioInternal] = useState<boolean>()
    const [receiveVideo, setReceiveVideoInternal] = useState<boolean>()
    const [producers, setProducers] = useState<Producer[]>([]);
    const [consumers, setConsumers] = useState<Consumer[]>([]);
    const {audioContext, createAudioContext} = useAudioContext();

    useEffect(() => {
        if (api) {
            const mediasoupDevice: MediasoupDevice = new MediasoupDevice(api)
            setDevice(mediasoupDevice)
        }
    }, [api])

    useEffect(() => {
        if (device) {
            device.on('connected', (isConnected) =>
                setConnected(isConnected)
            )
            device.on('sendAudio', (sendAudio) =>
                setSendAudioInternal(sendAudio)
            )
            device.on('sendVideo', (sendAudio) =>
                setSendVideoInternal(sendAudio)
            )
            device.on('receiveAudio', (receiveAudio) =>
                setReceiveAudioInternal(receiveAudio)
            )
            device.on('receiveVideo', (receiveVideo) =>
                setReceiveVideoInternal(receiveVideo)
            )
            device.on('consumer-added', (consumer: Consumer) =>
                setConsumers(prevState => [...prevState, consumer])
            )
            device.on('consumer-changed', (consumer: Consumer) =>
                setConsumers(prevState => prevState.map((c: Consumer) => c.consumer.id === consumer.consumer.id ? consumer : c))
            )
            device.on('consumer-removed', (consumer: Consumer) =>
                setConsumers(prevState => prevState.filter((c: Consumer) => c.consumer.id !== consumer.consumer.id))
            )
            device.on('producer-added', (producer: Producer) =>
                setProducers(prevState => [...prevState, producer])
            )
            device.on('producer-changed', (producer: Producer) =>
                setProducers(prevState => prevState.map((p: Producer) => p.globalProducerId === producer.globalProducerId ? producer : p))
            )
            device.on('producer-removed', (producer: Producer) =>
                setProducers(prevState => prevState.filter((p: Producer) => p.globalProducerId !== producer.globalProducerId))
            )
            device.connect()
                .catch((error) => handleError(error))
        }
    }, [device])

    const setSendAudio = useCallback(
        (enable: boolean) => {
            if (device && connected) {
                device.setSendAudio(enable)
                    .catch((error) => handleError(error))
            }
        },
        [connected, device]
    )
    const setSendVideo = useCallback(
        (enable: boolean) => {
            if (device && connected) {
                device.setSendVideo(enable)
                    .catch((error) => handleError(error))
            }
        },
        [connected, device]
    )
    const setReceiveAudio = useCallback(
        (enable: boolean) => {
            if (device && connected) {
                device
                    .setReceiveAudio(enable)
                    .catch((error) => handleError(error))
            }
        },
        [connected, device]
    )
    const setReceiveVideo = useCallback(
        (enable: boolean) => {
            if (device && connected && audioContext) {
                return audioContext.resume()
                    .then(() =>
                        device.setReceiveVideo(enable)
                            .catch((error) => handleError(error)));
            }
        },
        [connected, audioContext, device]
    )

    const connect = useCallback(() => {
        if (device) {
            device.connect()
                .catch((error) => handleError(error))
        }
    }, [device])

    const disconnect = useCallback(() => {
        if (device) {
            device.disconnect()
        }
    }, [device])

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
        device,
        producers,
        consumers
    }
}
