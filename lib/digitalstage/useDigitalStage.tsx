import {Debugger, DigitalStageAPI, IDevice, RealtimeDatabaseAPI} from "./base";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {useAuth} from "../useAuth";
import {MediasoupAudioTrack} from "./types/MediasoupAudioTrack";
import {MediasoupVideoTrack} from "./types/MediasoupVideoTrack";
import {DatabaseStage, DatabaseStageMember} from "./base/types";
import {DeviceEvent, MemberEvent, SoundjackEvent} from "./base/api/DigitalStageAPI";
import * as mediasoupLib from "./mediasoup";
import * as firebase from "firebase/app";
import "firebase/database";
import {useAudioContext} from "../useAudioContext";


export interface StageMember extends DatabaseStageMember {
    uid: string;
    audio: {
        //globalGain: IGainNode<IAudioContext>;
        audioTracks: MediasoupAudioTrack[];
        soundjackVolume?: number;
        globalVolume: number;
    }
    videoTracks: MediasoupVideoTrack[];
}

interface DigitalStageProps {

    create(name: string, password: string);

    join(stageId: string, password: string);

    leave();

    loading: boolean;

    api?: DigitalStageAPI,

    devices?: IDevice[],

    stage?: DatabaseStage,

    error?: string;

    members: StageMember[];

    connected: boolean;

    setConnected(connected: boolean): void;
}

const DigitalStageContext = createContext<DigitalStageProps>(undefined);
export const useDigitalStage = () => useContext(DigitalStageContext);

export const DigitalStageProvider = (props: {
    children: React.ReactNode
}) => {
    const {user} = useAuth();
    const [api, setApi] = useState<DigitalStageAPI>();
    const [devices, setDevices] = useState<IDevice[]>([]);
    const [stage, setStage] = useState<DatabaseStage>(undefined);
    const [members, setMembers] = useState<StageMember[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const {audioContext} = useAudioContext();

    useEffect(() => {
        if (user) {
            const api: DigitalStageAPI = new RealtimeDatabaseAPI(user);

            // Handle devices
            api.on("device-added", (e: DeviceEvent) => setDevices(prevState => ([...prevState, e])));
            api.on("device-changed", (e: DeviceEvent) => setDevices(prevState => prevState.map((d) => d.id === e.id ? e : d)));
            api.on("device-removed", (e: DeviceEvent) => setDevices(prevState => prevState.filter((d) => d.id !== e.id)));

            // Handle members
            api.on("member-added", (e: MemberEvent) => setMembers(prevState => [...prevState, {
                uid: e.uid,
                displayName: e.member.displayName,
                videoTracks: [],
                audio: {
                    audioTracks: [],
                    globalVolume: 0
                    //globalGain: globalGain
                }
            } as StageMember]));
            api.on("member-changed", (e: MemberEvent) =>
                setMembers(prevState => prevState.map((m: StageMember) => m.uid === e.uid ? {
                    ...m,
                    displayName: e.member.displayName
                } as StageMember : m)));
            api.on("member-removed", (e: MemberEvent) => setMembers(prevState => prevState.filter((m: StageMember) => m.uid !== e.uid)));
            api.on("stage-changed", (stage: DatabaseStage) => {
                setStage(stage);
                setLoading(false);
            });

            // Handle soundjacks
            api.on("soundjack-added", (e: SoundjackEvent) => {
                setMembers(prevState => prevState.map((m: StageMember) => {
                    if (m.uid === e.soundjack.uid) {
                        m.audio.soundjackVolume = e.soundjack.volume;
                    }
                    return m;
                }))
            });
            api.on("soundjack-removed", (e: SoundjackEvent) => {
                setMembers(prevState => prevState.map((m: StageMember) => {
                    if (m.uid === e.soundjack.uid) {
                        m.audio.soundjackVolume = undefined;
                    }
                    return m;
                }))
            });
            setApi(api);
        } else {
            setApi(undefined);
            setStage(undefined);
            setMembers([]);
        }
    }, [user]);

    const create = useCallback((name: string, password: string) => {
        if (api) {
            setLoading(true);
            return api
                .createStage(name, password)
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [api])

    const join = useCallback((stageId: string, password: string) => {
        if (api) {
            setLoading(true);
            return api.joinStage(stageId, password)
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [api]);

    const leave = useCallback(() => {
        if (api) {
            setLoading(true);
            return api.leaveStage()
                .finally(() => {
                    setStage(undefined);
                    setMembers([]);
                    setLoading(false);
                });
        }
    }, [api]);

    // Mediasoup specific
    const mediasoup = mediasoupLib.useMediasoup(firebase.app("[DEFAULT]"), api);
    const addConsumer = useCallback((members: StageMember[], consumer: mediasoupLib.types.Consumer) => {
        if (!audioContext) {
            Debugger.warn("AudioContext is not ready, but should", this);
        }
        return members.map((member: StageMember) => {
            if (member.uid === consumer.globalProducer.uid) {
                if (consumer.globalProducer.kind === "audio") {
                    const audioTrack: MediasoupAudioTrack = new MediasoupAudioTrack(consumer.globalProducer.id, consumer.consumer, audioContext);
                    member.audio.audioTracks.push(audioTrack);
                } else {
                    member.videoTracks.push({
                        id: consumer.globalProducer.id,
                        type: "video",
                        track: consumer.consumer.track
                    } as MediasoupVideoTrack);
                }
            }
            return member;
        });
    }, [audioContext]);

    const onConsumerAdded = useCallback((consumer: mediasoupLib.types.Consumer) => {
        setMembers(prevState => addConsumer(prevState, consumer));
    }, [members, audioContext]);

    const onConsumerRemoved = useCallback((consumer: mediasoupLib.types.Consumer) => {
        setMembers(prevState => prevState.map((member: StageMember) => {
            if (member.uid === consumer.globalProducer.uid) {
                if (consumer.globalProducer.kind === "audio") {
                    member.audio.audioTracks = member.audio.audioTracks.filter((audioTrack: MediasoupAudioTrack) => audioTrack.id !== consumer.globalProducer.id);
                } else {
                    member.videoTracks = member.videoTracks.filter((videoTrack: MediasoupVideoTrack) => videoTrack.id !== consumer.globalProducer.id);
                }
            }
            return member;
        }))
    }, [members]);

    useEffect(() => {
        if (mediasoup.device && audioContext) {
            mediasoup.device.on("consumer-added", onConsumerAdded);
            mediasoup.device.on("consumer-removed", onConsumerRemoved)
        }
    }, [mediasoup.device, audioContext]);

    useEffect(() => {
        if (mediasoup.connected) {
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, [mediasoup.connected]);

    const setConnected = useCallback(async (connected: boolean) => {
        if (connected) {
            return mediasoup.connect();
        } else {
            return mediasoup.disconnect();
        }
    }, [mediasoup.device]);

    return (
        <DigitalStageContext.Provider value={{
            api,
            devices,
            stage,
            members,
            create,
            join,
            loading,
            leave,
            connected: mediasoup.connected,
            setConnected
        }}>
            {props.children}
        </DigitalStageContext.Provider>
    )
};
