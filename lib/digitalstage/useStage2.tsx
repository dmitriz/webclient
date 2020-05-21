import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import React, {createContext, Dispatch, SetStateAction, useCallback, useContext, useEffect, useState} from "react";
import fetch from "isomorphic-unfetch";
import {AudioContext, IAudioContext} from 'standardized-audio-context';
import {DatabaseMember, DatabaseStage, DatabaseStageMember, Stage, StageMember, StageMemberNew} from "./model";
import {useAuth} from "../useAuth";
import useMediasoupDevice from "./devices/mediasoup/useMediasoupDevice";
import useSoundjackDevice from "./devices/soundjack/useSoundjackDevice";
import {GlobalProducerConsumer} from "./devices/mediasoup/MediasoupDevice";
import {createMediasoupMediaTrack} from "./devices/mediasoup/utils";
import webAudioTouchUnlock from "../../lib/webAudioTouchUnlock";

interface StageProps {
    create(name: string, password: string);

    join(stageId: string, password: string);

    leave();

    loading: boolean;

    stage?: Stage,


    error?: string;

    members: StageMemberNew[];

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
    const [audioContext, setAudioContext] = useState<IAudioContext>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            setLoading(true);
            return firebase.firestore()
                .collection("users")
                .doc(user.uid)
                .onSnapshot((snapshot: firebase.firestore.DocumentSnapshot<DatabaseMember>) => {
                    const member: DatabaseMember = snapshot.data();
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
                    console.log("Member added");
                    setMembers(prevState => [...prevState, {
                        uid: member.uid,
                        displayName: member.displayName,
                        tracks: []
                    } as StageMember]);
                } else if (change.type === "modified") {
                    console.log("Member modified");
                    setMembers(prevState => prevState.map((m: StageMember) => m.uid === member.uid ? {
                        ...m,
                        displayName: member.displayName
                    } as StageMember : m));
                } else if (change.type === "removed") {
                    console.log("Member removed");
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
            .then((token: string) => fetch("https://europe-west3-digitalstage-wirvsvirus.cloudfunctions.net/createStage", {
                method: "POST",
                headers: {
                    authorization: token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    password: password
                })
            }))
            .then((response) => {
                if (!response.ok) {
                    setError(response.statusText);
                    setLoading(false);
                }
            })
            .catch((error) => {
                console.error(error);
                setError(error.message);
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
            .then((token: string) => fetch("https://europe-west3-digitalstage-wirvsvirus.cloudfunctions.net/joinStage", {
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
            .then((response) => {
                if (!response.ok) {
                    setError(response.statusText);
                    setLoading(false);
                }
            })
            .catch((error) => {
                console.log("hey");
                console.error(error);
                setError(error.message);
                setLoading(false);
            });
    }, [user, stage]);

    const leave = useCallback(() => {
        if (user) {
            console.log("Leave");
            setLoading(true);
            return firebase.firestore()
                .collection("users")
                .doc(user.uid)
                .update({
                    stageId: null
                })
                .then(() => {
                    setStage(undefined);
                    setMembers([]);
                    setStageId(undefined);
                })
        }
    }, [user]);

    /***
     * Soundjack specific
     *
     */
    const {localSoundjackDevice, sendAudio: sendSoundjack, setSendAudio: setSendSoundjack, receiveAudio: receiveSoundjack, setReceiveAudio: setReceiveSoundjack, isAvailable} = useSoundjackDevice(user);
    useEffect(() => {
        if (localSoundjackDevice)
            localSoundjackDevice.setStageId(stageId);
    }, [stageId, localSoundjackDevice]);

    /***
     * Mediasoup specific
     */
    const {localMediasoupDevice, sendAudio, setSendAudio, sendVideo, setSendVideo, receiveAudio, setReceiveVideo, receiveVideo, setReceiveAudio} = useMediasoupDevice(user);

    useEffect(() => {
        const audioContext: IAudioContext = new AudioContext();
        webAudioTouchUnlock(audioContext)
            .then((unlocked: boolean) => {
                if (unlocked) {
                    // AudioContext was unlocked from an explicit user action, sound should start playing now
                } else {
                    // There was no need for unlocking, devices other than iOS
                }
            }, (reason: any) => {
                console.error(reason);
            });
        setAudioContext(audioContext);
    }, []);

    useEffect(() => {
        if (localMediasoupDevice)
            localMediasoupDevice.setStageId(stageId);
    }, [stageId, localMediasoupDevice]);

    useEffect(() => {
        console.log("MEMBERS HAS BEEN UPDATED!");
        console.log(members);
    }, [members])

    const onConsumerAdded = useCallback((consumer: GlobalProducerConsumer) => {
        console.log("onConsumerAdded");
        setMembers(prevState => {
            return prevState.map((m: StageMember) => m.uid === consumer.globalProducer.uid ? {
                ...m,
                tracks: [createMediasoupMediaTrack(consumer.globalProducer.id, consumer.consumer, audioContext), ...m.tracks]
            } as StageMember : m)
        });
        /*
        const clonedMembers = members.slice();
                const member = clonedMembers.find((member: StageMember) => member.uid === consumer.globalProducer.uid);
                console.log(clonedMembers);
                if (member) {
                    if (!member.tracks.find((t) => t.id !== consumer.globalProducer.id)) {
                        member.tracks.push(createMediasoupMediaTrack(consumer.globalProducer.id, consumer.consumer, audioContext));
                        setMembers(clonedMembers);
                    }
                } else {
                    console.error("SYNC ERROR?");
                }*/
    }, [members, audioContext]);

    const onConsumerRemoved = useCallback((consumer: GlobalProducerConsumer) => {
        console.log("CONSUMER CLOSED");
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
        if (localMediasoupDevice && members) {
            localMediasoupDevice.on("consumer-created", onConsumerAdded);
            localMediasoupDevice.on("consumer-closed", onConsumerRemoved)
        }
    }, [localMediasoupDevice]);

    return (
        <StageContext.Provider value={{
            stage: stage,
            create: create,
            leave: leave,
            join: join,
            loading: loading,
            error: error,
            members: members,
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
