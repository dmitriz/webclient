import {extend, SocketWithRequest} from "../../util/SocketWithRequest";
import SocketIOClient from "socket.io-client";
import firebase from "firebase/app";
import "firebase/auth";
import MediasoupConnector from "./extensions/MediasoupConnector";
import {CreateStagePayload, CreateStageResult, JoinStagePayload, JoinStageResult, StageRequests} from "./events/stage";


export class NotConnectedError extends Error {
}

export default class StageConnector {
    private socket: SocketWithRequest;
    private mediasoup: MediasoupConnector;


    constructor() {
    }

    connect = (user: firebase.User, host: string, port: number): Promise<void> => {
        //TODO: Reorganize connection and extension handling
        return user.getIdToken()
            .then((token: string) => {
                this.socket = extend(SocketIOClient(host + ":" + port, {
                    query: {token}
                }));
                this.mediasoup = new MediasoupConnector(this.socket);
                return;
            });
    };


    disconnect = () => {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.socket = undefined;
    };


    createStage = (stageName: string, type: "theater" | "music" | "conference", password?: string): Promise<CreateStageResult> => {
        if (!this.socket)
            throw new NotConnectedError();
        return this.socket.request(StageRequests.CreateStage, {
            stageName: stageName,
            password: password ? password : null,
            soundjack: false
        } as CreateStagePayload)
            .then((response) => {
                if (response.error) {
                    throw new Error(response.error);
                }
                console.log(response);
                return response;
            });
    };

    joinStage = (stageId: string, password?: string): Promise<JoinStageResult> => {
        if (!this.socket)
            throw new NotConnectedError();

        return this.socket.request(StageRequests.JoinStage, {
            stageId: stageId,
            password: password ? password : null,
            soundjack: false
        } as JoinStagePayload)
            .then((response) => {
                console.log(response);
                if (response.error) {
                    throw new Error(response.error);
                }
                return response;
            });
    };
}
