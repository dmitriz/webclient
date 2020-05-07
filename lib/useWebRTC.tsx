import {useConnection} from "./useConnection";
import {useCallback, useEffect, useState} from "react";
import {
    AnswerMadePayload,
    CandidateSentPayload,
    MakeAnswerPayload,
    MakeOfferPayload,
    OfferMadePayload,
    SendCandidatePayload,
    WebP2PEvents,
    WebP2PSends
} from "./events/webrtcp2p";
import {Participant} from "./model";

const configuration: RTCConfiguration = {
    iceServers: [
        {
            urls: ["stun:u3.xirsys.com"]
        }, {
            username: "A9V03PuTW8N9A3K8aEFra1taQjecR5LHlhW9DrjvZj1SvoGtMyhkj3XJLrYzAQpdAAAAAF6IzZ10b2JpYXM=",
            credential: "95ddd1a4-769f-11ea-a962-bea250b72c66",
            urls: [
                "turn:u3.xirsys.com:80?transport=udp",
                "turn:u3.xirsys.com:3478?transport=udp",
                "turn:u3.xirsys.com:80?transport=tcp",
                "turn:u3.xirsys.com:3478?transport=tcp",
                "turns:u3.xirsys.com:443?transport=tcp",
                "turns:u3.xirsys.com:5349?transport=tcp"
            ]
        }
    ]
};

export default (props: {
    localStream: MediaStream,
    useHighBitrate?: boolean
}) => {
    const [initialized, setInitialized] = useState<boolean>(false);
    const {stage, setStage, socket} = useConnection();

    useEffect(() => {
        if (socket && stage) {
            if (!initialized) {
                console.log("WEBRTC: Initializing");
                socket.on(WebP2PEvents.OfferMade, onOfferMade);
                socket.on(WebP2PEvents.AnswerMade, onAnswerMade);
                socket.on(WebP2PEvents.CandidateSent, onCandidateSend);


                setInitialized(true)
            } else {
                // Existing participants make offers to the new participant
                Object.values(stage.participants)
                    .forEach((remoteParticipant: Participant) => {
                        if (!remoteParticipant.webRTC.rtcPeerConnection) {
                            makeOffer(remoteParticipant);
                        }
                    });
            }

        }
    }, [socket, stage, initialized]);


    const makeOffer = useCallback((remoteParticipant: Participant) => {
        console.log("makeOffer");
        if (remoteParticipant.webRTC.rtcPeerConnection) {
            console.error("Handle this: make offer, but connection already there...");
        }
        remoteParticipant.webRTC.rtcPeerConnection = createRemoteConnection(remoteParticipant);
        remoteParticipant.webRTC.rtcPeerConnection.createOffer()
            .then((offer: RTCSessionDescriptionInit) => {
                if (props.useHighBitrate)
                    offer.sdp = offer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                return offer;
            })
            .then(async (offer: RTCSessionDescriptionInit) => {
                await remoteParticipant.webRTC.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(offer));
                return offer;
            })
            .then((offer: RTCSessionDescriptionInit) => {
                socket.emit(WebP2PSends.MakeOffer, {
                    targetUserId: remoteParticipant.userId,
                    offer: offer
                } as MakeOfferPayload);
            });
    }, [socket, stage]);

    const onOfferMade = useCallback((data: OfferMadePayload) => {
        console.log("onOfferMade");
        const remoteParticipant: Participant = stage.participants[data.userId];
        if (!remoteParticipant) {
            console.log(stage.participants);
            throw new Error("Not found: " + data.userId);
        }
        if (remoteParticipant.webRTC.rtcPeerConnection) {
            console.error("Got offer but have already peer connection established");
        }
        remoteParticipant.webRTC.rtcPeerConnection = createRemoteConnection(remoteParticipant);
        remoteParticipant.webRTC.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => remoteParticipant.webRTC.rtcPeerConnection.createAnswer())
            .then((answer: RTCSessionDescriptionInit) => {
                if (props.useHighBitrate) {
                    answer.sdp = answer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                }
                return answer;
            })
            .then(async (answer: RTCSessionDescriptionInit) => {
                await remoteParticipant.webRTC.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(answer));
                return answer;
            })
            .then((answer: RTCSessionDescriptionInit) => {
                socket.emit(WebP2PSends.MakeAnswer, {
                    targetUserId: remoteParticipant.userId,
                    answer: answer
                } as MakeAnswerPayload)
            });
    }, [socket, stage]);

    const onAnswerMade = useCallback((data: AnswerMadePayload) => {
        console.log("onAnswerMade");
        const remoteParticipant: Participant = stage.participants[data.userId];
        if (!remoteParticipant)
            throw new Error("Not found");
        if (!remoteParticipant.webRTC.rtcPeerConnection) {
            console.error("Got answer without established RTC peer connection");
            return;
        }
        remoteParticipant.webRTC.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer)).then(() => {
            console.log("Got answer");
        })
    }, [socket, stage]);

    const onCandidateSend = useCallback((data: CandidateSentPayload) => {
        console.log("onCandidateSend");
        const remoteParticipant: Participant = stage.participants[data.userId];
        if (remoteParticipant) {
            return remoteParticipant.webRTC.rtcPeerConnection.addIceCandidate(data.candidate);
        }
    }, [socket, stage]);

    const sendCandidate = useCallback((targetUserId: string, candidate: RTCIceCandidateInit) => {
        console.log("sendCandidate");
        socket.emit(WebP2PSends.SendCandidate, {
            targetUserId: targetUserId,
            candidate: candidate
        } as SendCandidatePayload);

    }, [socket, stage]);

    const createRemoteConnection = useCallback((remoteParticipant: Participant) => {
        console.log("createRemoteConnection");
        const rtcPeerConnection: RTCPeerConnection = new RTCPeerConnection(configuration);
        // And add playback track
        if (props.localStream)
            props.localStream.getTracks().forEach(
                (track: MediaStreamTrack) => {
                    rtcPeerConnection.addTrack(track, props.localStream)
                });
        rtcPeerConnection.onicecandidateerror = (error) => {
            console.log('failed to add ICE Candidate');
            console.log(error.errorText);
        };
        rtcPeerConnection.oniceconnectionstatechange = (event) => {
            console.log('ICE state change event: ', event);
        };
        rtcPeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
            console.log("ICE connected");
            if (ev.candidate && ev.candidate.candidate.length > 0) {
                sendCandidate(remoteParticipant.userId, ev.candidate);
            } else {
                console.log("Finished");
                remoteParticipant.webRTC.established = true;
            }
        };
        rtcPeerConnection.ontrack = (ev: RTCTrackEvent) => {
            console.log("GOT TRACK");
            const stream: MediaStream = remoteParticipant.stream;
            ev.streams[0].getTracks().forEach((track: MediaStreamTrack) => {
                stream.addTrack(track);
            });

            setStage(prevState => ({
                ...prevState,
                participants: {
                    ...prevState.participants,
                    [remoteParticipant.userId]: {
                        ...prevState.participants[remoteParticipant.userId],
                        stream: stream
                    }
                }
            }));
        };
        return rtcPeerConnection;
    }, [socket]);

    return {}
}
