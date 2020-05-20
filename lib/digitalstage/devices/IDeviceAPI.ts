import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/database";
import * as publicIp from "public-ip";
import {EventEmitter} from 'events';

export interface DatabaseDevice {
    uid: string;

    ipv4: string;
    ipv6: string;

    canAudio: boolean;
    canVideo: boolean;

    sendAudio: boolean;
    sendVideo: boolean;
    receiveAudio: boolean;
    receiveVideo: boolean;
}


export abstract class IDeviceAPI extends EventEmitter {
    protected readonly user: firebase.User;
    private firestoreRef: firebase.firestore.DocumentReference = undefined;

    protected canAudio: boolean;
    protected canVideo: boolean;
    protected sendAudio: boolean;
    protected sendVideo: boolean;
    protected receiveAudio: boolean;
    protected receiveVideo: boolean;
    protected ipv4: string;
    protected ipv6: string;

    protected constructor(user: firebase.User, options?: {
        canAudio?: boolean,
        canVideo?: boolean
    }) {
        super();
        this.user = user;
        if (options) {
            this.canAudio = options.canAudio;
            this.canVideo = options.canVideo;
        }
        this.registerDevice();
    }

    public abstract setStageId(stageId: string);

    public getDeviceId(): string | null {
        if (this.firestoreRef)
            return this.firestoreRef.id;
        return null;
    }

    private handleDeviceUpdate = (snapshot: firebase.firestore.DocumentSnapshot) => {
        const device: DatabaseDevice = snapshot.data() as DatabaseDevice;
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

    private async registerDevice(): Promise<void> {
        //TODO: assuming, that the ip does not change - however, this can be exported inside an goOnline and goOffline method
        try {
            this.ipv4 = await publicIp.v4();
            this.ipv6 = await publicIp.v6();
            const ref: firebase.firestore.DocumentReference = await firebase.firestore()
                .collection("devices")
                .add({
                    uid: this.user.uid,
                    ipv4: this.ipv4,
                    ipv6: this.ipv6,
                    canAudio: this.canAudio,
                    canVideo: this.canVideo,
                    sendAudio: this.sendAudio,
                    sendVideo: this.sendVideo,
                    receiveAudio: this.receiveAudio,
                    receiveVideo: this.receiveVideo
                } as DatabaseDevice);
            await firebase.database()
                .ref("status/" + this.firestoreRef.id)
                .set({
                    online: true
                });
            const unsubscribe = await this.firestoreRef
                .onSnapshot(this.handleDeviceUpdate)
            await firebase.database()
                .ref("status/" + this.firestoreRef.id)
                .onDisconnect().remove(unsubscribe);
            // Now we are safe to set this ref
            this.firestoreRef = ref;
        } catch (error) {
            console.error(error);
        }
    }

    public isReady() {
        return this.firestoreRef !== undefined;
    }

    protected setCanAudio(canAudio: boolean): Promise<void> {
        return this.firestoreRef
            .update({
                canAudio: canAudio
            })
            .then(() => {
                this.canAudio = canAudio;
            })
    }

    protected setCanVideo(canVideo: boolean): Promise<void> {
        return this.firestoreRef
            .update({
                canVideo: canVideo
            })
            .then(() => {
                this.canVideo = canVideo;
            })
    }

    public async setSendAudio(sendAudio: boolean): Promise<void> {
        return this.firestoreRef
            .update({
                sendAudio: sendAudio
            })
            .then(() => {
                this.sendAudio = sendAudio;
            });
    }

    public async setSendVideo(sendVideo: boolean): Promise<void> {
        return this.firestoreRef
            .update({
                sendVideo: sendVideo
            })
            .then(() => {
                this.sendVideo = sendVideo;
            });
    }

    public async setReceiveAudio(receiveAudio: boolean): Promise<void> {
        return this.firestoreRef
            .update({
                receiveAudio: receiveAudio
            })
            .then(() => {
                this.receiveAudio = receiveAudio;
            });
    }

    public async setReceiveVideo(receiveVideo: boolean): Promise<void> {
        return this.firestoreRef
            .update({
                receiveVideo: receiveVideo
            })
            .then(() => {
                this.receiveVideo = receiveVideo;
            });
    }

    public abstract isSendingAudio();

    public abstract isSendingVideo();

    public abstract isReceivingVideo();

    public abstract isReceivingAudio();
}
