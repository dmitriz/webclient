import {IDeviceAPI} from "../IDeviceAPI";
import firebase from "firebase/app";
import "firebase/firestore";
import debounce from 'lodash.debounce';
import omit from 'lodash.omit';

interface SoundjackNode {
    id: string;
    uid: string;
    stageId: string;
    deviceId: string;
    ipv4: string;
    ipv6: string;
    port: number;
}

export interface SoundjackSettings {
    valid: boolean;
    inputAudioDevice: number;
    outputAudioDevice: number;
    channelConfiguration: number; // 0 = mono, 1 = dual mono, 2 = stereo
    bitDepth: number;
    sampleRate: number;
    bufferSize: number;
    frameSize: number;  // networkBlockSize
}

export interface ConnectionInfo {
    NAT: number;
    OS: string;
    interfaceIP: string;
    localBindPort: string;
    localIP: string;
    localIP2: string;
    localPort: string;
    localPort2: string;
}

export interface SoundjackRemoteConnection extends SoundjackNode {
    decodeFactor: string;
    channelCount: string;
    frameSize: string;
    latency?: string;
    remoteSoundLevel?: string;
    status: "active" | "disconnecting";
}

const getIdByIdAndPort = (haystack: { [id: string]: SoundjackNode }, ip: string, port: number) => {
    return Object.keys(haystack).find((id: string) => (haystack[id].ipv4 === ip && haystack[port].port === port));
}

export default class LocalSoundjackDevice extends IDeviceAPI {
    private unlistenRemoteSoudjacks: () => void;
    protected stageId: string = null;
    protected readonly port: number = 1234;
    protected isConnected: boolean = false;
    protected websocket: WebSocket;
    private connectionInfo: ConnectionInfo | null = null;
    private soundLevel: number = 0;
    private audioDevices: {
        [id: number]: string
    } = {};
    private availableSoundjacks: {
        [id: string]: SoundjackNode
    };
    private activeConnections: {
        [ip_and_port: string]: SoundjackRemoteConnection
    }


    private settings: SoundjackSettings = {
        valid: false,
        inputAudioDevice: 0,
        outputAudioDevice: 0,
        channelConfiguration: 1,
        bitDepth: 16,
        sampleRate: 40000,
        bufferSize: 512,
        frameSize: 512
    };

    constructor(user: firebase.User) {
        super(user, "Soundjack", {
            canAudio: false,
            canVideo: false
        });
    }

    public connect() {
        console.log("SOUNDJACK CONNECTING");
        this.websocket = new WebSocket("ws://localhost:" + this.port);
        this.attachWebSocketHandler();
        this.on("send-audio", (enabled) => {
            // Connect to all or disconnect from all available soundjack handlers
        });
    }

    public disconnect() {
        this.debouncedInitializeAudio.cancel();
        Object.keys(this.activeConnections).forEach((ip_and_port: string) => {
            this.disconnectFrom(ip_and_port);
        });
        if (this.websocket) {
            this.websocket.close();
        }
        this.isConnected = false;
        this.emit("connected", false);
    }

    private handleRemoteSoundjackNode = (querySnapshot: firebase.firestore.QuerySnapshot) => {
        return querySnapshot.docChanges().forEach((change: firebase.firestore.DocumentChange<SoundjackNode>) => {
            if (change.type === "added") {
                const soundjackNode: SoundjackNode = {
                    ...change.doc.data(),
                    id: change.doc.id
                };
                this.emit("remote-added", soundjackNode);
                this.connectTo(soundjackNode)
            }
            if (change.type === "removed") {
                if (this.availableSoundjacks[change.doc.id]) {
                    if (this.activeConnections[change.doc.id])
                        this.disconnectFrom(change.doc.id);
                    this.emit("remote-removed", this.availableSoundjacks[change.doc.id]);
                } else {
                    console.warn("Unkown soundjack device removed: " + change.doc.id);
                }
            }
        })
    };

    private connectTo(soundjackNode: SoundjackNode) {
        if (!this.isConnected)
            throw new Error("Not connected");

        this.websocket.send(JSON.stringify({
            type: "startStream",
            IP: soundjackNode.ipv4,
            port: soundjackNode.port.toString(),
            ownID: "0",
            remoteSenderID: "0",
            remoteNAT: ""
        }));
    }

    private disconnectFrom(ip_and_port: string) {
        if (!this.isConnected)
            throw new Error("Not connected");

        const soundjackNode: SoundjackNode = this.activeConnections[ip_and_port];
        if (soundjackNode) {
            this.websocket.send(JSON.stringify({
                type: "stopStream",
                ID: 0,  // I think this is fake in soundjack
                IP: soundjackNode.ipv4,
                port: soundjackNode.port,
            }));
        } else {
            throw new Error("Could not find any active connection with ip_and_port: " + ip_and_port);
        }
    }

    public setStageId(stageId: string) {
        if (this.stageId === stageId)
            return;
        if (!this.isConnected) {
            return;
        }
        this.stageId = stageId;
        if (this.stageId) {
            this.enableStageListeners();
        } else {
            this.disableStageListeners();
        }
    }

    private enableStageListeners = () => {
        firebase.firestore()
            .collection("soundjacks")
            .add({
                uid: this.user.uid,
                stageId: this.stageId,
                deviceId: this.getDeviceId(),
                ipv4: IDeviceAPI.ipv4 ? IDeviceAPI.ipv4 : null,
                ipv6: IDeviceAPI.ipv4 ? IDeviceAPI.ipv4 : null,
                port: this.port,
            } as SoundjackNode)
            .then((ref: firebase.firestore.DocumentReference) => {
                console.log("Published soundjack " + ref.id);
                this.emit("soundjack-published", ref.id);
            })
        this.unlistenRemoteSoudjacks = firebase.firestore()
            .collection("users/" + this.user.uid + "/soundjacks")
            .onSnapshot(this.handleRemoteSoundjackNode);
    }
    private disableStageListeners = () => {
        this.unlistenRemoteSoudjacks();
        firebase.firestore()
            .collection("producers")
            .where("deviceId", "==", this.getDeviceId())
            .get()
            .then((snapshots: firebase.firestore.QuerySnapshot) => snapshots.forEach((snapshot) => snapshot.ref.delete()));
    }

    public setSoundLevel = (soundLevel: number) => {
        this.websocket.send(JSON.stringify({
            type: "setLocalVolume",
            level: soundLevel.toString()
        }));
    };

    public setInputDevice = (id: number) => {
        if (this.audioDevices[id] && this.settings.inputAudioDevice !== id) {
            this.settings.inputAudioDevice = id;
            this.debouncedInitializeAudio();
        }
    };

    public setOutputDevice = (id: number) => {
        if (this.audioDevices[id] && this.settings.outputAudioDevice !== id) {
            this.settings.outputAudioDevice = id;
            this.debouncedInitializeAudio();
        }
    };

    public setFrameSize = (frameSize: number) => {
        if (this.settings.frameSize !== frameSize) {
            this.settings.frameSize = frameSize;
            this.debouncedInitializeAudio();
        }
    };
    public setBufferSize = (bufferSize: number) => {
        if (this.settings.bufferSize !== bufferSize) {
            this.settings.bufferSize = bufferSize;
            this.debouncedInitializeAudio();
        }
    };

    private initializeAudio = () => {
        this.websocket.send(JSON.stringify({
            type: "stopAudioEngine"
        }));
        this.websocket.send(JSON.stringify({
            audioChannelIndex: this.settings.channelConfiguration.toString(),
            bitDepth: this.settings.bitDepth.toString(),
            buchse1: "on",
            buchse2: "on",
            buchse3: "off",
            buchse4: "off",
            buchse5: "off",
            buchse6: "off",
            buchse7: "off",
            buchse8: "off",
            frameSize: this.settings.bufferSize.toString(),
            frameSizeSend: this.settings.frameSize.toString(),
            inputIndex: this.settings.inputAudioDevice.toString(),
            outputIndex: this.settings.outputAudioDevice.toString(),
            sampleRate: this.settings.sampleRate.toString(),
            type: "startAudioEngine"
        }));
    };
    private debouncedInitializeAudio = debounce(this.initializeAudio, 200);

    private attachWebSocketHandler = () => {
        this.websocket.onopen = () => {
            this.websocket.send(JSON.stringify({
                type: "standalone",
                mode: "private"
            }));
        };

        this.websocket.onmessage = (event: MessageEvent) => {
            const message: {
                type: string;
                [key: string]: any;
            } = JSON.parse(event.data);

            switch (message.type) {
                case 'standalone':
                    //this.version = message.version;
                    setTimeout(() => {
                        this.websocket.send(JSON.stringify({
                            type: "probe"
                        }));
                        this.emit("connected", true);
                    }, 10);
                    this.websocket.send(JSON.stringify({
                        type: "bind",
                        IP: "0.0.0.0",
                        port: "50000"
                    }));
                    break;
                case 'setVideoDeviceInfo':
                    // Ignore
                    break;
                case 'setAudioDeviceInfo':
                    this.audioDevices = {
                        ...this.audioDevices,
                        [message.audioCount]: message.audioName
                    };
                    break;
                case 'streamIsHere':
                    if (message.ID !== "X") {
                        const remoteConnection: SoundjackRemoteConnection = this.activeConnections[message.IP + message.port];
                        if (remoteConnection) {
                            remoteConnection.channelCount = message.channelCount;
                            remoteConnection.decodeFactor = message.decodeFactor;
                            remoteConnection.frameSize = message.frameSize;
                            remoteConnection.status = "active";
                        } else {
                            let id: string = Object.keys(this.availableSoundjacks).find((id: string) => {
                                return this.availableSoundjacks[id].ipv4 === message.IP &&
                                    this.availableSoundjacks[id].port === message.port;
                            });
                            if (this.availableSoundjacks[id]) {
                                this.activeConnections[message.IP + message.port] = {
                                    ...this.availableSoundjacks[id],
                                    channelCount: message.channelCount,
                                    decodeFactor: message.decodeFactor,
                                    frameSize: message.frameSize,
                                    status: "active"
                                } as SoundjackRemoteConnection;
                                this.emit("remote-connected", this.activeConnections[id]);
                            } else {
                                console.warn("Unkown incoming request, ignoring it");
                            }
                        }
                    }
                    break;
                case 'setRemoteSoundLevel':
                    const handleSetRemoteSoundLevel = () => {
                        let id: string = Object.keys(this.availableSoundjacks).find((id: string) => {
                            return this.availableSoundjacks[id].ipv4 === message.IP &&
                                this.availableSoundjacks[id].port === message.port;
                        });
                        const remoteConnection: SoundjackRemoteConnection = this.activeConnections[message.data1];
                        if (remoteConnection && remoteConnection.remoteSoundLevel !== message.data2) {
                            //TODO: What is new here?
                            remoteConnection.remoteSoundLevel = message.data2;
                            this.emit("remote-changed", remoteConnection);
                        }
                    };
                    handleSetRemoteSoundLevel();
                    break;
                case 'streamIsGone':
                    const handleStreamIsGone = () => {
                        //TODO: Handle remote streams (!)
                        const remoteConnection: SoundjackRemoteConnection = this.activeConnections[message.IP + message.port];
                        if (remoteConnection) {
                            this.activeConnections = omit(this.activeConnections, remoteConnection.id);
                            this.emit("remote-disconnected", remoteConnection);
                        }
                    };
                    handleStreamIsGone();
                    break;
                case 'tellLatency':
                    // Only accept active streams
                    const handleTellLatency = () => {
                        const remoteConnection: SoundjackRemoteConnection = this.activeConnections[message.data3 + message.data4];
                        if (remoteConnection) {
                            remoteConnection.latency = message.data2;
                            this.emit("remote-changed", remoteConnection);
                        }
                    };
                    handleTellLatency();
                    break;
                case 'setNICOptions':
                    //TODO: Shall we store the data somewhere?
                    break;
                case 'soundCardStatus':
                    break;
                case 'setLocalSoundLevel':
                    if (this.soundLevel !== message.maxSampleValue) {
                        this.soundLevel = message.maxSampleValue;
                        this.emit("soundlevel-changed", this.soundLevel);
                    }
                    break;
                case 'tellPort':
                    this.connectionInfo = {
                        NAT: message.NAT,
                        interfaceIP: message.interfaceIP,
                        localIP: message.localIP,
                        localIP2: message.localIP2,
                        localBindPort: message.localBindPort,
                    } as ConnectionInfo;
                    this.emit("connection-info", this.connectionInfo);
                    break;
                case 'tellDropout':
                    this.emit("dropout", this.activeConnections[message.data3 + message.data4]);
                    break;
                default:
                    // Soundjack is sending weird empty messages, so exclude these
                    if (message.type) {
                        console.warn("Unhandled message:");
                        console.log(message);
                        console.log(event);
                    }
                    break;
            }
        };
        this.websocket.onerror = (error: Event) => {
            console.error(error);
            this.emit("error", error);
            this.emit("connected", false);
            this.isConnected = false;
        };
        this.websocket.onclose = (event: CloseEvent) => {
            this.emit("connected", false);
            this.isConnected = false;
        };
    }
}
