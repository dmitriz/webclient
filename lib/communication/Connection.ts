import MediasoupController from "./mediasoup/MediasoupController";
import firebase from "firebase";
import {extend, SocketWithRequest} from "../../util/SocketWithRequest";
import SocketIOClient from "socket.io-client";

export interface Stage {
    participant: Participant[];
    directorUid: string;
}

export interface Participant {
    uid: string;
    name: string;

    tracks: MediaStreamTrack[];
}

export default class Connection {
    private socket: SocketWithRequest;
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
            resolve();
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
        this.socket.close();
        this.socket = undefined;
        //TODO: throw disconnected event
    };

    joinStage = (user: firebase.User, stageId: string, password?: string): Promise<Stage> => {
        return user.getIdToken()
            .then((token: string) => {
                console.log("join-stage");
                return this.socket.request("stg/join", {
                    stageId,
                    token,
                    password: password ? password : null
                })
                    .then(async (response: {
                        stage: Stage
                    } | any): Promise<Stage> => {
                        if (response.stage) {
                            this.mediasoupController = new MediasoupController(this.socket, user.uid);
                            await this.mediasoupController.connect();

                            this.socket.on("stg/client-added", () => {
                                console.log("client added");
                            });

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

    createStage = (user: firebase.User, name: string, password?: string, type: 'theater' | 'music' | 'conference' = 'theater'): Promise<Stage> => {
        return new Promise<Stage>((resolve, reject) => {

        });
    };
}
