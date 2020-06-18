import {useAuth} from "../useAuth";
import {useEffect, useState} from "react";
import {Debugger, DigitalStageAPI, IDevice, RealtimeDatabaseAPI, RemoteDevice} from "./base";
import {DeviceEvent, MemberEvent, ProducerEvent, VolumeEvent} from "./base/api/DigitalStageAPI";
import {MediasoupDevice} from "./mediasoup";
import {Consumer} from "./mediasoup/types";

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
    audioProducers: IAudioProducer[];
    videoProducers: IVideoProducer[];
    soundjacks: ISoundjack[];
}

export const useStage = () => {
    const {user} = useAuth();
    const [api, setApi] = useState<DigitalStageAPI>(undefined);
    const [localDevice, setLocalDevice] = useState<MediasoupDevice>(undefined);
    const [devices, setDevices] = useState<IDevice[]>([]);
    const [members, setMembers] = useState<IMember[]>([]);
    const [error, setError] = useState<Error>(undefined);

    const handleError = (error: Error) => {
        setError(error);
    }

    useEffect(() => {
        // Clean up on unmount
        return () => {
            Debugger.debug("Clean up on unmount", "useStage");
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
            setApi(api);
            setLocalDevice(new MediasoupDevice(api));
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
        if (api && localDevice) {
            api.on("member-added", (event: MemberEvent) => setMembers(
                prevState => [...prevState, {
                    uid: event.uid,
                    audioProducers: [],
                    videoProducers: [],
                    soundjacks: [],
                    name: event.member.displayName,
                    online: event.member.online,
                    volume: 0,
                    setVolume: v => api.setRemoteMasterVolume(event.uid, v)
                }]
            ));
            api.on("member-changed", (event: MemberEvent) => setMembers(
                prevState => prevState.map(m => {
                    if (m.uid === event.uid) {
                        m.name = event.member.displayName;
                        m.online = event.member.online;
                    }
                    return m;
                })
            ));
            api.on("member-removed", (event: MemberEvent) => setMembers(
                prevState => prevState.filter(m => m.uid === event.uid)
            ));
            api.on("producer-added", (event: ProducerEvent) => setMembers(
                prevState => prevState.map(m => {
                    if (m.uid === event.producer.uid) {
                        if (event.producer.kind === "audio") {
                            m.audioProducers.push({
                                id: event.id,
                                volume: event.producer.volume ? event.producer.volume : 0,
                                setVolume: v => api.setRemoteProducerVolume(event.id, v)
                            })
                        } else {
                            m.videoProducers.push({
                                id: event.id,
                            })
                        }
                    }
                    return m;
                })
            ));
            api.on("producer-changed", (event: ProducerEvent) => event.producer.kind === "audio" && setMembers(
                prevState => prevState.map(m => {
                    if (m.uid === event.producer.uid) {
                        const audioProducer = m.audioProducers.find(ap => ap.id === event.id);
                        if (audioProducer) {
                            audioProducer.volume = event.producer.volume;
                        }
                    }
                    return m;
                })
            ));
            api.on("producer-removed", (event: ProducerEvent) => setMembers(
                prevState => prevState.map(m => {
                    if (m.uid === event.producer.uid) {
                        if (event.producer.kind === "audio") {
                            m.audioProducers = m.audioProducers.filter(p => p.id !== event.id);
                        } else {
                            m.videoProducers = m.videoProducers.filter(p => p.id !== event.id);
                        }
                    }
                    return m;
                })
            ));

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
        }
    }, [api, localDevice])

    return {
        members,
        error,
        localDevice,
        devices
    }
};
