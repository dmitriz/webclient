import firebase from "firebase/app";
import "firebase/database";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import fetch from "isomorphic-unfetch";
import {AudioContext, IAudioContext} from 'standardized-audio-context';
import * as omit from "lodash.omit";
import * as env from "./../../env";
import mediasoupClient from "mediasoup-client";
import {
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
import {MediasoupConsumer, MediasoupDevice, useMediasoupDevice} from "./mediasoup/useMediasoupDevice";

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

    stage?: Stage,

    memberObjects?: { [uid: string]: StageMember }

    error?: string;

    members: StageMemberNew[];

    mediasoupDevice: MediasoupDevice
}

const StageContext = createContext<StageProps>(undefined);

export const useStage = () => useContext(StageContext);

export const StageProvider = (props: {
    children: React.ReactNode
}) => {
    const {user} = useAuth();
    const [error, setError] = useState<string>();
    const [stage, setStage] = useState<Stage>();
    const [members, setMembers] = useState<StageMemberNew[]>([]);
    const [memberObjects, setMemberObjects] = useState<{ [uid: string]: StageMember }>({});

    useEffect(() => {
        if (user) {
            firebase.database()
                .ref("users")
                .child(user.uid)
                .update({
                    uid: user.uid
                });
        }
    }, [user]);

    const onMemberAdded = useCallback((snapshot: firebase.database.DataSnapshot) => {
        const member: DatabaseStageMember = snapshot.val();
        console.log("Member added: " + member.displayName);
        setMemberObjects(prevState => ({
            ...prevState,
            [member.uid]: {tracks: {}, ...prevState[member.uid], ...member}
        }));
    }, []);

    const onMemberRemoved = useCallback((snapshot: firebase.database.DataSnapshot) => {
        const member: DatabaseStageMember = snapshot.val();
        console.log("Member removed: " + member.displayName);
        setMemberObjects(prevState => omit(prevState, member.uid));
    }, []);

    useEffect(() => {
        if (stage) {
            firebase.database()
                .ref("stages/" + stage.id)
                .child("members")
                .on("child_added", onMemberAdded);
            firebase.database()
                .ref("stages/" + stage.id)
                .child("members")
                .on("child_removed", onMemberRemoved);
            return () => {
                firebase.database()
                    .ref("stages/" + stage.id)
                    .child("members")
                    .off("child_added", onMemberAdded);
                firebase.database()
                    .ref("stages/" + stage.id)
                    .child("members")
                    .off("child_removed", onMemberRemoved);
            }
        }
    }, [stage]);

    const create = useCallback((name: string, password: string) => {
        if (!user)
            return;
        if (stage)
            return;
        user
            .getIdToken()
            .then((token: string) => fetch(env.SERVER_URL + ":" + env.SERVER_PORT + "/create", {
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
            .then((stage: DatabaseStage) => setStage(stage as Stage))
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
            .then((token: string) => fetch(env.SERVER_URL + ":" + env.SERVER_PORT + "/join", {
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
                if( !response.ok )
                    setError(response.statusText);
                return response.ok && response.json();
            })
            .then((stage: DatabaseStage) => setStage(stage))
            .catch((error) => {
                console.error(error);
                setError(error)
            });
    }, [user, stage]);

    // MEDIASOUP specific
    const mediasoupDevice: MediasoupDevice = useMediasoupDevice(user);
    const [audioContext, setAudioContext] = useState<IAudioContext>();

    useEffect(() => {
        setAudioContext(new AudioContext());
    }, [])

    const syncConsumers = useCallback((newConsumers: {
        [globalProducerId: string]: MediasoupConsumer
    }) => {
        Object.keys(newConsumers)
            .forEach((globalProducerId: string) => {
                const consumer: MediasoupConsumer = newConsumers[globalProducerId];
                if (memberObjects[consumer.uid].tracks[globalProducerId]) {
                    // CHANGED
                } else {
                    // ADDED
                    const track: MediaTrack = createMediaTrack(globalProducerId, consumer.consumer, audioContext);
                    setMemberObjects(prevState => ({
                        ...prevState,
                        [consumer.uid]: {
                            ...prevState[consumer.uid],
                            tracks: {
                                ...prevState[consumer.uid].tracks,
                                [globalProducerId]: track
                            }
                        }
                    }));
                }
            });
        Object.keys(memberObjects)
            .forEach(uid => Object.keys(memberObjects[uid].tracks).forEach(
                (trackId: string) => {
                    if (!newConsumers[trackId]) {
                        // REMOVED
                        setMemberObjects(prevState => ({
                            ...prevState,
                            [uid]: {
                                ...prevState[uid],
                                tracks: omit(prevState[uid].tracks, trackId)
                            }
                        }));
                    }
                }
            ));
    }, [memberObjects, audioContext]);

    useEffect(() => {
        syncConsumers(mediasoupDevice.consumers);
    }, [mediasoupDevice.consumers]);

    return (
        <StageContext.Provider value={{
            stage: stage,
            create: create,
            join: join,
            error: error,
            members: members,
            memberObjects: memberObjects,
            mediasoupDevice: mediasoupDevice
        }}>
            {props.children}
        </StageContext.Provider>
    )
}
