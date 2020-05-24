import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import React, {createContext, Dispatch, SetStateAction, useCallback, useContext, useEffect, useState} from "react";
import fetch from "isomorphic-unfetch";
import {AudioContext} from 'standardized-audio-context';
import {useAuth} from "../useAuth";
import useMediasoupDevice from "./devices/mediasoup/useMediasoupDevice";
import useSoundjackDevice from "./devices/soundjack/useSoundjackDevice";
import {GlobalProducerConsumer} from "./devices/mediasoup/MediasoupDevice";
import {createMediasoupMediaTrack, getAudioContext} from "./devices/mediasoup/utils";
import {Stage, StageMember} from "./client.model";
import {DatabaseStage, DatabaseStageMember, DatabaseUser} from "./database.model";

interface StageProps {
    create(name: string, password: string);

    join(stageId: string, password: string);

    leave();

    loading: boolean;

    stage?: Stage,


    error?: string;

    members: StageMember[];

    connected: boolean;

    setConnected(connected: boolean): void;

    sendVideo: boolean;
    setSendVideo: Dispatch<SetStateAction<boolean>>;
    sendAudio: boolean;
    setSendAudio: Dispatch<SetStateAction<boolean>>;
    receiveAudio: boolean;
    setReceiveVideo: Dispatch<SetStateAction<boolean>>;
    receiveVideo: boolean;
    setReceiveAudio: Dispatch<SetStateAction<boolean>>;
    sendSoundjack: boolean;
    setSendSoundjack: Dispatch<SetStateAction<boolean>>;
    receiveSoundjack: boolean;
    setReceiveSoundjack: Dispatch<SetStateAction<boolean>>;

    isSoundjackAvailable: boolean;
}

const StageContext = createContext<StageProps>(undefined);

export const useStage = () => useContext(StageContext);

export const StageProvider = (props: {
    children: React.ReactNode
}) => {
    const {user} = useAuth();
    const [error, setError] = useState<string>();
    const [stageId, setStageId] = useState<string>();
    const [stage, setStage] = useState<Stage>(undefined);
    const [members, setMembers] = useState<StageMember[]>([]);
    const [audioContext, setAudioContext] = useState<AudioContext>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            setLoading(true);
            return firebase.firestore()
                .collection("users")
                .doc(user.uid)
                .onSnapshot((snapshot: firebase.firestore.DocumentSnapshot<DatabaseUser>) => {
                    const member: DatabaseUser = snapshot.data();
                    if (member && member.stageId) {
                        setStageId(member.stageId);
                    } else {
                        setStageId(undefined);
                        setLoading(false);
                    }
                })
        }
    }, [user]);

    const onStageUpdated = useCallback((snapshot: firebase.firestore.DocumentSnapshot<DatabaseStage>) => {
        const stage: DatabaseStage = snapshot.data();
        setStage(stage);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (stageId) {
            // Fetch stage
            return firebase.firestore()
                .collection("stages")
                .doc(stageId)
                .onSnapshot(onStageUpdated);
        } else {
            setStage(undefined);
            setLoading(false);
        }
    }, [stageId]);

    const onMembersUpdated = useCallback((querySnapshot: firebase.firestore.QuerySnapshot<DatabaseStageMember>) => {
        return querySnapshot.docChanges()
            .forEach((change: firebase.firestore.DocumentChange<DatabaseStageMember>) => {
                const member: DatabaseStageMember = change.doc.data();
                if (change.type === "added") {
                    setMembers(prevState => [...prevState, {
                        uid: member.uid,
                        displayName: member.displayName,
                        tracks: []
                    } as StageMember]);
                } else if (change.type === "modified") {
                    setMembers(prevState => prevState.map((m: StageMember) => m.uid === member.uid ? {
                        ...m,
                        displayName: member.displayName
                    } as StageMember : m));
                } else if (change.type === "removed") {
                    setMembers(prevState => prevState.filter((m: StageMember) => m.uid !== member.uid));
                }
            })
    }, []);

    useEffect(() => {
        if (stageId) {
            return firebase.firestore()
                .collection("stages")
                .doc(stageId)
                .collection("members")
                .onSnapshot(onMembersUpdated);
        }
    }, [stageId]);


    const create = useCallback((name: string, password: string) => {
        if (!user)
            return;
        if (stage)
            return;
        setLoading(true);
        return user
            .getIdToken()
            .then((token: string) => fetch("https://digital-stages.de/api/stages/create", {
                    method: "POST",
                    headers: {
                        authorization: token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        password: password
                    })
                })
            )
            .catch((error) => {
                console.error(error);
                setError(error.message);
            }).finally(() => {
                setLoading(false);
            });
    }, [user, stage]);

    const join = useCallback((stageId: string, password: string) => {
        if (!user)
            return;
        if (stage)
            return;
        setLoading(true);
        return user
            .getIdToken()
            .then((token: string) => fetch("https://digital-stages.de/api/stages/join", {
                method: "POST",
                headers: {
                    "authorization": token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stageId: stageId,
                    password: password
                })
            }))
            .catch((error) => {
                console.error(error);
                setError(error.message);
            }).finally(() => {
                setLoading(false);
            });
    }, [user, stage]);

    const leave = useCallback(() => {
        if (user) {
            console.log("leave");
            setLoading(true);
            return user
                .getIdToken()
                .then((token: string) => fetch("https://digital-stages.de/api/stages/leave", {
                    method: "POST",
                    headers: {
                        "authorization": token,
                        'Content-Type': 'application/json'
                    }
                }))
                .catch((error) => {
                    console.error(error);
                    setError(error.message);
                }).finally(() => {
                    setLoading(false);
                });
        }
    }, [user]);

    /***
     * Soundjack specific
     *
     */
    const {localSoundjackDevice, connected: soundjackConnected, sendAudio: sendSoundjack, setSendAudio: setSendSoundjack, receiveAudio: receiveSoundjack, setReceiveAudio: setReceiveSoundjack, isAvailable} = useSoundjackDevice(user, stage);
    useEffect(() => {
        if (localSoundjackDevice)
            localSoundjackDevice.setStageId(stageId);
    }, [stageId, localSoundjackDevice]);

    /***
     * Mediasoup specific
     */
    const {localMediasoupDevice, connected: mediasoupConnected, sendAudio, setSendAudio, sendVideo, setSendVideo, receiveAudio, setReceiveVideo, receiveVideo, setReceiveAudio} = useMediasoupDevice(user, stage);

    useEffect(() => {
        if (localMediasoupDevice)
            localMediasoupDevice.setStageId(stageId);
    }, [stageId, localMediasoupDevice]);

    const addConsumer = useCallback((members: StageMember[], consumer: GlobalProducerConsumer) => {
        return members.map((m: StageMember) => m.uid === consumer.globalProducer.uid ? {
            ...m,
            tracks: [createMediasoupMediaTrack(consumer.globalProducer.id, consumer.consumer, audioContext), ...m.tracks]
        } as StageMember : m)
    }, [audioContext]);

    const onConsumerAdded = useCallback((consumer: GlobalProducerConsumer) => {
        setMembers(prevState => addConsumer(prevState, consumer));
    }, [members, audioContext]);

    const onConsumerRemoved = useCallback((consumer: GlobalProducerConsumer) => {
        console.log("onConsumerRemoved");
        setMembers(prevState => prevState.map((member: StageMember) => {
            if (member.uid !== consumer.globalProducer.uid)
                return member;
            return {
                ...member,
                tracks: member.tracks.filter((track) => track.id !== consumer.globalProducer.id)
            }
        }))
    }, [members]);

    const addHandlers = useCallback(() => {
        if (!audioContext)
            return;
        console.log("JETZT ABA!");// <-- NEVER CALLED?!?
        localMediasoupDevice.on("consumer-created", onConsumerAdded);
        localMediasoupDevice.on("consumer-closed", onConsumerRemoved)
    }, [localMediasoupDevice, audioContext]);

    useEffect(() => {
        if (localMediasoupDevice && audioContext) {
            addHandlers();
        }
    }, [localMediasoupDevice, audioContext]);

    /***
     * For all devices
     */
    const setConnected = useCallback(async () => {
        if (!localMediasoupDevice || !localSoundjackDevice) {
            setError("Device not ready");
            return;
        }
        setLoading(true);

        return getAudioContext()
            .then((ctx) => {
                setAudioContext(ctx);
            })
            .then(() => localMediasoupDevice.connect())
            .then(() => localSoundjackDevice.connect())
            .catch((error) => setError(error.message))
            .finally(() => setLoading(false));
    }, [localMediasoupDevice, localSoundjackDevice]);

    return (
        <StageContext.Provider value={{
            stage: stage,
            create: create,
            leave: leave,
            join: join,
            loading: loading,
            error: error,
            members: members,
            connected: mediasoupConnected && soundjackConnected,
            setConnected: setConnected,
            sendVideo: sendVideo,
            setSendVideo: setSendVideo,
            sendAudio: sendAudio,
            setSendAudio: setSendAudio,
            receiveAudio: receiveAudio,
            setReceiveAudio: setReceiveAudio,
            receiveVideo: receiveVideo,
            setReceiveVideo: setReceiveVideo,
            sendSoundjack: sendSoundjack,
            setSendSoundjack: setSendSoundjack,
            receiveSoundjack: receiveSoundjack,
            setReceiveSoundjack: setReceiveSoundjack,
            isSoundjackAvailable: isAvailable
        }}>
            {props.children}
        </StageContext.Provider>
    )
}
