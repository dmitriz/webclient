import {EventEmitter} from "events";
import firebase from "firebase";
import {handleError} from "../../Debugger";
import DatabaseDevice from "./deviceTypes/DatabaseDevice";

export type DeviceEventType =
    | 'change'
    | 'canAudio'
    | 'canVideo'
    | 'receiveAudio'
    | 'receiveVideo'
    | 'sendAudio'
    | 'sendVideo';

interface DatabaseDeviceWithId extends DatabaseDevice {
    id: string;
}

export default abstract class AbstractDevice extends EventEmitter {
    protected readonly user: firebase.User;
    protected readonly deviceRef: firebase.database.Reference;
    protected latestSnapshot?: DatabaseDeviceWithId;

    protected constructor(user: firebase.User, reference: firebase.database.Reference) {
        super();
        this.user = user;
        this.deviceRef = reference;
    }

    protected registerValueChangeListener() {
        return this.deviceRef
            .on("value", this.handleValueChange, null, this);
    }

    public on(event: DeviceEventType | string, listener: (arg: any) => void): this {
        return super.on(event, listener);
    }

    public once(event: DeviceEventType | string, listener: (arg: any) => void): this {
        return super.once(event, listener);
    }

    public emit(event: DeviceEventType | string, arg: any): boolean {
        return super.emit(event, arg);
    }

    public off(event: DeviceEventType | string, listener: (...args: any[]) => void): this {
        return super.off(event, listener);
    }

    public get id() {
        return this.deviceRef.key;
    }

    public get name() {
        return this.latestSnapshot && this.latestSnapshot.name;
    }

    public get caption() {
        return this.latestSnapshot && this.latestSnapshot.caption;
    }

    public get canVideo() {
        return this.latestSnapshot && this.latestSnapshot.canVideo;
    }

    public get canAudio() {
        return this.latestSnapshot && this.latestSnapshot.canAudio;
    }

    public get sendAudio() {
        return this.latestSnapshot && this.latestSnapshot.sendAudio;
    }

    public get sendVideo() {
        return this.latestSnapshot && this.latestSnapshot.sendVideo;
    }

    public get receiveAudio() {
        return this.latestSnapshot && this.latestSnapshot.receiveAudio;
    }

    public get receiveVideo() {
        return this.latestSnapshot && this.latestSnapshot.receiveVideo;
    }

    public setCaption(caption: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.latestSnapshot || this.latestSnapshot.caption !== caption) {
                return this.deviceRef.update({
                    caption: caption
                })
                    .then(() => resolve(true))
                    .catch((error) => {
                        reject(false);
                    })
            }
            resolve(false);
        })
    }

    public setCanAudio(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.latestSnapshot || this.latestSnapshot.canAudio !== enable) {
                return this.deviceRef.update({
                    canAudio: enable
                })
                    .then(() => resolve(true))
                    .catch((error) => {
                        reject(error);
                    })
            }
            resolve(false);
        })
    }

    public setCanVideo(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.latestSnapshot || this.latestSnapshot.canVideo !== enable) {
                return this.deviceRef
                    .update({
                        canVideo: enable
                    })
                    .then(() => resolve(true))
                    .catch((error) => {
                        reject(error);
                    })
            }
            resolve(false);
        })
    }

    public setReceiveAudio(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.latestSnapshot || this.latestSnapshot.receiveAudio !== enable) {
                return this.deviceRef
                    .update({
                        receiveAudio: enable
                    })
                    .then(() => resolve(true))
                    .catch((error) => {
                        reject(false);
                    })
            }
            resolve(false);
        })
    }

    public setReceiveVideo(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.latestSnapshot || this.latestSnapshot.receiveVideo !== enable) {
                return this.deviceRef
                    .update({
                        receiveVideo: enable
                    })
                    .catch((error) => {
                        reject(false);
                    })
            }
            resolve(false);
        })
    }

    public setSendAudio(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.latestSnapshot || this.latestSnapshot.sendAudio !== enable) {
                return this.deviceRef
                    .update({
                        sendAudio: enable
                    })
                    .catch((error) => {
                        handleError(error);
                        reject(false);
                    })
            }
            reject(true);
        })
    }


    public setSendVideo(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.latestSnapshot || this.latestSnapshot.sendVideo !== enable) {
                return this.deviceRef
                    .update({
                        sendVideo: enable
                    })
                    .catch((error) => {
                        handleError(error);
                        reject(false);
                    })
            }
            reject(true);
        })
    }

    private handleValueChange = (snapshot: firebase.database.DataSnapshot) => {
        const beforeSnapshot: DatabaseDeviceWithId = this.latestSnapshot;
        this.latestSnapshot = {
            id: this.deviceRef.key,
            ...snapshot.val()
        };

        if (!beforeSnapshot) {
            this.emit("change", this);
        } else /* if (this.latestSnapshot != beforeSnapshot) */ {
            this.emit("change", this);
            if (beforeSnapshot.canVideo !== this.latestSnapshot.canVideo) {
                this.emit("canVideo", this.latestSnapshot.canVideo);
            }
            if (beforeSnapshot.canAudio !== this.latestSnapshot.canAudio) {
                this.emit("canAudio", this.latestSnapshot.canAudio);
            }
            if (beforeSnapshot.sendVideo !== this.latestSnapshot.sendVideo) {
                this.emit("sendVideo", this.latestSnapshot.sendVideo);
            }
            if (beforeSnapshot.sendAudio !== this.latestSnapshot.sendAudio) {
                this.emit("sendAudio", this.latestSnapshot.sendAudio);
            }
            if (beforeSnapshot.receiveVideo !== this.latestSnapshot.receiveVideo) {
                this.emit("receiveVideo", this.latestSnapshot.receiveVideo);
            }
            if (beforeSnapshot.receiveAudio !== this.latestSnapshot.receiveAudio) {
                this.emit("receiveAudio", this.latestSnapshot.receiveAudio);
            }
        }
    }
}
