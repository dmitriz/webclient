import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/database";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import fetch from "isomorphic-unfetch";
import {useAuth} from "../useAuth";
import {types} from "digitalstage-client-base";
import {MediasoupAudioTrack} from "./types/MediasoupAudioTrack";
import {MediasoupVideoTrack} from "./types/MediasoupVideoTrack";
import {useAudioContext} from "../useAudioContext";

export interface Stage extends types.DatabaseStage {
    id: string
}

/**
 * Client-based member model holding the media tracks
 */
export interface StageMember extends types.DatabaseStageMember {
    uid: string;
    audio: {
        //globalGain: IGainNode<IAudioContext>;
        audioTracks: MediasoupAudioTrack[];
        globalVolume: number
    }
    videoTracks: MediasoupVideoTrack[];
}

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

    /*
        sendVideo: boolean;
        setSendVideo: Dispatch<SetStateAction<boolean>>;
        sendAudio: boolean;
        setSendAudio: Dispatch<SetStateAction<boolean>>;
        receiveAudio: boolean;
        setReceiveVideo: Dispatch<SetStateAction<boolean>>;
        receiveVideo: boolean;
        setReceiveAudio: Dispatch<SetStateAction<boolean>>;*/
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
    const [loading, setLoading] = useState<boolean>(false);
    const {audioContext, createAudioContext} = useAudioContext();

    useEffect(() => {
        createAudioContext();
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
        setStage({...stage, id: snapshot.id});
        setLoading(false);
    }, []);

    const onMembersUpdated = useCallback((querySnapshot: firebase.firestore.QuerySnapshot<types.DatabaseStageMember>) => {
        return querySnapshot.docChanges()
            .forEach((change: firebase.firestore.DocumentChange<types.DatabaseStageMember>) => {
                const member: types.DatabaseStageMember = change.doc.data();
                if (change.type === "added") {
                    //const globalGain: IGainNode<IAudioContext> = audioContext.createGain();
                    //globalGain.gain.value = 0;
                    setMembers(prevState => [...prevState, {
                        uid: change.doc.id,
                        displayName: member.displayName,
                        videoTracks: [],
                        audio: {
                            audioTracks: [],
                            globalVolume: 0
                            //globalGain: globalGain
                        }
                    } as StageMember]);
                } else if (change.type === "modified") {
                    setMembers(prevState => prevState.map((m: StageMember) => m.uid === change.doc.id ? {
                        ...m,
                        displayName: member.displayName
                    } as StageMember : m));
                } else if (change.type === "removed") {
                    setMembers(prevState => prevState.filter((m: StageMember) => m.uid !== change.doc.id));
                }
            })
    }, [audioContext]);

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
     *
     const mediasoup = mediasoupLib.useMediasoup(firebase.app("[DEFAULT]"), user);

     const addConsumer = useCallback((members: StageMember[], consumer: mediasoupLib.types.Consumer) => {
        if (!audioContext) {
            console.error("not ready");
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

     const setReceiveAudio = useCallback((receive: boolean) => {
        // FIX FOR IOS RESTRICTION (AUDIO CONTEXT IS PAUSED PER DEFAULT)
        if (receive) {
            audioContext.resume();
        }
        mediasoup.setReceiveAudio(receive);
    }, [mediasoup, audioContext]);*/

    return (
        <StageContext.Provider value={{
            stage: stage,
            create: create,
            leave: leave,
            join: join,
            loading: loading,
            error: error,
            members: members,
            connected: true,
            setConnected: () => {
            }/*
            connected: mediasoup.connected,
            setConnected: setConnected,
            sendVideo: mediasoup.sendVideo,
            setSendVideo: mediasoup.setSendVideo,
            sendAudio: mediasoup.sendAudio,
            setSendAudio: mediasoup.setSendAudio,
            receiveAudio: mediasoup.receiveAudio,
            setReceiveAudio: setReceiveAudio,
            receiveVideo: mediasoup.receiveVideo,
            setReceiveVideo: mediasoup.setReceiveVideo*/
        }}>
            {props.children}
        </StageContext.Provider>
    )
}
