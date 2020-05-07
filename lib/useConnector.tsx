import {useCallback, useEffect} from "react";
import {Participant, ParticipantFromServer, Stage, StageFromServer} from "./model";
import {extend, SocketWithRequest} from "../util/SocketWithRequest";
import firebase from "firebase/app";
import SocketIOClient from "socket.io-client";
import omit from 'lodash.omit';
import * as config from "../env";
import {
    CreateStagePayload,
    CreateStageResult,
    JoinStagePayload,
    ParticipantAddedPayload,
    StageEvents,
    StageRequests
} from "./events/stage";
import {useConnection} from "./useConnection";

const HOST: string = config.SERVER_URL;
const PORT: number = config.SERVER_PORT;

export const convertParticipantFromServer = (participantFromServer: ParticipantFromServer): Participant => {
    return {
        ...participantFromServer,
        webRTC: {
            established: false
        },
        videoTracks: {},
        audioTracks: {},
        stream: new MediaStream(),
        consumers: {}
    };
}

const convertStageFromServer = (stageFromServer: StageFromServer, ownUserId: string): Stage => {
    const remoteParticipants: { [userId: string]: Participant } = {};
    Object.keys(stageFromServer.participants).forEach((userId: string) => {
        if (userId !== ownUserId) {
            remoteParticipants[userId] = {
                ...stageFromServer.participants[userId],
                webRTC: {
                    established: false
                },
                videoTracks: {},
                audioTracks: {},
                stream: new MediaStream(),
                consumers: {}
            };
        }
    });
    return {
        ...stageFromServer,
        participants: remoteParticipants
    };
};

export default (props: {
    user: firebase.User
}) => {
    const {stage, setStage, socket, setSocket, connected} = useConnection();

    useEffect(() => {
        if (props.user) {
            props.user.getIdToken()
                .then((token: string) => {
                    const socket: SocketWithRequest = extend(SocketIOClient(HOST + ":" + PORT, {
                        query: {token}
                    }));
                    if( socket.connected ) {
                        socket.on(StageEvents.ParticipantAdded, onParticipantAdded);
                        socket.on(StageEvents.ParticipantChanged, onParticipantChanged);
                        socket.on(StageEvents.ParticipantRemoved, onParticipantRemoved);
                    } else {
                        socket.on("connect", () => {
                            socket.on(StageEvents.ParticipantAdded, onParticipantAdded);
                            socket.on(StageEvents.ParticipantChanged, onParticipantChanged);
                            socket.on(StageEvents.ParticipantRemoved, onParticipantRemoved);
                        });
                    }
                    setSocket(socket);
                    console.log("connected");
                });
        }
    }, [props.user]);

    const create = useCallback(async (stageName: string, password: string) => {
        if (!socket) {
            throw new Error("Connect first");
        }
        socket.request(StageRequests.CreateStage, {
            stageName: stageName,
            password: password ? password : null,
            soundjack: false
        } as CreateStagePayload)
            .then((response: CreateStageResult) => {
                if (response.stage) {
                    const stage: Stage = convertStageFromServer(response.stage, props.user.uid);
                    setStage(stage);
                } else {
                    console.error(response.error);
                }
            });
    }, [props.user, socket]);

    const join = useCallback(async (stageId: string, password: string) => {
        if (!socket) {
            throw new Error("Connect first");
        }
        socket.request(StageRequests.JoinStage, {
            stageId: stageId,
            password: password ? password : null,
            soundjack: false
        } as JoinStagePayload)
            .then((response: CreateStageResult) => {
                if (response.stage) {
                    const stage: Stage = convertStageFromServer(response.stage, props.user.uid);
                    setStage(stage);
                } else {
                    console.error(response.error);
                }
            });
    }, [props.user, socket]);

    const onParticipantAdded = useCallback((data: ParticipantAddedPayload) => {
        if (!stage) {
            return;
        }
        if (data.userId === props.user.uid)
            return;
        // There may be a race condition (participant already created by webrtc, mediasoup or soundjack
        if (!stage.participants[data.userId])
            setStage(prevState => ({
                ...prevState,
                participants: {
                    ...prevState.participants,
                    [data.userId]: {
                        ...data,
                        videoTracks: {},
                        audioTracks: {},
                        webRTC: {
                            established: false
                        },
                        stream: new MediaStream(),
                        consumers: {}
                    }
                }
            }));
    }, [stage, props.user]);
    const onParticipantChanged = useCallback((data: ParticipantAddedPayload) => {
        if (data.userId === this.user.uid)
            return;
        setStage(prevState => ({
            ...prevState,
            participants: {
                ...prevState.participants,
                [data.userId]: {
                    ...this.stage.participants[data.userId],
                    ...data
                }
            }
        }));
    }, [stage]);
    const onParticipantRemoved = useCallback((data: ParticipantAddedPayload) => {
        setStage(prevState => ({
            ...prevState,
            participants: omit(prevState.participants, data.userId)
        }));
    }, [stage]);

    return {
        stage,
        connected,
        create,
        join
    }
}
