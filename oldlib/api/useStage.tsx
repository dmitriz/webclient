import {useCallback, useEffect, useState} from "react";
import {extend, SocketWithRequest} from "../../util/SocketWithRequest";
import SocketIOClient from "socket.io-client";
import firebase from "firebase/app";
import "firebase/auth";
import WebRTCConnector from "./p2p/WebRTCConnector";
import publicIp from "public-ip";
import OldSoundjackController from "./soundjack/OldSoundjackController";
import MediasoupConnector from "../../lib/digitalstage/extensions/MediasoupConnector";

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

interface Participant {

}

class UseStage {
    private readonly socket: SocketWithRequest;

    constructor(host: string, port: number) {
        this.socket = extend(SocketIOClient(host + ":" + port));
    }
}


export const useStage = (props: { user: firebase.User, host: string, port: number }) => {
    const [socket, setSocket] = useState<SocketWithRequest>();

    const [ip, setIp] = useState<string>();

    const [mediasoup, setMediasoup] = useState<MediasoupConnector>();
    const [webRTC, setWebRTC] = useState<WebRTCConnector>();
    const [soundjackController] = useState<OldSoundjackController>(new OldSoundjackController());


    const [stage, setStage] = useState<Stage>();
    const [participants, setParticipants] = useState<Participant>();

    const [isSoundjackStreaming, setSoundjackStreaming] = useState<boolean>(false);

    useEffect(() => {
        publicIp.v4().then(
            (ip: string) => setIp(ip)
        );
    }, []);

    useEffect(() => {
        setSocket(extend(SocketIOClient(props.host + ":" + props.port)));
    }, [props.host, props.port]);

    useEffect(() => {
        if (socket && props.user) {
            const webRTC = new WebRTCConnector(socket);
            const mediasoup = new MediasoupConnector(socket, props.user.uid);
            webRTC.connect();
            soundjackController.connect();
            setMediasoup(mediasoup);
            setWebRTC(webRTC);
        }
    }, [props.user, socket]);

    const initializeSocketHandlers = useCallback(() => {
        if (!socket)
            throw new Error("Socket not initialized");


        socket.on(SocketEvents.Receive.PeerAdded, (data) => {
            console.log("peer added ! ");
            console.log(data);
            webRTC.addPeer(data.socketId);
            if (isSoundjackStreaming) {
                //TODO: Let soundjack stream to user
            }
        })
    }, [socket]);

    const joinStage = useCallback((stageId: string, password?: string): Promise<Stage> => {
        if (!props.user)
            throw new Error("No user");
        return props.user.getIdToken()
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
        webRTC.publishTrack(track);
    }, [webRTC]);

    const publishSoundjack = useCallback(() => {

    }, [soundjackController]);

    const disconnect = useCallback(() => {
        socket.disconnect();
    }, [socket]);

    return {
        stage,
        joinStage,
        publishTrack,
        participants
    };
};
