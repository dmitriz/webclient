import {MediasoupDevice} from './MediasoupDevice'
import {useCallback, useEffect, useState} from 'react'
import * as firebase from 'firebase/app'
import {Consumer, Producer} from "./types";

export const useMediasoup = (firebaseApp: firebase.app.App, user: firebase.User) => {
    const [connected, setConnected] = useState<boolean>(false)
    const [device, setDevice] = useState<MediasoupDevice>()
    const [sendAudio, setSendAudioInternal] = useState<boolean>()
    const [sendVideo, setSendVideoInternal] = useState<boolean>()
    const [receiveAudio, setReceiveAudioInternal] = useState<boolean>()
    const [receiveVideo, setReceiveVideoInternal] = useState<boolean>()
    const [producers, setProducers] = useState<Producer[]>([]);
    const [consumers, setConsumers] = useState<Consumer[]>([]);

    useEffect(() => {
        if (user) {
            const mediasoupDevice: MediasoupDevice = new MediasoupDevice(firebaseApp, user)
            mediasoupDevice.on('connected', (isConnected) =>
                setConnected(isConnected)
            )
            setDevice(mediasoupDevice)
        }
    }, [user])

    useEffect(() => {
        if (device) {
            device.on('send-audio', (sendAudio) =>
                setSendAudioInternal(sendAudio)
            )
            device.on('send-video', (sendAudio) =>
                setSendVideoInternal(sendAudio)
            )
            device.on('receive-audio', (receiveAudio) =>
                setReceiveAudioInternal(receiveAudio)
            )
            device.on('receive-video', (receiveVideo) =>
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
        }
    }, [device])

    const setSendAudio = useCallback(
        (enable: boolean) => {
            if (device && connected) {
                device.setSendAudio(enable)
            }
        },
        [connected, device]
    )
    const setSendVideo = useCallback(
        (enable: boolean) => {
            if (device && connected) {
                device.setSendVideo(enable)
            }
        },
        [connected, device]
    )
    const setReceiveAudio = useCallback(
        (enable: boolean) => {
            if (device && connected) {
                device.setReceiveAudio(enable)
            }
        },
        [connected, device]
    )
    const setReceiveVideo = useCallback(
        (enable: boolean) => {
            if (device && connected) {
                device.setReceiveVideo(enable)
            }
        },
        [connected, device]
    )

    const connect = useCallback(() => {
        if (device) {
            device.connect()
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
