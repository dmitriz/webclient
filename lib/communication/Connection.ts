import MediasoupController from "./mediasoup/MediasoupController";
import firebase from "firebase";
import {extend, SocketWithRequest} from "../../util/SocketWithRequest";
import SocketIOClient from "socket.io-client";
import P2PController from "./p2p/P2PController";
import {SocketEvents, StageJoinPayload, StageParticipantAnnouncement} from "./SocketEvents";

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

    soundjack?: {
        ip: string;
        port: number;
    }
    tracks: MediaStreamTrack[];
}

export interface ConnectionEventListener {
    onParticipantAdded: (participant: Participant) => void;
    onParticipantRemoved: (participant: Participant) => void;
    onParticipantChanged: (participant: Participant) => void;
}

export default class Connection {
    private readonly participants: {
        [userId: string]: Participant
    } = {};
    private readonly eventListener: Set<ConnectionEventListener> = new Set<ConnectionEventListener>();

    private socket: SocketWithRequest;
    private p2pController: P2PController;
    private mediasoupController: MediasoupController;

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
        this.socket.on('stg/participant-added', (announcement: StageParticipantAnnouncement) => {
            console.log("stg/participant-added: " + announcement.userId);
            // Add participant to list
            this.participants[announcement.userId] = {
                ...announcement,
                tracks: []
            };
            this.eventListener.forEach((l: ConnectionEventListener) => l.onParticipantAdded(this.participants[announcement.userId]));
        });

        this.socket.on('stg/participant-removed', (announcement: StageParticipantAnnouncement) => {
            console.log("stg/participant-removed: " + announcement.userId);
            const participant: Participant = this.participants[announcement.userId];
            delete this.participants[announcement.userId];
            this.eventListener.forEach((l: ConnectionEventListener) => l.onParticipantRemoved(participant));
        });

        this.socket.request('stg/participants/state')
            .then((announcements: StageParticipantAnnouncement[]) => {
                console.log("stg/participants: length=" + announcements.length);
                announcements.forEach((announcement: StageParticipantAnnouncement) => this.participants[announcement.userId] = {
                    ...announcement,
                    tracks: []
                });
            });
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

    joinStage = (user: firebase.User, stageId: string, password?: string): Promise<Stage> => {
        return user.getIdToken()
            .then((token: string) => {
                return this.socket.request(SocketEvents.stage.join, {
                    stageId,
                    token,
                    password: password ? password : null
                } as StageJoinPayload)
                    .then(async (response: {
                        stage: Stage
                    } | any): Promise<Stage> => {
                        if (response.stage) {
                            this.p2pController = new P2PController(this.socket, user.uid);
                            this.mediasoupController = new MediasoupController(this.socket, user.uid);
                            this.mediasoupController.onConsumerAdded = (userId, consumer) => {
                                const participant = this.participants[userId];
                                if (participant) {
                                    participant.tracks.push(consumer.track);
                                    this.eventListener.forEach((l) => l.onParticipantChanged(participant));
                                } else {
                                    console.log("not found: " + userId);
                                }
                            };
                            await this.mediasoupController.connect();

                            /*
                            this.socket.on("stg/client-added", () => {
                                console.log("stg/client-added: length=" + announcements.length);
                                console.log("client added");
                            });*/

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
                return this.socket.request(SocketEvents.stage.create, {
                    stageName,
                    type,
                    token,
                    password: password ? password : null
                })
                    .then((response: string | { error: string }): Stage => {
                        if (typeof response === "string") {
                            return {
                                id: response,
                                name: stageName,
                                type: type,
                                password: password,
                                directorUid: user.uid
                            };
                        } else {
                            if (typeof response === "object" && response.error) {
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

    addEventListener = (eventListener: ConnectionEventListener) => {
        this.eventListener.add(eventListener);
    };

    removeEventListener = (eventListener: ConnectionEventListener) => {
        this.eventListener.delete(eventListener);
    }
}
