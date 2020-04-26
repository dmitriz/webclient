import {p2pConfiguration} from "./config";
import {SocketWithRequest} from "../../../util/SocketWithRequest";

export interface PeerConnection {
    userId: string;
    rtcpPeerConnection: RTCPeerConnection | null;
    stream: MediaStream;
    established: boolean;
    tracks: MediaStreamTrack[];
    senders: {
        [trackId: string]: RTCRtpSender
    }
}

export default class P2PController {
    private readonly localStream = new MediaStream();
    private readonly userId: string;
    private readonly socket: SocketWithRequest;
    private peerConnections: {
        [socketId: string]: PeerConnection
    } = {};
    private tracks: {
        [id: string]: MediaStreamTrack
    } = {};

    onTrackAdded: (userId: string, socketId: string, track: MediaStreamTrack) => void;
    onTrackRemoved: (userId: string, socketId: string, track: MediaStreamTrack) => void;

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

    publishStream(stream: MediaStream): Promise<void> {
        return new Promise<void>(resolve => {
            Object.keys(this.peerConnections)
                .forEach((socketId: string) => {
                    //TODO: Discuss, if we need to wait for the connection to be established
                    console.log("Sending stream to " + socketId);
                    stream.getTracks().forEach((track: MediaStreamTrack) => {
                        this.peerConnections[socketId].rtcpPeerConnection.addTrack(track, stream);
                        //this.peerConnections[socketId].senders[track.id] = this.peerConnections[socketId].rtcpPeerConnection.addTrack(track, this.localStream);
                    })
                });
            resolve();
        });
    }

    publishTack(track: MediaStreamTrack): Promise<void> {
        return new Promise<void>(resolve => {
            this.localStream.addTrack(track);
            Object.keys(this.peerConnections)
                .forEach((socketId: string) => {
                    //TODO: Discuss, if we need to wait for the connection to be established
                    console.log("Sending track to " + socketId);
                    this.peerConnections[socketId].rtcpPeerConnection.addTrack(track, this.localStream);
                    //this.peerConnections[socketId].senders[track.id] = this.peerConnections[socketId].rtcpPeerConnection.addTrack(track, this.localStream);
                });
            this.tracks[track.id] = track;
            resolve();
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
        console.log("addClientManually(" + userId + ", " + socketId + ")");
        this.createOffer(userId, socketId);
    };

    removeClientManually = (userId: string, socketId: string) => {
        console.log("removeClientManually(" + userId + ", " + socketId + ")");
        this.peerConnections[socketId].rtcpPeerConnection.close();
        delete this.peerConnections[socketId];
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

        this.socket.on("stg/p2p/peer-candidate-sent", async (data: {
            userId: string;
            socketId: string;
            candidate: RTCIceCandidateInit;
        }) => {
            console.log('s > c: stg/p2p/peer-candidate-sent: fromUserId=' + data.userId + " formSocketId=" + data.socketId);
            const peerConnection: PeerConnection = this.peerConnections[data.socketId];
            if (peerConnection && peerConnection.rtcpPeerConnection) {
                return peerConnection.rtcpPeerConnection.addIceCandidate(data.candidate);
            } else {
                throw Error("stg/p2p/peer-candidate-sent: Unknown peer '" + data.socketId + "' or peer has no rtcp connection");
            }
        });

        this.socket.on("stg/p2p/offer-made", (data: {
            uid: string;
            socketId: string;
            offer: RTCSessionDescriptionInit;
        }) => {
            console.log('s > c: stg/p2p/offer-made: fromUserId=' + data.uid + " formSocketId=" + data.socketId);
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

        this.socket.on("stg/p2p/answer-made", (data: {
            uid: string;
            socketId: string;
            answer: RTCSessionDescriptionInit;
        }) => {
            console.log('s > c: stg/p2p/answer-made: fromUserId=' + data.uid + " formSocketId=" + data.socketId);
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
        console.log('c > s: stg/p2p/make-answer: targetSocketId=' + targetSocketId + " mySocketId=" + this.socket.id);
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
            stream: new MediaStream(),
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
            //const tracks: MediaStreamTrack[] = connection.remoteStream ? connection.remoteStream.getTracks() : [];
            //connection.remoteStream = ev.streams[0];
            //tracks.forEach((track) => connection.remoteStream.addTrack(track));

            console.log("Got P2P Track");
            ev.streams[0].getTracks().forEach((track: MediaStreamTrack) => {
                this.peerConnections[socketId].tracks.push(track);
                if (this.onTrackAdded)
                    this.onTrackAdded(remoteUserId, socketId, track);
            });
        };
        return this.peerConnections[socketId];
    };
}
