import {useCallback, useState} from "react";
import {extend, SocketWithRequest} from "../../util/SocketWithRequest";
import SocketIOClient from "socket.io-client";
import firebase from "firebase/app";
import "firebase/auth";
import WebRTCController from "./p2p/WebRTCController";

const SocketEvents = {
    Send: {
        // Server > Client
    },
    Request: {
        CreateStage: "stg/create",
        JoinStage: "stg/join"
    },
    Receive: {
        // Client > Server
        PeerAdded: "stg/p2p/peer-added",
        OfferMade: "stg/p2p/offer-made",
        AnswerMade: "stg/p2p/answer-made",
        CandidateSent: "stg/p2p/candidate-sent"
    }
};

interface Stage {
    id: string;
    name: string;
}

class StageConnector {
    private readonly socket: SocketWithRequest;

    constructor(host: string, port: number) {
        this.socket = extend(SocketIOClient(host + ":" + port));
    }
}


export const useStage = (host: string, port: number) => {
    const [socket] = useState<SocketWithRequest>(extend(SocketIOClient(host + ":" + port)));
    const [stage, setStage] = useState<Stage>();
    const [webRTCController] = useState<WebRTCController>(new WebRTCController(socket));

    const initializeSocketHandlers = useCallback(() => {
        if (!socket)
            throw new Error("Socket not initialized");

        // Attach WebRTC handling
        webRTCController.connect();

        socket.on(SocketEvents.Receive.PeerAdded, (data) => {
            console.log("peer added ! ");
            console.log(data);
            webRTCController.addPeer(data.socketId);
        })
    }, [socket]);

    const joinStage = useCallback((user: firebase.User, stageId: string, password?: string): Promise<Stage> => {
        return user.getIdToken()
            .then((token: string) => {
                return socket.request(SocketEvents.Request.JoinStage, {
                    stageId,
                    token,
                    password: password ? password : null
                })
                    .then(async (response: {
                        stage: Stage,
                        participants: {
                            userId: string;
                            name: string;
                            socketId: string;
                        }[],
                        error?: string;
                    }): Promise<Stage> => {
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        initializeSocketHandlers();
                        //TODO: Handle existing participants
                        setStage(response.stage);
                        return response.stage;
                    })
            });
    }, [socket]);

    const publishTrack = useCallback((track: MediaStreamTrack) => {
        webRTCController.publishTrack(track);
    }, [webRTCController]);

    const disconnect = useCallback(() => {
        socket.disconnect();
    }, [socket]);

    return {
        stage,
        joinStage,
        publishTrack
    };
};
