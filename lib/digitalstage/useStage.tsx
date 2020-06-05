import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/database";
import React, {createContext, Dispatch, SetStateAction, useCallback, useContext, useEffect, useState} from "react";
import fetch from "isomorphic-unfetch";
import {useAuth} from "../useAuth";
import {types} from "digitalstage-client-base";
import * as mediasoupLib from "./mediasoup";
import {createMediasoupMediaTrack} from "./utils";
import {IMediasoupTrack} from "./types/IMediasoupTrack";
import {AudioContext, IAudioContext} from "standardized-audio-context";

/**
 * Client-based member model holding the media tracks
 */
export interface StageMember extends types.DatabaseStageMember {
    tracks: IMediasoupTrack[];
}

interface StageProps {
    create(name: string, password: string);

    join(stageId: string, password: string);

    leave();

    loading: boolean;

    stage?: types.DatabaseStage,


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
}

const StageContext = createContext<StageProps>(undefined);

export const useStage = () => useContext(StageContext);

export const StageProvider = (props: {
    children: React.ReactNode
}) => {
    const {user} = useAuth();
    const [error, setError] = useState<string>();
    const [stageId, setStageId] = useState<string>();
    const [stage, setStage] = useState<types.DatabaseStage>(undefined);
    const [members, setMembers] = useState<StageMember[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [audioContext, setAudioContext] = useState<IAudioContext>();

    useEffect(() => {
        setAudioContext(new AudioContext());
    }, []);

    useEffect(() => {
        if (user) {
            setLoading(true);
            return firebase.firestore()
                .collection("users")
                .doc(user.uid)
                .onSnapshot((snapshot: firebase.firestore.DocumentSnapshot<types.DatabaseUser>) => {
                    const member: types.DatabaseUser = snapshot.data();
                    if (member && member.stageId) {
                        setStageId(member.stageId);
                    } else {
                        setStageId(undefined);
                        setLoading(false);
                    }
                })
        }
    }, [user]);

    useEffect(() => {
        if (stageId) {
            // Fetch stage
            firebase.firestore()
                .collection("stages")
                .doc(stageId)
                .onSnapshot(onStageUpdated);
            firebase.firestore()
                .collection("stages")
                .doc(stageId)
                .collection("members")
                .onSnapshot(onMembersUpdated);
        } else {
            setStage(undefined);
            setLoading(false);
        }
    }, [stageId]);

    const onStageUpdated = useCallback((snapshot: firebase.firestore.DocumentSnapshot<types.DatabaseStage>) => {
        const stage: types.DatabaseStage = snapshot.data();
        setStage(stage);
        setLoading(false);
    }, []);

    const onMembersUpdated = useCallback((querySnapshot: firebase.firestore.QuerySnapshot<types.DatabaseStageMember>) => {
        return querySnapshot.docChanges()
            .forEach((change: firebase.firestore.DocumentChange<types.DatabaseStageMember>) => {
                const member: types.DatabaseStageMember = change.doc.data();
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
     * Mediasoup specific
     */
    const mediasoup = mediasoupLib.useMediasoup(firebase.app("[DEFAULT]"), user);

    const addConsumer = useCallback((members: StageMember[], consumer: mediasoupLib.types.Consumer) => {
        console.log("addConsumer");
        if (!audioContext) {
            console.error("not ready");
        }
        return members.map((m: StageMember) => m.uid === consumer.globalProducer.uid ? {
            ...m,
            tracks: [createMediasoupMediaTrack(consumer.globalProducer.id, consumer.consumer, audioContext), ...m.tracks]
        } as StageMember : m)
    }, [audioContext]);

    const onConsumerAdded = useCallback((consumer: mediasoupLib.types.Consumer) => {
        console.log("consumer added");
        setMembers(prevState => addConsumer(prevState, consumer));
    }, [members, audioContext]);

    const onConsumerRemoved = useCallback((consumer: mediasoupLib.types.Consumer) => {
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
        if( connected ) {
            return mediasoup.connect();
        } else {
            return mediasoup.disconnect();
        }
    }, [mediasoup.device]);

    return (
        <StageContext.Provider value={{
            stage: stage,
            create: create,
            leave: leave,
            join: join,
            loading: loading,
            error: error,
            members: members,
            connected: mediasoup.connected,
            setConnected: setConnected,
            sendVideo: mediasoup.sendVideo,
            setSendVideo: mediasoup.setSendVideo,
            sendAudio: mediasoup.sendAudio,
            setSendAudio: mediasoup.setSendAudio,
            receiveAudio: mediasoup.receiveAudio,
            setReceiveAudio: mediasoup.setReceiveAudio,
            receiveVideo: mediasoup.receiveVideo,
            setReceiveVideo: mediasoup.setReceiveVideo
        }}>
            {props.children}
        </StageContext.Provider>
    )
}
