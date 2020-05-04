import {SocketWithRequest} from "../../../util/SocketWithRequest";
import {configuration} from "./config";

const WebRTCSocketEvents = {
    Send: {
        // Server > Client
        MakeOffer: "stg/p2p/make-offer",
        MakeAnswer: "stg/p2p/make-answer",
        SendCandidate: "stg/p2p/send-candidate"
    },
    Receive: {
        // Client > Server
        PeerAdded: "stg/p2p/peer-added",
        OfferMade: "stg/p2p/offer-made",
        AnswerMade: "stg/p2p/answer-made",
        CandidateSent: "stg/p2p/candidate-sent"
    }
};

export interface PeerConnection {
    socketId: string;
    connection: RTCPeerConnection;
    established: boolean;
    senders: {
        [trackId: string]: RTCRtpSender
    }
}

//TODO: Terminology: Is this something more like a Bot? Like a P2PConnectionBot? Or P2PWebRTCConnectionBot?
// But on the other hand the main controller will use this class to create connections manually? And stream manually?
// So maybe more like this:
//  instance.connect(userId) <- will initialize connection with offer/answer mechanism
//  instance.connect(anoterhUserId)
//  instance.disconnect(anotherUserId)  <-- could be connect/disconnect or add and remove
//  instance.publishTrack(track) <-- will always stream to all connected, even if later users are connected
export default class WebRTCConnector {
    private readonly socket: SocketWithRequest;
    private connections: {
        [socketId: string]: PeerConnection
    } = {};
    private activeTracks: MediaStreamTrack[] = [];

    public onPeerAdded?: ((peer: PeerConnection) => any);
    public onPeerConnected?: ((peer: PeerConnection) => any);
    public onPeerRemoved?: ((peer: PeerConnection) => any);

    constructor(socket: SocketWithRequest) {
        this.socket = socket;
    }

    //TODO: Can we call this connect? Since this adds only the socket handler to listen for incoming connect instruction.
    //TODO: So maybe this is more something like start() and stop()?
    //TODO: And in general we might use the same interface for all P2P connections, including WebRTC and soundjack
    public connect = () => {
        // Add handler to react to socket events
        this.addSocketHandler();
    };

    public disconnect = () => {
        // Close connection to all p2p clients and remove socket handler
        this.removeSocketHandler();
        Object.keys(this.connections).forEach((socketId: string) => {
            this.activeTracks.forEach((track: MediaStreamTrack) => {
                this.stopSendingTrack(socketId, track)
            });
            this.removePeer(socketId);
        });
    };

    public addPeer = (socketId: string) => {
        this.createOffer(socketId);
    };

    public removePeer = (socketId: string) => {
        if (this.connections[socketId]) {
            const connection: PeerConnection = this.connections[socketId];
            connection.connection.close();
            delete this.connections[socketId];
            if (this.onPeerRemoved)
                this.onPeerRemoved(connection);
        }
    };

    public publishTrack = (track: MediaStreamTrack) => {
        //TODO: Add thread lock for onciecandidate during pushing
        this.activeTracks.push(track);
        // Iterate now through all establish connections, since not already establish connection will send this stream later (see onceicecandidate handling)
        Object.keys(this.connections).forEach((socketId: string) => {
            if (this.connections[socketId].established) {
                this.startSendingTrack(socketId, track);
            }
        })
    };

    public unpublishTrack = (track: MediaStreamTrack) => {
        //TODO: Add thread lock for onciecandidate during filtering
        this.activeTracks = this.activeTracks.filter((activeTrack: MediaStreamTrack) => activeTrack.id !== track.id);
        Object.keys(this.connections).forEach((socketId: string) => {
            //if (this.connections[socketId].established) {
            this.stopSendingTrack(socketId, track);
            //}
        })
    };

    private addSocketHandler = () => {
        this.socket.on(WebRTCSocketEvents.Receive.OfferMade, this.onReceiveOffer);
        this.socket.on(WebRTCSocketEvents.Receive.AnswerMade, this.onReceiveAnswer);
        this.socket.on(WebRTCSocketEvents.Receive.CandidateSent, this.onReceiveCandidate);
    };

    private removeSocketHandler = () => {
        this.socket.off(WebRTCSocketEvents.Receive.OfferMade, this.onReceiveOffer);
        this.socket.off(WebRTCSocketEvents.Receive.AnswerMade, this.onReceiveAnswer);
        this.socket.off(WebRTCSocketEvents.Receive.CandidateSent, this.onReceiveCandidate);
    };

    private createOffer = (targetSocketId: string) => {
        this.connections[targetSocketId] = this.createPeerConnection(targetSocketId);
        if (this.onPeerAdded)
            this.onPeerAdded(this.connections[targetSocketId]);
        this.connections[targetSocketId].connection.createOffer()
            .then((offer: RTCSessionDescriptionInit) => {
                this.connections[targetSocketId].connection.setLocalDescription(new RTCSessionDescription(offer))
                    .then(() => this.makeOffer(targetSocketId, offer))
            })

    };

    private makeOffer = (targetSocketId: string, offer: RTCSessionDescriptionInit) => {
        console.log("[P2P WebRTC Signaling] c > s: make offer to " + targetSocketId);
        this.socket.emit(WebRTCSocketEvents.Send.MakeOffer, {
            socketId: this.socket.id,
            targetSocketId: targetSocketId,
            offer: offer,
        });
    };

    private makeAnswer = (targetSocketId: string, answer: RTCSessionDescriptionInit) => {
        console.log("[P2P WebRTC Signaling] c > s: make answer to " + targetSocketId);
        this.socket.emit(WebRTCSocketEvents.Send.MakeAnswer, {
            socketId: this.socket.id,
            targetSocketId: targetSocketId,
            answer: answer,
        });
    };

    private sendCandidate = (targetSocketId: string, candidate: RTCIceCandidate) => {
        console.log("[P2P WebRTC Signaling] c > s: send candidate to " + targetSocketId);
        this.socket.emit('stg/p2p/send-candidate', {
            socketId: this.socket.id,
            targetSocketId: targetSocketId,
            candidate: candidate,
        });
    };

    private startSendingTrack = (targetSocketId: string, track: MediaStreamTrack) => {
        if (!this.connections[targetSocketId].senders[track.id]) {
            console.log("[P2P WebRTC Peer] start sending " + track.kind + " track " + track.id + " to " + targetSocketId);
            this.connections[targetSocketId].senders[track.id] = this.connections[targetSocketId].connection.addTrack(track);
        } else {
            console.warn("[P2P WebRTC Peer] Peer " + targetSocketId + " is already receiving " + track.kind + " track " + track.id);
        }
    };

    private stopSendingTrack = (targetSocketId: string, track: MediaStreamTrack) => {
        if (!this.connections[targetSocketId].senders[track.id]) {
            console.log("[P2P WebRTC Peer] stop sending " + track.kind + " track " + track + " to " + targetSocketId);
            this.connections[targetSocketId].connection.removeTrack(this.connections[targetSocketId].senders[track.id]);
        } else {
            console.warn("[P2P WebRTC Peer] Peer " + targetSocketId + " is not receiving " + track.kind + " track " + track.id);
        }
    };

    private onReceiveOffer = (payload: {
        socketId: string;
        offer: RTCSessionDescriptionInit;
    }) => {
        console.log("[P2P WebRTC Signaling] s > c: got offer from " + payload.socketId);
        this.connections[payload.socketId] = this.createPeerConnection(payload.socketId);
        if (this.onPeerAdded)
            this.onPeerAdded(this.connections[payload.socketId]);
        this.connections[payload.socketId].connection.setRemoteDescription(new RTCSessionDescription(payload.offer))
            .then(() => this.connections[payload.socketId].connection.createAnswer())
            .then((answer: RTCSessionDescriptionInit) => {
                this.connections[payload.socketId].connection.setLocalDescription(new RTCSessionDescription(answer))
                    .then(() => this.makeAnswer(payload.socketId, answer));
            });
    };

    private onReceiveAnswer = (payload: {
        socketId: string;
        answer: RTCSessionDescriptionInit;
    }) => {
        console.log("[P2P WebRTC Signaling] s > c: got answer from " + payload.socketId);
        this.connections[payload.socketId].connection.setRemoteDescription(new RTCSessionDescription(payload.answer));
    };

    private onReceiveCandidate = (payload: {
        socketId: string;
        candidate: RTCIceCandidateInit;
    }) => {
        console.log("[P2P WebRTC Signaling] s > c: got candidate from " + payload.socketId);

    };

    private createPeerConnection = (remoteSocketId: string): PeerConnection => {
        const connection: PeerConnection = {
            socketId: remoteSocketId,
            connection: new RTCPeerConnection(configuration),
            established: false,
            senders: {}
        };
        // And add playback track
        connection.connection.onicecandidateerror = (error) => {
            console.log('failed to add ICE Candidate');
            console.log(error.errorText);
        };
        connection.connection.oniceconnectionstatechange = (event) => {
            console.log('ICE state change event: ', event);
        };
        connection.connection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
            console.log("ICE connected");
            if (ev.candidate && ev.candidate.candidate.length > 0) {
                this.sendCandidate(remoteSocketId, ev.candidate);
            } else {
                console.log("Finished");
                connection.established = true;
                if (this.onPeerConnected)
                    this.onPeerConnected(connection);
            }
        };
        connection.connection.ontrack = (ev: RTCTrackEvent) => {
            console.log("[P2P WebRTC Peer] receiving track from " + remoteSocketId);
        };
        return connection;
    };

}
