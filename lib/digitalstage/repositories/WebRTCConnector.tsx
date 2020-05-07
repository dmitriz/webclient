import {SocketWithRequest} from "../../../util/SocketWithRequest";
import {
    AnswerMadePayload,
    CandidateSentPayload,
    MakeAnswerPayload,
    MakeOfferPayload,
    OfferMadePayload,
    SendCandidatePayload,
    WebP2PEvents,
    WebP2PSends
} from "../events/webrtcp2p";
import {Participant, Stage} from "../model";
import {fixWebRTC} from "../../../util/fixWebRTC";

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
    ],
    iceCandidatePoolSize: 10,
};

export class WebRTCConnector {
    private readonly socket: SocketWithRequest;
    private readonly stage: Stage;
    private localStream: MediaStream;

    public onRemoteStreamAdded: (remoteParticipant: Participant, stream: MediaStream) => void;


    public constructor(socket: SocketWithRequest, stage: Stage) {
        fixWebRTC();
        this.stage = stage;
        this.socket = socket;
        this.socket.on(WebP2PEvents.OfferMade, this.onOfferMade);
        this.socket.on(WebP2PEvents.AnswerMade, this.onAnswerMade);
        this.socket.on(WebP2PEvents.CandidateSent, this.onCandidateSend);

        Object.values(this.stage.participants).forEach((remoteParticipant: Participant) => {
            console.log("Make offer");
            this.makeOffer(remoteParticipant);
        })
    };

    public setLocalStream = (stream: MediaStream) => {
        this.localStream = stream;
    };

    public publishTrack = (track: MediaStreamTrack) => {
        Object.keys(this.stage.participants)
            .forEach((userId: string) => {
                if (this.stage.participants[userId].webRTC.rtcPeerConnection) {
                    this.stage.participants[userId].webRTC.rtcPeerConnection.addTrack(track);
                }
            })
    };

    private onOfferMade = (data: OfferMadePayload) => {
        console.log("onOfferMade");
        if (!this.socket)
            return;
        // Find participant
        const remoteParticipant: Participant = this.stage.participants[data.userId];
        if (remoteParticipant) {
            if (remoteParticipant.webRTC.rtcPeerConnection) {
                console.error("Got offer but have already peer connection established");
                return;
            }
            remoteParticipant.webRTC.rtcPeerConnection = this.createRemoteConnection(remoteParticipant);
            remoteParticipant.webRTC.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
                .then(() => remoteParticipant.webRTC.rtcPeerConnection.createAnswer())
                .then((answer: RTCSessionDescriptionInit) => {
                    /*if (this.useHighBitrate) {
                        answer.sdp = answer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                    }*/
                    return answer;
                })
                .then(async (answer: RTCSessionDescriptionInit) => {
                    await remoteParticipant.webRTC.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(answer));
                    return answer;
                })
                .then((answer: RTCSessionDescriptionInit) => {
                    this.socket.emit(WebP2PSends.MakeAnswer, {
                        targetUserId: remoteParticipant.userId,
                        answer: answer
                    } as MakeAnswerPayload)
                });
        } else {
            console.error("Offer from unknown remote participant")
        }
    };

    private onAnswerMade = (data: AnswerMadePayload) => {
        console.log("onAnswerMade");
        // Find participant
        const participant: Participant = this.stage.participants[data.userId];
        if (participant) {
            if (!participant.webRTC.rtcPeerConnection) {
                console.error("Got answer without established RTC peer connection");
                return;
            }
            return participant.webRTC.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    };

    private onCandidateSend = (data: CandidateSentPayload) => {
        console.log("onCandidateSend");
        const remoteParticipant: Participant = this.stage.participants[data.userId];
        if (remoteParticipant) {
            return remoteParticipant.webRTC.rtcPeerConnection.addIceCandidate(data.candidate);
        }
    };

    public makeOffer = (remoteParticipant: Participant) => {
        if (!this.socket)
            return;
        if (remoteParticipant.webRTC.rtcPeerConnection) {
            console.error("Handle this: make offer, but connection already there...");
        }
        console.log("Make offer to " + remoteParticipant.displayName);
        remoteParticipant.webRTC.rtcPeerConnection = this.createRemoteConnection(remoteParticipant);
        return remoteParticipant.webRTC.rtcPeerConnection.createOffer()
            .then((offer: RTCSessionDescriptionInit) => {
                //if (props.useHighBitrate)
                //     offer.sdp = offer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                return offer;
            })
            .then(async (offer: RTCSessionDescriptionInit) => {
                await remoteParticipant.webRTC.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(offer));
                return offer;
            })
            .then((offer: RTCSessionDescriptionInit) => {
                this.socket.emit(WebP2PSends.MakeOffer, {
                    targetUserId: remoteParticipant.userId,
                    offer: offer
                } as MakeOfferPayload);
            });
    };

    private sendCandidate = (targetUserId: string, candidate: RTCIceCandidateInit) => {
        console.log("sendCandidate");
        if (!this.socket)
            return;
        this.socket.emit(WebP2PSends.SendCandidate, {
            targetUserId: targetUserId,
            candidate: candidate
        } as SendCandidatePayload);
    };

    private createRemoteConnection = (remoteParticipant: Participant): RTCPeerConnection => {
        const rtcPeerConnection: RTCPeerConnection = new RTCPeerConnection(configuration);
        // And add playback track
        if (this.localStream) {
            this.localStream.getTracks().forEach((track: MediaStreamTrack) => {
                rtcPeerConnection.addTrack(track, this.localStream);
            })
        }
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
                this.sendCandidate(remoteParticipant.userId, ev.candidate);
            } else {
                console.log("Finished");
                remoteParticipant.webRTC.established = true;
            }
        };
        rtcPeerConnection.ontrack = (ev: RTCTrackEvent) => {
            console.log("GOT TRACK");
            const tracks: MediaStreamTrack[] = remoteParticipant.stream ? remoteParticipant.stream.getTracks() : [];
            remoteParticipant.stream = ev.streams[0];
            tracks.forEach((track) => remoteParticipant.stream.addTrack(track));
            if (this.onRemoteStreamAdded)
                this.onRemoteStreamAdded(remoteParticipant, remoteParticipant.stream);
        };
        return rtcPeerConnection;
    }
}
