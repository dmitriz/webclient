import {extend, SocketWithRequest} from "../../util/SocketWithRequest";
import SocketIOClient from "socket.io-client";
import firebase from "firebase/app";
import "firebase/auth";
import MediasoupConnector from "./extensions/MediasoupConnector";


interface CreateStageResult {
    id: string;
}

interface JoinStageResult {
    // Will be changed soon
    success: boolean;
}


export class NotConnectedError extends Error {
}

export default class StageConnector {
    private socket: SocketWithRequest;
    private mediasoup: MediasoupConnector;


    constructor() {
    }

    connect = (user: firebase.User, host: string, port: number) => {
        //TODO: Reorganize connection and extension handling
        return user.getIdToken()
            .then((token: string) => {
                this.socket = extend(SocketIOClient(host + ":" + port, {
                    query: {token}
                }));
                this.mediasoup = new MediasoupConnector(this.socket);
            });
    };

    disconnect = () => {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.socket = undefined;
    };

    createStage = (user: firebase.User, stageName: string, type: "theater" | "music" | "conference", password?: string): Promise<CreateStageResult> => {
        if (!this.socket)
            throw new NotConnectedError();
        return user.getIdToken()
            .then((token: string) => {
                return this.socket.request("stg/create", {
                    token,
                    stageName,
                    type,
                    password: password ? password : null
                })
            });
    };

    joinStage = (user: firebase.User, stageId: string, password?: string): Promise<JoinStageResult> => {
        if (!this.socket)
            throw new NotConnectedError();

        return user.getIdToken()
            .then((token: string) => {
                return this.socket.request("stg/join", {
                    token: token,
                    stageId: stageId,
                    password: password ? password : null
                })
                    .then((response) => {
                        console.log(response);
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return response.data;
                    })
            });
    };
}
