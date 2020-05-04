import {extend, SocketWithRequest} from "../../util/SocketWithRequest";
import SocketIOClient from "socket.io-client";
import firebase from "firebase/app";
import "firebase/auth";

interface Participant {
    userId: string;
    name: string;
    socketId: string;
}

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


    constructor() {
    }

    connect = (host: string, port: number) => {
        this.socket = extend(SocketIOClient(host + ":" + port));
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
                    token,
                    stageId,
                    password: password ? password : null
                })
            });
    };
}
