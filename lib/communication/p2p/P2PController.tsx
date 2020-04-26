import {SocketWithRequest} from "../../../util/SocketWithRequest";
import {fixWebRTC} from "../../../util/fixWebRTC";

export interface PeerConnection {
    userId: string;
    socketId: string;
    rtcpPeerConnection: RTCPeerConnection;
    stream: MediaStream;
    established: boolean;
    tracks: MediaStreamTrack[];
    senders: {
        [trackId: string]: RTCRtpSender
    }
}

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

export default class P2PController {
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
        fixWebRTC();
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

    publishAdditionalTack(track: MediaStreamTrack): Promise<void> {
        return new Promise<void>(resolve => {
            Object.keys(this.peerConnections)
                .forEach((socketId: string) => {
                    console.log("Sending track to " + socketId);
                    this.peerConnections[socketId].rtcpPeerConnection.addTrack(track);
                    //this.peerConnections[socketId].senders[track.id] = this.peerConnections[socketId].rtcpPeerConnection.addTrack(track, this.localStream);
                });
            this.tracks[track.id] = track;
            resolve();
        });
    }

    unpublishAdditionalTrack(track: MediaStreamTrack): Promise<void> {
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
        console.log("createOffer");
        this.peerConnections[socketId] = this.createPeerConnection(userId, socketId);
        this.peerConnections[socketId].rtcpPeerConnection.createOffer()
            .then((offer: RTCSessionDescriptionInit) => {
                // offer.sdp = offer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                this.peerConnections[socketId].rtcpPeerConnection.setLocalDescription(new RTCSessionDescription(offer)).then(
                    () => this.makeOffer(socketId, offer)
                );
            });
    };

    private initializeSocketHandler = () => {
        this.socket.on("stg/p2p/candidate-sent", async (data: {
            uid: string;
            socketId: string;
            candidate: RTCIceCandidateInit;
        }) => {
            console.log('s > c: stg/p2p/candidate-sent: fromUserId=' + data.uid + " formSocketId=" + data.socketId);
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
            console.log("offer-made");
            console.log(data.offer);
            this.peerConnections[data.socketId] = this.createPeerConnection(data.uid, data.socketId);
            this.peerConnections[data.socketId].rtcpPeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
                .then(() => this.peerConnections[data.socketId].rtcpPeerConnection.createAnswer())
                .then((answer: RTCSessionDescriptionInit) => {
                    // answer.sdp = answer.sdp.replace('useinbandfec=1', 'useinbandfec=1; maxaveragebitrate=510000');
                    this.peerConnections[data.socketId].rtcpPeerConnection.setLocalDescription(new RTCSessionDescription(answer)).then(
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
            console.log(data.answer);
            const peerConnection: PeerConnection = this.peerConnections[data.socketId];
            if (peerConnection && peerConnection.rtcpPeerConnection) {
                peerConnection.rtcpPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer)).then(
                    () => console.log("Got answer")
                )
            } else {
                throw Error("stg/p2p/answer-made: Unknown peer '" + data.socketId + "' or peer has no rtcp connection");
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
            uid: this.userId,
            socketId: this.socket.id,
            targetSocketId: targetSocketId,
            candidate: candidate,
        });
    };

    private createPeerConnection = (remoteUserId: string, remoteSocketId: string): PeerConnection => {
        const connection: PeerConnection = {
            rtcpPeerConnection: new RTCPeerConnection(configuration),
            stream: new MediaStream(),
            established: false,
            userId: remoteUserId,
            socketId: remoteSocketId,
            tracks: [],
            senders: {}
        };
        // And add playback track
        connection.rtcpPeerConnection.onicecandidateerror = (error) => {
            console.log('failed to add ICE Candidate');
            console.log(error.errorText);
        };
        connection.rtcpPeerConnection.oniceconnectionstatechange = (event) => {
            console.log('ICE state change event: ', event);
        };
        connection.rtcpPeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
            console.log("ICE connected");
            if (ev.candidate && ev.candidate.candidate.length > 0) {
                this.sendCandidate(remoteSocketId, ev.candidate);
            } else {
                console.log("Finished");
                connection.established = true;
            }
        };
        connection.rtcpPeerConnection.ontrack = (ev: RTCTrackEvent) => {
            console.log("Got TRAKC");
        };
        return connection;
    };
}
