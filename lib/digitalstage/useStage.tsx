import {useAuth} from "../useAuth";
import {useEffect, useState} from "react";
import {DigitalStageAPI, IDevice, RealtimeDatabaseAPI, RemoteDevice} from "./base";
import {DeviceEvent, MemberEvent, ProducerEvent, SoundjackEvent, VolumeEvent} from "./base/api/DigitalStageAPI";
import {MediasoupDevice} from "./mediasoup";
import {Consumer} from "./mediasoup/types";
import {WebDebugger} from "./WebDebugger";
import video from "../../pages/tests/video";
import omit from "lodash.omit";

export interface IVolumeControl {
    volume: number;

    setVolume(volume: number);
}

export interface IConsumer {
    id: string;
    track: MediaStreamTrack;
}

export interface IVideoProducer extends IProducer {
}

export interface IAudioProducer extends IProducer, IVolumeControl {
}

export interface ISoundjack extends IVolumeControl {
    id: string;
    ipv4: string;
    ipv6: string;
}

export interface IProducer {
    id: string;
    consumer?: IConsumer;
}

export interface IMember extends IVolumeControl {
    uid: string;
    name: string;
    online?: boolean;
    audioProducers?: {
        [id: string]: IAudioProducer
    };
    videoProducers?: {
        [id: string]: IVideoProducer
    };
    soundjacks?: {
        [id: string]: ISoundjack
    };
}

const debug = new WebDebugger();

export const useStage = () => {
    const {user} = useAuth();
    const [api, setApi] = useState<DigitalStageAPI>(undefined);
    const [localDevice, setLocalDevice] = useState<MediasoupDevice>(undefined);
    const [devices, setDevices] = useState<IDevice[]>([]);
    const [error, setError] = useState<Error>(undefined);
    const [initialized, setInitialized] = useState<boolean>(false);

    const [members, setMembers] = useState<{
        [uid: string]: IMember
    }>({});

    const handleError = (error: Error) => {
        setError(error);
    }

    useEffect(() => {
        // Clean up on unmount
        return () => {
            debug.debug("Clean up on unmount", "useStage");
            if (api) {
                api.disconnect();
                api.removeAllListeners();
            }
            if (localDevice)
                return localDevice.disconnect();
        }
    }, [])

    useEffect(() => {
        if (user) {
            const api = new RealtimeDatabaseAPI(user);
            api.setDebug(debug);
            setApi(api);
            const localDevice = new MediasoupDevice(api);
            localDevice.setDebug(debug);
            setLocalDevice(localDevice);
        } else {
            if (api) {
                api.disconnect();
                api.removeAllListeners();
                setApi(undefined);
                localDevice.disconnect()
                    .then(() => setLocalDevice(undefined))
                    .catch(handleError);
            }
        }
    }, [user]);

    useEffect(() => {
        if (api && localDevice && !initialized) {
            api.on("member-added", (event: MemberEvent) => setMembers(prevState => ({
                ...prevState,
                [event.uid]: {
                    ...prevState[event.uid],
                    name: event.member.displayName,
                    online: event.member.online,
                    volume: prevState[event.uid].volume || 0,
                    setVolume: prevState[event.uid].setVolume || ((v) => api.setRemoteMasterVolume(event.uid, v))
                }
            })));
            api.on("member-changed", (event: MemberEvent) => setMembers(prevState => ({
                ...prevState,
                [event.uid]: {
                    ...prevState[event.uid],
                    name: event.member.displayName,
                    online: event.member.online,
                    volume: prevState[event.uid].volume || 0,
                    setVolume: prevState[event.uid].setVolume || ((v) => api.setRemoteMasterVolume(event.uid, v))
                }
            })));
            api.on("member-removed", (event: MemberEvent) => setMembers(
                prevState => omit(prevState, event.uid)
            ));
            api.on("producer-added", (event: ProducerEvent) => setMembers(
                prevState => {
                    const audioProducer: IAudioProducer = event.producer.kind === "audio" ? {
                        id: event.id,
                        volume: event.producer.volume ? event.producer.volume : 0,
                        setVolume: v => api.setRemoteProducerVolume(event.id, v)
                    } : undefined;
                    const videoProducer: IVideoProducer = event.producer.kind === "video" ? {
                        id: event.id
                    } : undefined;

                    if (audioProducer) {
                        setAudioProducers(prevState => ({
                            ...prevState,
                            [event.producer.uid]: {
                                ...prevState[event.producer.uid],
                                [event.id]: audioProducer
                            }
                        }));
                    } else if (videoProducer) {
                        setVideoProducers(prevState => ({
                            ...prevState,
                            [event.producer.uid]: {
                                ...prevState[event.producer.uid],
                                [event.id]: videoProducer
                            }
                        }));
                    }
                    return prevState.map(m => {
                        if (m.uid === event.producer.uid) {
                            if (audioProducer) {
                                m.audioProducers.push(audioProducer);
                            } else if (videoProducer) {
                                m.videoProducers.push(videoProducer);
                            }
                        }
                        return m;
                    });
                }
            ));
            api.on("producer-changed", (event: ProducerEvent) => {
                if (event.producer.kind === "audio") {
                    setAudioProducers(prevState => ({
                        ...prevState,
                        [event.producer.uid]: omit(prevState[event.producer.uid], event.id)
                    }));
                    setMembers(
                        prevState => prevState.map(m => {
                            if (m.uid === event.producer.uid) {
                                const audioProducer = m.audioProducers.find(ap => ap.id === event.id);
                                if (audioProducer) {
                                    audioProducer.volume = event.producer.volume;
                                }
                            }
                            return m;
                        })
                    )
                }
            });
            api.on("producer-removed", (event: ProducerEvent) => setMembers(
                prevState => {
                    if (event.producer.kind === "audio") {
                        setAudioProducers(prevState => ({
                            ...prevState,
                            [event.producer.uid]: omit(prevState[event.producer.uid], event.id)
                        }));
                        return prevState.map(m => {
                            if (m.uid === event.producer.uid) {
                                m.audioProducers = m.audioProducers.filter(p => p.id !== event.id);
                            }
                            return m;
                        })
                    } else {
                        setVideoProducers(prevState => ({
                            ...prevState,
                            [event.producer.uid]: omit(prevState[event.producer.uid], event.id)
                        }));
                        return prevState.map(m => {
                            if (m.uid === event.producer.uid) {
                                m.videoProducers = m.videoProducers.filter(p => p.id !== event.id);
                            }
                            return m;
                        })
                    }
                }
            ));

            api.on("soundjack-added", (event: SoundjackEvent) => {
                const soundjack: ISoundjack = {
                    id: event.id,
                    ipv4: event.soundjack.ipv4,
                    ipv6: event.soundjack.ipv6,
                    volume: event.soundjack.volume ? event.soundjack.volume : 0,
                    setVolume: v => api.setRemoteSoundjackVolume(event.id, v)
                };
                setSoundjacks(prevState => ({
                    ...prevState,
                    [event.soundjack.uid]: {
                        ...prevState[event.soundjack.uid],
                        [event.id]: soundjack
                    }
                }));
                setMembers(
                    prevState => {
                        return prevState.map(m => {
                            if (m.uid === event.soundjack.uid) {
                                m.soundjacks.push(soundjack)
                            }
                            return m;
                        });
                    }
                )
            });

            api.on("soundjack-changed", (event: SoundjackEvent) => {
                setSoundjacks(prevState => ({
                    ...prevState,
                    [event.soundjack.uid]: {
                        ...prevState[event.soundjack.uid],
                        [event.id]: {
                            ...prevState[event.soundjack.uid][event.id],
                            volume: event.soundjack.volume
                        }
                    }
                }));
                setMembers(
                    prevState => prevState.map(m => {
                        if (m.uid === event.soundjack.uid) {
                            const soundjack = m.soundjacks.find(ap => ap.id === event.id);
                            if (soundjack) {
                                soundjack.volume = event.soundjack.volume;
                            }
                        }
                        return m;
                    })
                )
            });

            api.on("soundjack-removed", (event: SoundjackEvent) => {
                setSoundjacks(prevState => ({
                    ...prevState,
                    [event.soundjack.uid]: omit(prevState[event.soundjack.uid], event.id)
                }));
                setMembers(
                    prevState => prevState.map(m => {
                        if (m.uid === event.soundjack.uid) {
                            m.soundjacks = m.soundjacks.filter(p => p.id !== event.id);
                        }
                        return m;
                    })
                )
            });

            api.on("volume-changed", (event: VolumeEvent) => setMembers(
                prevState => prevState.map(m => {
                    if (m.uid === event.uid) {
                        m.volume = event.volume;
                    }
                    return m;
                })
            ))

            api.on("device-added", (event: DeviceEvent) => setDevices(
                prevState => {
                    const device = localDevice && localDevice.id === event.id ? localDevice : new RemoteDevice(api, event.id, event.device);
                    device.on("device-changed", () => setDevices(prevState => prevState));
                    return [...prevState, device];
                }
            ))

            api.on("device-changed", () => setDevices(
                prevState => [...prevState]
            ))

            api.on("device-removed", (event: DeviceEvent) => setDevices(
                prevState => prevState.filter(device => {
                    if (device.id === event.id) {
                        device.removeAllListeners();
                        return true;
                    }
                    return false;
                })
            ))

            localDevice.on("device-changed", device => setLocalDevice(device));

            localDevice.on("consumer-added", (consumer: Consumer) => setMembers(
                prevState => prevState.map(member => {
                    if (member.uid === consumer.globalProducer.uid) {
                        const producer: IProducer = member.videoProducers.concat(member.audioProducers).find(producer => producer.id === consumer.globalProducer.id);
                        if (producer) {
                            producer.consumer = {
                                id: consumer.consumer.id,
                                track: consumer.consumer.track
                            };
                        }
                    }
                    return member;
                })
            ));

            localDevice.on("consumer-removed", (consumer: Consumer) => setMembers(
                prevState => prevState.map(member => {
                    if (member.uid === consumer.globalProducer.uid) {
                        if (consumer.consumer.kind === "audio") {
                            const producer: IProducer = member.audioProducers.find(producer => producer.id === consumer.globalProducer.id);
                            if (producer) {
                                producer.consumer = undefined;
                            }
                        } else {
                            const producer: IProducer = member.videoProducers.find(producer => producer.id === consumer.globalProducer.id);
                            if (producer) {
                                producer.consumer = undefined;
                            }
                        }
                    }
                    return member;
                })
            ));


            api.registerDevice(localDevice)
                .then(deviceId => localDevice.setDeviceId(deviceId))
                .then(() => api.connect())
                .then(() => localDevice.connect())
                .then(() => localDevice.setReceiveAudio(true))
                .catch(handleError);
            setInitialized(true);
        }
    }, [api, localDevice, soundjacks, audioProducers, videoProducers])

    useEffect(() => {
        console.log("AUDIO PRODUCERS IS NOW:");
        console.log(audioProducers);
    }, [audioProducers]);

    useEffect(() => {
        console.log("SOUNDJACKS IS NOW:");
        console.log(soundjacks);

        /*
        setMembers(prevState => prevState.map(
            member => {
                Object.values(soundjacks[member.uid])
                    .forEach(soundjack => !member.soundjacks.find(sj => sj.id === soundjack.id) && member.soundjacks.push(soundjack))
                return member;
            }
        ))*/

    }, [soundjacks]);

    return {
        members,
        error,
        localDevice,
        devices
    }
};
