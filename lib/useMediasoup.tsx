import {useConnection} from "./useConnection";
import {useEffect, useState} from "react";
import {fixWebRTC} from "../util/fixWebRTC";
import {WebP2PEvents} from "./events/webrtcp2p";
import {Participant} from "./model";

export default (props: {
    tracks?: {
        [trackId: string]: MediaStreamTrack
    }
}) => {
    const {stage, socket} = useConnection();
    const [initialized, setInitialized] = useState<boolean>(false);

    useEffect(() => {
        if (socket && stage) {
            if (!initialized) {
                console.log("Mediasoup: Initializing");
                /*
                if (socket.connected) {
                    socket.on(WebP2PEvents.OfferMade, onOfferMade);
                    socket.on(WebP2PEvents.AnswerMade, onAnswerMade);
                    socket.on(WebP2PEvents.CandidateSent, onCandidateSend);
                } else {
                    socket.on("connect", () => {
                        socket.on(WebP2PEvents.OfferMade, onOfferMade);
                        socket.on(WebP2PEvents.AnswerMade, onAnswerMade);
                        socket.on(WebP2PEvents.CandidateSent, onCandidateSend);
                    });
                }*/

                // Existing participants make offers to the new participant
                Object.values(stage.participants)
                    .forEach((remoteParticipant: Participant) => {
                        if (!remoteParticipant.webRTC.rtcPeerConnection) {
                            //makeOffer(remoteParticipant);
                        }
                    });

                setInitialized(true)
            } else {
            }

        }
    }, [socket, stage, initialized]);


    useEffect(() => {
        console.log("Mediasoup: Stage updated");
    }, [stage]);

    return {}
}
