import React, {Dispatch, SetStateAction, useCallback, useContext, useEffect, useState} from "react";
import * as config from "../../../env";
import {Participant, Stage} from "../model";
import {
    CreateStagePayload,
    CreateStageResult,
    JoinStagePayload,
    ParticipantAddedPayload,
    ParticipantChangedPayload,
    ParticipantRemovedPayload,
    StageEvents,
    StageRequests
} from "../events/stage";
import {extend, SocketWithRequest} from "../../../util/SocketWithRequest";
import firebase from "firebase";
import SocketIOClient from "socket.io-client";
import {useWebRTC} from "./extensions/WebRTCP2PExtension";
import omit from 'lodash.omit';
import {useMediasoup} from "./extensions/MediasoupExtension";

const HOST: string = config.SERVER_URL;
const PORT: number = config.SERVER_PORT;

export interface StageProps {
    stage?: Stage;
    setStage: Dispatch<SetStateAction<Stage | undefined>>;
    //remoteParticipants?: { [userId: string]: Participant }
    //setRemoteParticipants: Dispatch<SetStateAction<{ [userId: string]: Participant } | undefined>>;
}

const StageContext = React.createContext<StageProps>({
    setStage: () => {
    },
    //setRemoteParticipants: () => {
    //}
});

export const StageConsumer = StageContext.Consumer;

export const StageProvider = (props: {
    children: React.ReactNode,
}) => {
    const [stage, setStage] = useState<Stage>();
    //const [remoteParticipants, setRemoteParticipants] = useState<{ [userId: string]: Participant }>();

    return (
        <StageContext.Provider value={{
            stage: stage,
            setStage: setStage,
            //remoteParticipants: remoteParticipants,
            //setRemoteParticipants: setRemoteParticipants
        }}>
            {props.children}
        </StageContext.Provider>
    );
};

export const useStage = () => useContext<StageProps>(StageContext);

export const useStageController = (props: {
    user: firebase.User
}) => {
    const [socket, setSocket] = useState<SocketWithRequest>();
    const [error, setError] = useState<Error>();
    const {stage, setStage, /*remoteParticipants, setRemoteParticipants*/} = useContext<StageProps>(StageContext);
    const {setPublishedTracks: setP2PTracks} = useWebRTC({socket, stage, useHighBitrate: false});
    const {setPublishedTracks: setMediasoupTrack} = useMediasoup({socket, stage});

    const publishTrack = useCallback((track: MediaStreamTrack, type: "mediasoup" | "p2p" = "p2p") => {
        if (type === "mediasoup") {
            setMediasoupTrack(prevState => ({
                ...prevState,
                [track.id]: track
            }));
        } else {
            console.log("Adding track to webrtc");
            setP2PTracks(prevState => ({
                ...prevState,
                [track.id]: track
            }));
        }
    }, []);

    const unpublishTrack = useCallback((trackId: string, type: "mediasoup" | "p2p" = "p2p") => {
        if (type === "mediasoup") {
            setMediasoupTrack(prevState => omit(prevState, trackId));
        } else {
            setP2PTracks(prevState => omit(prevState, trackId));
        }
    }, [setMediasoupTrack, setP2PTracks]);

    useEffect(() => {
        if (props.user)
            connect();
    }, [props.user]);

    const connect = useCallback(() => {
        console.log("Connecting to " + HOST + ":" + PORT);
        props.user.getIdToken()
            .then((token: string) => {
                const socket: SocketWithRequest = extend(SocketIOClient(HOST + ":" + PORT, {
                    query: {token}
                }));
                setSocket(socket);
            });
    }, [props.user]);

    const onParticipantAdded = useCallback((data: ParticipantAddedPayload) => {
        if (data.userId !== props.user.uid)
            setStage(prevState => ({
                ...prevState,
                participants: {
                    ...prevState.participants,
                    [data.userId]: {
                        ...data,
                        webRTC: {
                            established: false
                        },
                        stream: new MediaStream(),
                        consumers: {}
                    }
                }
            }));
    }, [stage]);

    const onParticipantChanged = useCallback((data: ParticipantChangedPayload) => {
        setStage(prevState => ({
            ...prevState,
            participants: {
                ...prevState.participants,
                [data.userId]: {
                    ...prevState.participants[data.userId],
                    ...data
                }
            }
        }));
    }, [stage]);

    const onParticipantRemoved = useCallback((data: ParticipantRemovedPayload) => {
        setStage(prevState => ({
            ...prevState,
            participants: omit(prevState.participants, data.userId)
        }));
    }, [stage]);

    const disconnect = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setStage(undefined);
            setSocket(undefined);
        }
    }, [socket]);

    const create = useCallback((stageName: string, password: string) => {
        if (!socket || stage)
            return;
        console.log("Create stage");
        socket.request(StageRequests.CreateStage, {
            stageName: stageName,
            password: password ? password : null,
            soundjack: false
        } as CreateStagePayload)
            .then((response: CreateStageResult) => {
                if (response.error) {
                    throw new Error(response.error);
                }
                const remoteParticipants: { [userId: string]: Participant } = {};
                Object.keys(response.stage.participants).forEach((userId: string) => {
                    if (userId !== props.user.uid) {
                        remoteParticipants[userId] = {
                            ...response.stage.participants[userId],
                            webRTC: {
                                established: false
                            },
                            stream: new MediaStream(),
                            consumers: {}
                        };
                    }
                });
                socket.on(StageEvents.ParticipantAdded, onParticipantAdded);
                socket.on(StageEvents.ParticipantChanged, onParticipantChanged);
                socket.on(StageEvents.ParticipantRemoved, onParticipantRemoved);
                const stage: Stage = {
                    ...response.stage,
                    participants: remoteParticipants
                };
                setError(undefined);
                setStage(stage);
            })
            .catch((error) => setError(error));
    }, [socket]);

    const join = useCallback((stageId: string, password: string) => {
        if (!socket || stage)
            return;
        console.log("Join stage");
        return socket.request(StageRequests.JoinStage, {
            stageId: stageId,
            password: password ? password : null,
            soundjack: false
        } as JoinStagePayload)
            .then((response: CreateStageResult) => {
                if (response.error) {
                    throw new Error(response.error);
                }
                const remoteParticipants: { [userId: string]: Participant } = {};
                Object.keys(response.stage.participants).forEach((userId: string) => {
                    if (userId !== props.user.uid) {
                        remoteParticipants[userId] = {
                            ...response.stage.participants[userId],
                            webRTC: {
                                established: false
                            },
                            stream: new MediaStream(),
                            consumers: {}
                        };
                    }
                });
                const stage: Stage = {
                    ...response.stage,
                    participants: remoteParticipants
                };
                socket.on(StageEvents.ParticipantAdded, onParticipantAdded);
                socket.on(StageEvents.ParticipantChanged, onParticipantChanged);
                socket.on(StageEvents.ParticipantRemoved, onParticipantRemoved);
                setError(undefined);
                setStage(stage);
                //setRemoteParticipants(remoteParticipants);
            })
            .catch((error) => setError(error));
    }, [socket]);

    return {
        create,
        join,
        stage,
        error,
        //remoteParticipants,
        publishTrack,
        unpublishTrack
    };
};
