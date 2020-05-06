import {SocketWithRequest} from "../../../../util/SocketWithRequest";
import {Participant, Stage} from "../../model";
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
} from "../../events/webrtcp2p";

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
        }/*
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302'
            ]
        },/*
        {
            urls: 'turn:v22019048220387295.hotsrv.de:3478',
            username: ' digitalstage',
            credential: 'digitalstage'
        },
        {
            urls: 'turn:numb.viagenie.ca',
            username: ' tobias.hegemann@googlemail.com',
            credential: 'SE6q6nA5kSiKk4Z'
        }/*,
        {
            urls: 'turn:numb.viagenie.ca',
            username: ' tobias.hegemann@googlemail.com',
            credential: 'SE6q6nA5kSiKk4Z'
        }*/
    ],
    iceCandidatePoolSize: 10,
};

export const useWebRTC = (props: {
    socket: SocketWithRequest,
    stage: Stage,
    useHighBitrate?: boolean
}) => {
    const [publishedTracks, setPublishedTracks] = useState<{
        [trackId: string]: MediaStreamTrack
    }>();

    useEffect(() => {
        if (props.socket) {
            // Add socket handler
            props.socket.on(WebP2PEvents.OfferMade, onOfferMade);
            props.socket.on(WebP2PEvents.AnswerMade, onAnswerMade);
            props.socket.on(WebP2PEvents.CandidateSent, onCandidateSend);
        }
    }, [props.socket]);


    useEffect(() => {
        if (publishedTracks) {
            console.log("Publishing tracks");
            if (props.stage)
                Object.values(props.stage.participants).forEach((remoteParticipant: Participant) => {
                    console.log("Found remote user" + remoteParticipant.userId);
                    if (remoteParticipant.webRTC.rtcPeerConnection) {
                        // Sync tracks
                        remoteParticipant.webRTC.rtcPeerConnection.getSenders().forEach((sender: RTCRtpSender) => {
                            if (!publishedTracks[sender.track.id]) {
                                // Remove track
                                console.log("Removing published track " + sender.track.id);
                                remoteParticipant.webRTC.rtcPeerConnection.removeTrack(sender);
                            }
                        });
                        Object.keys(publishedTracks).forEach((trackId: string) => {
                            console.log(remoteParticipant.webRTC.rtcPeerConnection.getSenders());
                            if (!remoteParticipant.webRTC.rtcPeerConnection.getSenders().find((sender: RTCRtpSender) => sender.track !== null && sender.track.id === trackId)) {
                                console.log("Sending webrtc track " + trackId);
                                remoteParticipant.webRTC.rtcPeerConnection.addTrack(publishedTracks[trackId]);
                            }
                        });
                    } else {
                        console.log("No peer connection");
                    }
                });
        } else {
            // Remove all tracks from all remotes
            if (props.stage)
                Object.values(props.stage.participants).forEach((remoteParticipant: Participant) => {
                    if (remoteParticipant.webRTC.rtcPeerConnection)
                        remoteParticipant.webRTC.rtcPeerConnection.getSenders().forEach((sender: RTCRtpSender) => {
                            remoteParticipant.webRTC.rtcPeerConnection.removeTrack(sender);
                        });
                });
        }
    }, [publishedTracks]);

    const [greetingsSent, setGreetingsSent] = useState<boolean>(false);
    useEffect(() => {
        if (!greetingsSent) {
            if (props.stage) {
                console.log("Do this once entering a stage");
                makeOfferToAll();
                setGreetingsSent(true);
            }
        } else {
            if (!props.stage)
                setGreetingsSent(false);
        }
    }, [props.stage, greetingsSent]);

    const makeOfferToAll = useCallback(() => {
        if (props.stage) {
            console.log("Make offers");

            Object.values(props.stage.participants).forEach((remoteParticipant: Participant) => {
                makeOffer(remoteParticipant);
            });
        }
    }, [props.stage]);

    const onAnswerMade = useCallback((data: AnswerMadePayload) => {
        // Find participant
        const participant: Participant = props.stage.participants[data.userId];
        if (participant) {
            if (!participant.webRTC.rtcPeerConnection) {
                console.error("Got answer without established RTC peer connection");
                return;
            }
            participant.webRTC.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer)).then(() => {
                console.log("Got answer");
            })
        }
    }, [props.stage]);

    const onOfferMade = useCallback((data: OfferMadePayload) => {
        if (!props.socket)
            return;
        // Find participant
        const remoteParticipant: Participant = props.stage.participants[data.userId];
        if (remoteParticipant) {
            if (remoteParticipant.webRTC.rtcPeerConnection) {
                console.error("Got offer but have already peer connection established");
                return;
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
                    props.socket.emit(WebP2PSends.MakeAnswer, {
                        targetUserId: remoteParticipant.userId,
                        answer: answer
                    } as MakeAnswerPayload)
                });
        }
    }, [props.socket, props.stage]);

    const onCandidateSend = useCallback((data: CandidateSentPayload) => {
        const remoteParticipant: Participant = props.stage.participants[data.userId];
        if (remoteParticipant) {
            remoteParticipant.webRTC.rtcPeerConnection.addIceCandidate(data.candidate);
        }
    }, [props.stage]);

    const makeOffer = useCallback((remoteParticipant: Participant) => {
        if (!props.socket)
            return;
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
                props.socket.emit(WebP2PSends.MakeOffer, {
                    targetUserId: remoteParticipant.userId,
                    offer: offer
                } as MakeOfferPayload);
            });
    }, [props.socket, props.stage]);

    const sendCandidate = useCallback((targetUserId: string, candidate: RTCIceCandidateInit) => {
        if (!props.socket)
            return;
        props.socket.emit(WebP2PSends.SendCandidate, {
            targetUserId: targetUserId,
            candidate: candidate
        } as SendCandidatePayload);
    }, [props.socket]);

    const createRemoteConnection = useCallback((remoteParticipant: Participant): RTCPeerConnection => {
        const rtcPeerConnection: RTCPeerConnection = new RTCPeerConnection(configuration);
        // And add playback track
        if (publishedTracks)
            Object.values(publishedTracks).forEach(
                (track: MediaStreamTrack) => {
                    console.log("Adding playback track");
                    rtcPeerConnection.addTrack(track)
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
            ev.streams[0].getTracks().forEach((track: MediaStreamTrack) => {
                remoteParticipant.stream.addTrack(track);
            });
        };
        return rtcPeerConnection;
    }, [publishedTracks]);

    return {
        setPublishedTracks
    };
};
