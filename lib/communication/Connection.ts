import MediasoupController from "./mediasoup/MediasoupController";
import firebase from "firebase";
import { extend, SocketWithRequest } from "../../util/SocketWithRequest";
import SocketIOClient from "socket.io-client";
import P2PController from "./p2p/P2PController";
import { SocketEvents, StageJoinPayload, StageParticipantAnnouncement } from "./SocketEvents";

export interface Stage {
    id: string;
    name: string;
    password: string,
    type: "theater" | "music" | "conference";
    directorUid: string;
}

export interface Participant {
    userId: string;
    name: string;
    socketId: string;

    soundjack?: {
        ip: string;
        port: number;
    }
    tracks: MediaStreamTrack[];
}

export default class Connection {
    private readonly participants: {
        [userId: string]: Participant
    } = {};

    private socket: SocketWithRequest;
    private p2pController: P2PController;
    private mediasoupController: MediasoupController;

    //TODO: Make event handler out of this
    public onParticipantAdded?: (participant: Participant) => void;
    public onParticipantRemoved?: (participant: Participant) => void;
    public onParticipantChanged?: (participant: Participant) => void;

    constructor() {
        if (typeof window !== "undefined")
            window.addEventListener("beforeunload", (ev) => {
                ev.preventDefault();
                this.disconnect();
            });
    }

    connect = (hostname: string, port: number): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            this.socket = extend(SocketIOClient(hostname + ":" + port));
            this.initializeSocketHandler();
            resolve();
        });
    };

    private initializeSocketHandler = () => {
        this.socket.on('stg/participant/added', (announcement: StageParticipantAnnouncement) => {
            console.log("s > c: stg/participant-added: " + announcement.userId);
            // Add participant to list
            this.participants[announcement.userId] = {
                ...announcement,
                tracks: []
            };
            this.p2pController.addClientManually(announcement.userId, announcement.socketId);
            if (this.onParticipantAdded)
                this.onParticipantAdded(this.participants[announcement.userId]);
        });

        this.socket.on('stg/participant/removed', (announcement: StageParticipantAnnouncement) => {
            console.log("s > c: stg/participant-removed: " + announcement.userId);
            const participant: Participant = this.participants[announcement.userId];
            delete this.participants[announcement.userId];
            if (this.onParticipantRemoved)
                this.onParticipantRemoved(participant);
        });

        /*
        this.socket.on('stg/participants/state', (announcements: StageParticipantAnnouncement[]) => {
            console.log("s > c: stg/participants/state: length=" + announcements.length);
            announcements.forEach((announcement: StageParticipantAnnouncement) => this.participants[announcement.userId] = {
                ...announcement,
                tracks: []
            });
            Object.keys(this.participants).forEach((userId: string) => this.p2pController.addClientManually(userId, this.participants[userId].socketId));
        });*/
    };

    connected = (): boolean => {
        return this.socket !== undefined;
    };

    disconnect = async () => {
        if (this.mediasoupController) {
            await this.mediasoupController.disconnect();
            this.mediasoupController = undefined;
        }
        if (this.p2pController) {
            await this.p2pController.disconnect();
            this.p2pController = undefined;
        }
        this.socket.close();
        this.socket = undefined;
        //TODO: throw disconnected event
    };

    private initStage = async (user: firebase.User, stage: Stage, participants: StageParticipantAnnouncement[]) => {
        this.p2pController = new P2PController(this.socket, user.uid);
        this.p2pController.onTrackAdded = (userId: string, socketId: string, track: MediaStreamTrack) => {
            const participant = this.participants[userId];
            if (participant) {
                participant.tracks.push(track);
                if (this.onParticipantChanged)
                    this.onParticipantChanged(participant);
            } else {
                console.log("not found: " + userId);
            }
        };
        this.mediasoupController = new MediasoupController(this.socket, user.uid);
        this.mediasoupController.onConsumerAdded = (userId, consumer) => {
            const participant = this.participants[userId];
            if (participant) {
                participant.tracks.push(consumer.track);
                if (this.onParticipantChanged)
                    this.onParticipantChanged(participant);
            } else {
                console.log("not found: " + userId);
            }
        };
        await this.mediasoupController.connect();

        participants.forEach((p: StageParticipantAnnouncement) => {
            this.participants[p.userId] = {
                userId: p.userId,
                name: p.name,
                socketId: p.socketId,
                tracks: []
            };
            if (this.onParticipantAdded)
                this.onParticipantAdded(this.participants[p.userId]);
            this.p2pController.addClientManually(p.userId, p.socketId);
        });
    };

    joinStage = (user: firebase.User, stageId: string, password?: string): Promise<Stage> => {
        return user.getIdToken()
            .then((token: string) => {
                console.log("s > c: " + SocketEvents.stage.join + ": stageId=" + stageId + " userId=" + user.uid);
                return this.socket.request(SocketEvents.stage.join, {
                    stageId,
                    token,
                    password: password ? password : null
                } as StageJoinPayload)
                    .then(async (response: {
                        stage: Stage,
                        participants: StageParticipantAnnouncement[]
                    } | any): Promise<Stage> => {
                        console.log(response.participants);
                        if (response.stage) {
                            await this.initStage(user, response.stage, response.participants);
                            return response.stage as Stage;
                        } else {
                            if (response.error) {
                                throw new Error(response.error);
                            }
                            throw new Error("Invalid response from server: " + response);
                        }
                    })
            });
    };

    createStage = (user: firebase.User, stageName: string, password?: string, type: 'theater' | 'music' | 'conference' = 'theater'): Promise<Stage> => {
        return user.getIdToken()
            .then((token: string) => {
                console.log("s > c: " + SocketEvents.stage.create + ": stageName=" + stageName + " userId=" + user.uid + " type=" + type);
                return this.socket.request(SocketEvents.stage.create, {
                    stageName,
                    type,
                    token,
                    password: password ? password : null
                })
                    .then(async (response: {
                        stage: Stage,
                        participants: StageParticipantAnnouncement[]
                    } | { error: string } | any): Promise<Stage> => {
                        if (response.stage) {
                            const stage = {
                                id: response,
                                name: stageName,
                                type: type,
                                password: password,
                                directorUid: user.uid
                            };
                            await this.initStage(user, stage, response.participants);
                            return {
                                id: response,
                                name: stageName,
                                type: type,
                                password: password,
                                directorUid: user.uid
                            };
                        } else {
                            if (response.error) {
                                throw new Error(response.error);
                            }
                            throw new Error("Invalid response from server: " + response);
                        }
                    })
            });
    };

    publishTrack = (track: MediaStreamTrack, method: "mediasoup" | "p2p"): Promise<void> => {
        if (method === "mediasoup") {
            return this.mediasoupController.publishTack(track);
        } else {
            return this.p2pController.publishTack(track);
        }
    }
}
