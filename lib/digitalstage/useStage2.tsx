import firebase from "firebase/app";
import "firebase/database";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import fetch from "isomorphic-unfetch";
import {IAudioContext} from 'standardized-audio-context';
import mediasoupClient from "mediasoup-client";
import {
    DatabaseMember,
    DatabaseStage,
    DatabaseStageMember,
    MediasoupAudioTrack,
    MediasoupVideoTrack,
    MediaTrack,
    Stage,
    StageMember,
    StageMemberNew
} from "./model";
import {useAuth} from "./../useAuth";
import {MediasoupDevice} from "./devices/mediasoup/MediasoupDevice";
import LocalSoundjackDevice from "./devices/soundjack/LocalSoundjackDevice";

const createMediaTrack = (id: string, consumer: mediasoupClient.types.Consumer, audioContext: IAudioContext): MediaTrack => {
    if (consumer.kind === "audio") {
        return new MediasoupAudioTrack(id, audioContext.createMediaStreamTrackSource(consumer.track));
    }
    return {
        id: id,
        type: "video",
        track: consumer.track
    } as MediasoupVideoTrack;
}

interface StageProps {
    create(name: string, password: string);

    join(stageId: string, password: string);

    leave();

    stage?: Stage,

    error?: string;

    members: StageMemberNew[];

    localMediasoupDevice: MediasoupDevice

    localSoundjackDevice: LocalSoundjackDevice
}

const StageContext = createContext<StageProps>(undefined);

export const useStage = () => useContext(StageContext);

export const StageProvider = (props: {
    children: React.ReactNode
}) => {
    const {user} = useAuth();
    const [error, setError] = useState<string>();
    const [stageId, setStageId] = useState<string>();
    const [stage, setStage] = useState<Stage>();
    const [members, setMembers] = useState<StageMember[]>([]);
    const [localMediasoupDevice] = useState<MediasoupDevice>(new MediasoupDevice(user));
    const [localSoundjackDevice] = useState<LocalSoundjackDevice>(new LocalSoundjackDevice(user));

    useEffect(() => {
        if (user) {
            return firebase.firestore()
                .collection("users")
                .doc(user.uid)
                .onSnapshot((snapshot: firebase.firestore.DocumentSnapshot<DatabaseMember>) => {
                    const member: DatabaseMember = snapshot.data();
                    if (member && member.stageId) {
                        setStageId(member.stageId);
                    } else {
                        setStageId(undefined);
                    }
                })
        }
    }, [user]);

    const onStageUpdated = useCallback((snapshot: firebase.firestore.DocumentSnapshot<DatabaseStage>) => {
        const stage: DatabaseStage = snapshot.data();
        setStage(stage);
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
        }
        // And inform devices
        localMediasoupDevice.setStageId(stageId);
        localSoundjackDevice.setStageId(stageId);
    }, [stageId])

    const onMembersUpdated = useCallback((querySnapshot: firebase.firestore.QuerySnapshot<DatabaseStageMember>) => {
        return querySnapshot.docChanges()
            .forEach((change: firebase.firestore.DocumentChange<DatabaseStageMember>) => {
                const member: DatabaseStageMember = change.doc.data();
                if (change.type === "added") {
                    setMembers(prevState => prevState.concat({
                        uid: member.uid,
                        displayName: member.displayName,
                        tracks: []
                    } as StageMember));
                } else if (change.type === "modified") {
                    setMembers(prevState => prevState.map((m: StageMember) => m.uid === member.uid ? {
                        ...m,
                        displayName: member.displayName
                    } as StageMember : m));
                } else if (change.type === "removed") {
                    setMembers(prevState => prevState.filter((m: StageMember) => m.uid === member.uid));
                }
            })
    }, []);

    useEffect(() => {
        if (stageId) {
            return firebase.firestore()
                .collection("users")
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
        user
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
                console.log(response);
                return response
            })
            .then((response) => response.ok && response.json())
            .catch((error) => {
                console.error(error);
                setError(error)
            });
    }, [user, stage]);

    const join = useCallback((stageId: string, password: string) => {
        if (!user)
            return;
        if (stage)
            return;
        user
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
                console.log(response);
                if (!response.ok)
                    setError(response.statusText);
                return response.ok;
            })
            .catch((error) => {
                console.error(error);
                setError(error)
            });
    }, [user, stage]);

    const leave = useCallback(() => {
        if (stage && user) {
            return firebase.database()
                .ref("users/" + user.uid)
                .update({
                    stageId: null
                });
        }
    }, [stage, user]);

    return (
        <StageContext.Provider value={{
            stage: stage,
            create: create,
            leave: leave,
            join: join,
            error: error,
            members: members,
            localMediasoupDevice: localMediasoupDevice,
            localSoundjackDevice: localSoundjackDevice
        }}>
            {props.children}
        </StageContext.Provider>
    )
}
