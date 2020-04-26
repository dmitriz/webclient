import {p2pConfiguration} from "./config";
import {SocketWithRequest} from "../../../util/SocketWithRequest";

export interface PeerConnection {
    userId: string;
    rtcpPeerConnection: RTCPeerConnection | null;
    established: boolean;
    tracks: MediaStreamTrack[];
    senders: {
        [trackId: string]: RTCRtpSender
    }
}

export interface P2PControllerEventHandler {
    onConnected: () => void;
    onDisconnected: () => void;
    onPeerAdded: (peer: PeerConnection) => void;
    onPeerRemoved: (peer: PeerConnection) => void;
    onPeerChanged: (peer: PeerConnection) => void;
}

export default class P2PController {
    private readonly userId: string;
    private readonly socket: SocketWithRequest;
    private peerConnections: {
        [socketId: string]: PeerConnection
    } = {};
    private tracks: {
        [id: string]: MediaStreamTrack
    } = {};

    constructor(socket: SocketWithRequest, userId: string) {
        this.socket = socket;
        this.userId = userId;
        this.initializeSocketHandler();
    }

    //TODO: Discuss, this is not really disconnecting, since the socket listener are still active and connection may be made during or after
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

    addClientManually = (userId: string, socketId: string) => {
        this.createOffer(userId, socketId);
    };


    private createOffer = (userId: string, socketId: string) => {
        const peerConnection: PeerConnection = this.createPeerConnection(userId, socketId);
        peerConnection.rtcpPeerConnection.createOffer()
            .then((offer: RTCSessionDescriptionInit) => {
                // offer.sdp = offer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                peerConnection.rtcpPeerConnection.setLocalDescription(new RTCSessionDescription(offer)).then(
                    () => this.makeOffer(socketId, offer)
                );
            });
    };

    private initializeSocketHandler = () => {
        /*
        this.socket.on(SocketEvents.stage.participants, (data: StageParticipantAnnouncement[]) => {
            data.forEach((data: StageParticipantAnnouncement) => {
                this.createOffer(data.userId, data.socketId);
            });
        });*/

        this.socket.on("stg/p2p/peer-candidate-sent", (data: {
            userId: string;
            socketId: string;
            candidate: RTCIceCandidateInit;
        }) => {
            console.log('s > c: stg/p2p/peer-candidate-sent: userId=' + data.userId + ", socketId=" + data.socketId);
            const peerConnection: PeerConnection = this.peerConnections[data.socketId];
            if (peerConnection && peerConnection.rtcpPeerConnection) {
                peerConnection.rtcpPeerConnection.addIceCandidate(data.candidate);
            } else {
                console.error("stg/p2p/peer-candidate-sent: Unknown peer '" + data.socketId + "' or peer has no rtcp connection:");
                console.error(peerConnection);
            }
        });

        this.socket.on("stg/p2p/offer-made", (data: {
            userId: string;
            socketId: string;
            offer: RTCSessionDescriptionInit;
        }) => {
            console.log('s > c: stg/p2p/offer-made: ' + data.userId);
            const peerConnection: PeerConnection = this.createPeerConnection(data.userId, data.socketId);
            peerConnection.rtcpPeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
                .then(() => peerConnection.rtcpPeerConnection.createAnswer())
                .then((answer: RTCSessionDescriptionInit) => {
                    // answer.sdp = answer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                    peerConnection.rtcpPeerConnection.setLocalDescription(new RTCSessionDescription(answer)).then(
                        () => this.makeAnswer(data.socketId, answer)
                    )
                });
        });

        this.socket.on("stg/p2p/answer-made", (data: {
            userId: string;
            socketId: string;
            answer: RTCSessionDescriptionInit;
        }) => {
            console.log('s > c: stg/p2p/answer-made: ' + data.userId);
            const peerConnection: PeerConnection = this.peerConnections[data.socketId];
            if (peerConnection && peerConnection.rtcpPeerConnection) {
                peerConnection.rtcpPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            } else {
                console.error("stg/p2p/answer-made: Unknown peer '" + data.socketId + "' or peer has no rtcp connection:");
                console.error(peerConnection);
            }
        });
    };

    private makeOffer = (targetSocketId: string, offer: RTCSessionDescriptionInit) => {
        console.log('s > *: stg/p2p/make-offer: targetSocketId=' + targetSocketId);
        this.socket.emit("stg/p2p/make-offer", {
            userId: this.userId,
            socketId: this.socket.id,
            targetSocketId: targetSocketId,
            offer: offer,
        });
    };

    private makeAnswer = (targetSocketId: string, answer: RTCSessionDescriptionInit) => {
        console.log('c > s: stg/p2p/make-answer: targetSocketId=' + targetSocketId);
        this.socket.emit('stg/p2p/make-answer', {
            userId: this.userId,
            socketId: this.socket.id,
            targetSocketId: targetSocketId,
            answer: answer,
        });
    };

    private sendCandidate = (targetSocketId: string, candidate: RTCIceCandidate) => {
        console.log('c > s: stg/p2p/send-candidate: targetSocketId=' + targetSocketId);
        this.socket.emit('stg/p2p/send-candidate', {
            userId: this.userId,
            socketId: this.socket.id,
            targetSocketId: targetSocketId,
            candidate: candidate,
        });
    };

    private createPeerConnection = (remoteUserId: string, socketId: string): PeerConnection => {
        this.peerConnections[socketId] = {
            userId: remoteUserId,
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
