import {Participant, Stage, StageFromServer} from "../model";
import React, {Dispatch, SetStateAction, useCallback, useContext, useState} from "react";
import {extend, SocketWithRequest} from "../../../util/SocketWithRequest";
import firebase from "firebase/app";
import "firebase/auth";
import SocketIOClient from "socket.io-client";
import * as config from "../../../env";
import omit from 'lodash.omit';
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
import {WebRTCConnector} from "./WebRTCConnector";
import {MediasoupConnector} from "./MediasoupConnector";
import {Consumer} from "mediasoup-client/lib/Consumer";

const HOST: string = config.SERVER_URL;
const PORT: number = config.SERVER_PORT;

export class StageConnector {
    private socket: SocketWithRequest;
    private user: firebase.User;
    private stage: Stage;
    private webRTCConnector: WebRTCConnector;
    private mediasoupConnector: MediasoupConnector;

    public onError: (error: Error) => any;
    public onStageChanged: (stage?: Stage) => void;
    public onReady: (instance: StageConnector) => void;

    constructor() {
    }

    public connect = (user: firebase.User) => {
        return user.getIdToken()
            .then((token: string) => {
                this.socket = extend(SocketIOClient(HOST + ":" + PORT, {
                    query: {token}
                }));
                this.user = user;
            });
    };

    public createStage = (stageName: string, password: string) => {
        if (!this.socket)
            throw new Error("Not connected");
        if (this.stage) {
            throw new Error("Already at stage");
        }
        return this.socket.request(StageRequests.CreateStage, {
            stageName: stageName,
            password: password ? password : null,
            soundjack: false
        } as CreateStagePayload)
            .then((response: CreateStageResult) => {
                if (response.error) {
                    throw new Error(response.error);
                }
                this.initStage(response.stage);
            })
            .catch((error) => {
                if (this.onError)
                    this.onError(error)
            });
    };

    public joinStage = (stageId: string, password: string) => {
        if (!this.socket)
            throw new Error("Not connected");
        if (this.stage) {
            throw new Error("Already at stage");
        }
        return this.socket.request(StageRequests.JoinStage, {
            stageId: stageId,
            password: password ? password : null,
            soundjack: false
        } as JoinStagePayload)
            .then((response: CreateStageResult) => {
                if (response.error) {
                    throw new Error(response.error);
                }
                this.initStage(response.stage);
            })
            .catch((error) => {
                if (this.onError)
                    this.onError(error)
            });
    };

    public publishStream = (stream: MediaStream, type: "mediasoup" | "p2p") => {
        if (type === "mediasoup") {
        } else {
            return this.webRTCConnector.setLocalStream(stream);
        }
    };


    public publishTrack = (track: MediaStreamTrack, type: "mediasoup" | "p2p") => {
        if (type === "mediasoup") {
            return this.mediasoupConnector.publishTrack(track);
        } else {
            return this.webRTCConnector.publishTrack(track);
        }
    };

    private initStage = (stageFromServer: StageFromServer) => {
        const remoteParticipants: { [userId: string]: Participant } = {};
        Object.keys(stageFromServer.participants).forEach((userId: string) => {
            if (userId !== this.user.uid) {
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
        this.socket.on(StageEvents.ParticipantAdded, this.onParticipantAdded);
        this.socket.on(StageEvents.ParticipantChanged, this.onParticipantChanged);
        this.socket.on(StageEvents.ParticipantRemoved, this.onParticipantRemoved);
        this.stage = {
            ...stageFromServer,
            participants: remoteParticipants
        };
        this.webRTCConnector = new WebRTCConnector(this.socket, this.stage);
        this.webRTCConnector.onRemoteStreamAdded = (remoteParticipants: Participant, stream: MediaStream) => {
            this.stage.participants[remoteParticipants.userId] = remoteParticipants;
            if (this.onStageChanged)
                this.onStageChanged(this.stage);
        };
        this.mediasoupConnector = new MediasoupConnector(this.socket, this.stage);
        this.mediasoupConnector.onConsumerCreated = (userId: string, producerId: string, consumer: Consumer) => {
            this.stage.participants[userId].consumers[producerId] = consumer;
            this.stage.participants[userId].stream.addTrack(consumer.track);
            if (consumer.track.kind === "video") {
                this.stage.participants[userId].videoTracks[consumer.track.id] = consumer.track;
            } else {
                this.stage.participants[userId].audioTracks[consumer.track.id] = consumer.track;
            }
            console.log("GOT NEW CONSUMER");
            console.log(this.stage.participants[userId].stream);
            if (this.onStageChanged)
                this.onStageChanged(this.stage);
        };

        if (this.onStageChanged)
            this.onStageChanged(this.stage);
        if (this.onReady)
            this.onReady(this);
    };

    private handleAddedOrUpdatedParticipant = (remoteParticipant: Participant) => {
        console.log("handleAddedOrUpdatedParticipant");
        // Update mediasoup
        remoteParticipant.producerIds.forEach((producerId: string) => {
            if (!remoteParticipant.consumers[producerId])
                this.mediasoupConnector.consume(remoteParticipant, producerId);
        });
    };

    private onParticipantAdded = (data: ParticipantAddedPayload) => {
        if (data.userId === this.user.uid)
            return;
        this.stage.participants = {
            ...this.stage.participants,
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
        };
        this.handleAddedOrUpdatedParticipant(this.stage.participants[data.userId]);
        if (this.onStageChanged)
            this.onStageChanged(this.stage);
    };
    private onParticipantChanged = (data: ParticipantChangedPayload) => {
        if (data.userId === this.user.uid)
            return;
        console.log(data);
        this.stage.participants = {
            ...this.stage.participants,
            [data.userId]: {
                ...this.stage.participants[data.userId],
                ...data
            }
        };
        this.handleAddedOrUpdatedParticipant(this.stage.participants[data.userId]);
        if (this.onStageChanged)
            this.onStageChanged(this.stage);
    };
    private onParticipantRemoved = (data: ParticipantRemovedPayload) => {
        console.log(data);
        this.stage.participants = omit(this.stage.participants, data.userId);
        if (this.onStageChanged)
            this.onStageChanged(this.stage);
    };
}


/* HOOKS FOR REACT: */
export interface StageProps {
    stage?: Stage;
    setStage: Dispatch<SetStateAction<Stage | undefined>>;
    remoteParticipants?: { [userId: string]: Participant }
    setRemoteParticipants: Dispatch<SetStateAction<{ [userId: string]: Participant } | undefined>>;
    connect: any;
    create: any;
    join: any;
    error?: any;
    publishTrack: any;
    publishStream: any;
    unpublishTrack: any;
}

const StageContext = React.createContext<StageProps>(undefined);

export const StageConsumer = StageContext.Consumer;

export const StageProvider = (props: {
    children: React.ReactNode,
}) => {
    const [stage, setStage] = useState<Stage>();
    const [remoteParticipants, setRemoteParticipants] = useState<{ [userId: string]: Participant }>();
    const [error, setError] = useState<Error>();
    const [stageConnector] = useState<StageConnector>(() => {
        const stageConnector: StageConnector = new StageConnector();
        stageConnector.onError = (error: Error) => setError(error);
        stageConnector.onStageChanged = (stage: Stage) => {
            setStage(stage);
        };
        return stageConnector;
    });

    const connect = useCallback(async (user: firebase.User) => {
        return stageConnector.connect(user);
    }, [stageConnector]);

    const create = useCallback(async (stageName: string, password: string) => {
        return stageConnector.createStage(stageName, password);
    }, [stageConnector]);

    const join = useCallback(async (stageId: string, password: string) => {
        return stageConnector.joinStage(stageId, password);
    }, [stageConnector]);

    const publishTrack = useCallback(async (track: MediaStreamTrack, type: "mediasoup" | "p2p" = "p2p") => {
        return stageConnector.publishTrack(track, type);
    }, [stageConnector]);

    const publishStream = useCallback(async (stream: MediaStream, type: "mediasoup" | "p2p" = "p2p") => {
        return stageConnector.publishStream(stream, type);
    }, [stageConnector]);

    const unpublishTrack = useCallback((track: MediaStreamTrack) => {

    }, []);

    return (
        <StageContext.Provider value={{
            create: create,
            connect: connect,
            join: join,
            publishStream: publishStream,
            publishTrack: publishTrack,
            unpublishTrack: unpublishTrack,
            stage: stage,
            error: error,
            setStage: setStage,
            remoteParticipants: remoteParticipants,
            setRemoteParticipants: setRemoteParticipants
        }}>
            {props.children}
        </StageContext.Provider>
    );
};

export const useStage = () => useContext<StageProps>(StageContext);

/*
export const useStageController = (props: { user: firebase.User }) => {
    const {stage, setStage, remoteParticipants, setRemoteParticipants, stageConnector} = useStage();
    const [error, setError] = useState<Error>();


    const handleStageChange = useCallback((updatedStage: Stage) => {
        setStage(updatedStage);
        setRemoteParticipants(updatedStage.participants);
    }, []);

    useEffect(() => {
        console.log("Stage has really updated");
    }, [stage]);

    useEffect(() => {
        if (props.user) {
            stageConnector.current = new StageConnector();
            stageConnector.current.onError = (error: Error) => setError(error);
            stageConnector.current.onStageChanged = handleStageChange;
            stageConnector.current.connect(props.user);
        }
    }, [props.user]);


    const setSoundjackEnabled = useCallback((enabled: boolean) => {

    }, []);

    return {
        create,
        join,
        stage,
        error,
        remoteParticipants,
        publishTrack,
        unpublishTrack,
        setSoundjackEnabled
    }
};
*/
