import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/database";
import * as publicIp from "public-ip";
import {EventEmitter} from 'events';

export interface DatabaseDevice {
    uid: string;

    name: string;

    ipv4?: string;
    ipv6?: string;

    canAudio: boolean;
    canVideo: boolean;

    sendAudio: boolean;
    sendVideo: boolean;
    receiveAudio: boolean;
    receiveVideo: boolean;
}


export abstract class IDeviceAPI extends EventEmitter {
    protected readonly user: firebase.User;
    private firestoreRef: firebase.database.Reference = undefined;
    private readonly name: string;
    protected canAudio: boolean = false;
    protected canVideo: boolean = false;
    private sendAudio: boolean = false;
    private sendVideo: boolean = false;
    protected receiveAudio: boolean = false;
    protected receiveVideo: boolean = false;
    protected static ipv4: string;
    protected static ipv6: string;

    protected constructor(user: firebase.User, name: string, options?: {
        canAudio?: boolean,
        canVideo?: boolean
    }) {
        super();
        this.user = user;
        this.name = name;
        if (!this.user) {
            throw new Error("TRACE ME");
        }
        if (options) {
            this.canAudio = options.canAudio;
            this.canVideo = options.canVideo;
        }
        this.registerDevice();
    }

    public abstract setStageId(stageId: string);

    public getDeviceId(): string | null {
        if (this.firestoreRef)
            return this.firestoreRef.key;
        return null;
    }

    private handleDeviceUpdate = (snapshot: firebase.database.DataSnapshot) => {
        const device: DatabaseDevice = snapshot.val() as DatabaseDevice;
        if( device ) {
            if (device.receiveVideo !== this.receiveVideo) {
                this.receiveVideo = device.receiveVideo;
                this.emit("receive-video", this.receiveVideo);
            }
            if (device.receiveAudio !== this.receiveAudio) {
                this.receiveAudio = device.receiveAudio;
                this.emit("receive-audio", this.receiveAudio);
            }
            if (device.sendVideo !== this.sendVideo) {
                this.sendVideo = device.sendVideo;
                this.emit("send-video", this.sendVideo);
            }
            if (device.sendAudio !== this.sendAudio) {
                this.sendAudio = device.sendAudio;
                this.emit("send-audio", this.sendAudio);
            }
        }
    }

    private static async getIPs() {
        if (!IDeviceAPI.ipv4) {
            try {
                IDeviceAPI.ipv4 = await publicIp.v4();
            } catch (error) {
                console.error(error);
            }
        }
        if (!IDeviceAPI.ipv6) {
            try {
                IDeviceAPI.ipv6 = await publicIp.v6();
            } catch (error) {
                console.error(error);
            }
        }
    }

    private async registerDevice(): Promise<void> {
        //TODO: assuming, that the ip does not change - however, this can be exported inside an goOnline and goOffline method
        //await IDeviceAPI.getIPs();
        const device: DatabaseDevice = {
            uid: this.user.uid,
            name: this.name,
            //ipv4: IDeviceAPI.ipv4 ? IDeviceAPI.ipv4 : null,
            //ipv6: IDeviceAPI.ipv6 ? IDeviceAPI.ipv6 : null,
            canAudio: this.canAudio,
            canVideo: this.canVideo,
            sendAudio: this.sendAudio,
            sendVideo: this.sendVideo,
            receiveAudio: this.receiveAudio,
            receiveVideo: this.receiveVideo
        };

        return firebase
            .database()
            .ref("devices")
            .push(device)
            .then((ref: firebase.database.Reference) => {
                ref.onDisconnect().remove();
                ref.on("value", this.handleDeviceUpdate);
                return ref;
            })
            .then((ref: firebase.database.Reference) => {
                this.firestoreRef = ref;
            })
            .catch((error) => console.error(error));
    }

    public isReady() {
        return this.firestoreRef !== undefined;
    }

    protected setCanAudio(canAudio: boolean): Promise<void> {
        if (!this.firestoreRef) {
            this.canAudio = canAudio;
            return;
        }
        return this.firestoreRef
            .update({
                canAudio: canAudio
            })
            .then(() => {
                this.canAudio = canAudio;
            })
    }

    protected setCanVideo(canVideo: boolean): Promise<void> {
        if (!this.firestoreRef) {
            this.canVideo = canVideo;
            return;
        }
        return this.firestoreRef
            .update({
                canVideo: canVideo
            })
            .then(() => {
                this.canVideo = canVideo;
            })
    }

    public async setSendAudio(sendAudio: boolean): Promise<void> {
        if (!this.firestoreRef) {
            this.sendAudio = sendAudio;
            return;
        }
        return this.firestoreRef
            .update({
                sendAudio: sendAudio
            })
            .then(() => {
                this.sendAudio = sendAudio;
                //this.emit("send-audio", sendAudio);
            });
    }

    public async setSendVideo(sendVideo: boolean): Promise<void> {
        if (!this.firestoreRef) {
            this.sendVideo = sendVideo;
            return;
        }
        return this.firestoreRef
            .update({
                sendVideo: sendVideo
            })
            .then(() => {
                this.sendVideo = sendVideo;
                //this.emit("send-video", sendVideo);
            });
    }

    public async setReceiveAudio(receiveAudio: boolean): Promise<void> {
        if (!this.firestoreRef) {
            this.receiveAudio = receiveAudio;
            return;
        }
        return this.firestoreRef
            .update({
                receiveAudio: receiveAudio
            })
            .then(() => {
                this.receiveAudio = receiveAudio;
                //this.emit("receive-audio", receiveAudio);
            });
    }

    public async setReceiveVideo(receiveVideo: boolean): Promise<void> {
        if (!this.firestoreRef) {
            this.receiveVideo = receiveVideo;
            return;
        }
        return this.firestoreRef
            .update({
                receiveVideo: receiveVideo
            })
            .then(() => {
                this.receiveVideo = receiveVideo;
                //this.emit("receive-video", receiveVideo);
            });
    }
}
