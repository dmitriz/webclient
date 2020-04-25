import {p2pConfiguration} from "./config";
import {SocketWithRequest} from "../../../util/SocketWithRequest";

export interface PeerConnection {
    uid: string;
    rtcpPeerConnection: RTCPeerConnection | null;
    established: boolean;
    tracks: MediaStreamTrack[];
    senders: {
        [trackId: string]: RTCRtpSender
    }
}

export default class P2PController {
    private readonly uid: string;
    private readonly socket: SocketWithRequest;
    private peerConnections: {
        [socketId: string]: PeerConnection
    } = {};
    private tracks: {
        [id: string]: MediaStreamTrack
    };

    constructor(socket: SocketWithRequest, uid: string) {
        this.socket = socket;
        this.uid = uid;
        this.initializeSocketHandler();
    }

    disconnect(): Promise<void> {
        return new Promise<void>(resolve => {
            Object.keys(this.peerConnections).forEach((socketId: string) => {
                this.peerConnections[socketId].rtcpPeerConnection.close();
            });
            return;
        });
    }

    publishTack(track: MediaStreamTrack): Promise<void> {
        return new Promise<void>(resolve => {
            Object.keys(this.peerConnections)
                .forEach((socketId: string) => {
                    //TODO: Discuss, if we need to wait for the connection to be established
                    this.peerConnections[socketId].senders[track.id] = this.peerConnections[socketId].rtcpPeerConnection.addTrack(track);
                });
            this.tracks[track.id] = track;
        });
    }

    unpublishTrack(track: MediaStreamTrack): Promise<void> {
        return new Promise<void>(resolve => {
            Object.keys(this.peerConnections)
                .forEach((socketId: string) => {
                    const sender: RTCRtpSender = this.peerConnections[socketId].senders[track.id];
                    if (sender) {
                        this.peerConnections[socketId].rtcpPeerConnection.removeTrack(sender);
                    }

                });
            delete this.tracks[track.id];
        });
    }

    private initializeSocketHandler = () => {
        this.socket.on("p2p-peer-candidate-sent", (data: {
            uid: string;
            socketId: string;
            candidate: RTCIceCandidateInit;
        }) => {
            const peerConnection: PeerConnection = this.peerConnections[data.socketId];
            if (peerConnection && peerConnection.rtcpPeerConnection) {
                peerConnection.rtcpPeerConnection.addIceCandidate(data.candidate);
            } else {
                console.error("p2p-peer-candidate-sent: Unknown peer '" + data.socketId + "' or peer has no rtcp connection:");
                console.error(peerConnection);
            }
        });

        this.socket.on("p2p-offer-made", (data: {
            uid: string;
            socketId: string;
            offer: RTCSessionDescriptionInit;
        }) => {
            const peerConnection: PeerConnection = this.createPeerConnection(data.uid, data.socketId);
            peerConnection.rtcpPeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
                .then(() => peerConnection.rtcpPeerConnection.createAnswer())
                .then((answer: RTCSessionDescriptionInit) => {
                    // answer.sdp = answer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                    peerConnection.rtcpPeerConnection.setLocalDescription(new RTCSessionDescription(answer)).then(
                        () => this.makeAnswer(data.socketId, answer)
                    )
                });
        });

        this.socket.on("p2p-answer-made", (data: {
            uid: string;
            socketId: string;
            answer: RTCSessionDescriptionInit;
        }) => {
            const peerConnection: PeerConnection = this.peerConnections[data.socketId];
            if (peerConnection && peerConnection.rtcpPeerConnection) {
                peerConnection.rtcpPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            } else {
                console.error("p2p-answer-made: Unknown peer '" + data.socketId + "' or peer has no rtcp connection:");
                console.error(peerConnection);
            }
        });
    }

    private makeOffer = (targetSocketId: string, offer: RTCSessionDescriptionInit) => {
        this.socket.emit("p2p-make-offer", {
            uid: this.uid,
            socketId: this.socket.id,
            targetSocketId: targetSocketId,
            offer: offer,
        });
    };

    private makeAnswer = (targetSocketId: string, answer: RTCSessionDescriptionInit) => {
        this.socket.emit('p2p-make-answer', {
            uid: this.uid,
            socketId: this.socket.id,
            targetSocketId: targetSocketId,
            answer: answer,
        });
    };

    private sendCandidate = (targetSocketId: string, candidate: RTCIceCandidate) => {
        this.socket.emit('p2p-send-candidate', {
            uid: this.uid,
            socketId: this.socket.id,
            targetSocketId: targetSocketId,
            candidate: candidate,
        });
    };

    private createPeerConnection = (uid: string, socketId: string): PeerConnection => {
        this.peerConnections[socketId] = {
            uid: uid,
            rtcpPeerConnection: new RTCPeerConnection(p2pConfiguration),
            established: false,
            tracks: [],
            senders: {}
        };
        this.peerConnections[socketId].rtcpPeerConnection.onicecandidateerror = (error) => {
            console.log('failed to add ICE Candidate');
            console.log(error.errorText);
        };
        this.peerConnections[socketId].rtcpPeerConnection.oniceconnectionstatechange = (event) => {
            console.log('ICE state change event: ', event);
        };
        this.peerConnections[socketId].rtcpPeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
            console.log("ICE connected");
            if (ev.candidate && ev.candidate.candidate.length > 0) {
                this.sendCandidate(socketId, ev.candidate);
            } else {
                this.peerConnections[socketId].established = true;
                console.log("ICE connection finally established");
            }
        };
        this.peerConnections[socketId].rtcpPeerConnection.ontrack = (ev: RTCTrackEvent) => {
            this.peerConnections[socketId].tracks.push(...ev.streams[0].getTracks());
        };
        return this.peerConnections[socketId];
    };
}
