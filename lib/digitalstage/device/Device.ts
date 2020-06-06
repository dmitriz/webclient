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

export default class Device extends EventEmitter {
    private readonly deviceRef: firebase.database.Reference;
    private latestSnapshot: DatabaseDeviceWithId;

    constructor(user: firebase.User, reference: firebase.database.Reference, initialData?: {
        name: string,
        canVideo?: boolean;
        canAudio?: boolean;
    }) {
        super();
        this.deviceRef = reference;
        this.latestSnapshot = {
            id: this.deviceRef.key,
            uid: user.uid,
            name: initialData ? initialData.name : "",
            caption: "",
            canAudio: initialData ? initialData.canAudio : false,   //TODO: Check, if undefined is saved instead of boolean
            canVideo: initialData ? initialData.canVideo : false,
            sendAudio: false,
            sendVideo: false,
            receiveAudio: false,
            receiveVideo: false
        };
        this.deviceRef
            .on("value", this.handleValueChange, null, this)
    }

    public on(event: DeviceEventType, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public once(event: DeviceEventType, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }

    public emit(event: DeviceEventType, ...args: any[]): boolean {
        return super.emit(event, args);
    }

    public off(event: DeviceEventType, listener: (...args: any[]) => void): this {
        return super.off(event, listener);
    }

    public get name() {
        return this.latestSnapshot.name;
    }

    public get caption() {
        return this.latestSnapshot.caption;
    }

    public get canVideo() {
        return this.latestSnapshot.canVideo;
    }

    public get canAudio() {
        return this.latestSnapshot.canAudio;
    }

    public get sendAudio() {
        return this.latestSnapshot.sendAudio;
    }

    public get sendVideo() {
        return this.latestSnapshot.sendVideo;
    }

    public get receiveAudio() {
        return this.latestSnapshot.receiveAudio;
    }

    public get receiveVideo() {
        return this.latestSnapshot.receiveVideo;
    }

    public setCaption(caption: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.latestSnapshot.caption !== caption) {
                return this.deviceRef.update({
                    caption: caption
                })
                    .catch((error) => {
                        handleError(error);
                        reject(false);
                    })
            }
            reject(true);
        })
    }

    public setCanAudio(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.latestSnapshot.canAudio !== enable) {
                return this.deviceRef.update({
                    canAudio: enable
                })
                    .catch((error) => {
                        handleError(error);
                        reject(false);
                    })
            }
            reject(true);
        })
    }

    public setCanVideo(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.latestSnapshot.canVideo !== enable) {
                return this.deviceRef
                    .update({
                        canVideo: enable
                    })
                    .catch((error) => {
                        handleError(error);
                        reject(false);
                    })
            }
            reject(true);
        })
    }

    public setReceiveAudio(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.latestSnapshot.receiveAudio !== enable) {
                return this.deviceRef
                    .update({
                        receiveAudio: enable
                    })
                    .catch((error) => {
                        handleError(error);
                        reject(false);
                    })
            }
            reject(true);
        })
    }

    public setReceiveVideo(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.latestSnapshot.receiveVideo !== enable) {
                return this.deviceRef
                    .update({
                        receiveVideo: enable
                    })
                    .catch((error) => {
                        handleError(error);
                        reject(false);
                    })
            }
            reject(true);
        })
    }

    public setSendAudio(enable: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.latestSnapshot.sendAudio !== enable) {
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
            if (this.latestSnapshot.sendVideo !== enable) {
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
        if( !snapshot.exists() ) {
            return this.deviceRef.set(this.latestSnapshot as DatabaseDevice);
        }

        const beforeSnapshot: DatabaseDeviceWithId = this.latestSnapshot;
        this.latestSnapshot = {
            id: this.deviceRef.key,
            ...snapshot.val()
        };

        if (this.latestSnapshot !== beforeSnapshot) {
            this.emit("change", this);
            if (beforeSnapshot.canVideo !== this.latestSnapshot.canVideo) {
                this.emit("canVideo", this);
            }
            if (beforeSnapshot.canAudio !== this.latestSnapshot.canAudio) {
                this.emit("canAudio", this);
            }
            if (beforeSnapshot.sendVideo !== this.latestSnapshot.sendVideo) {
                this.emit("sendVideo", this);
            }
            if (beforeSnapshot.sendAudio !== this.latestSnapshot.sendAudio) {
                this.emit("sendAudio", this);
            }
            if (beforeSnapshot.receiveVideo !== this.latestSnapshot.receiveVideo) {
                this.emit("receiveVideo", this);
            }
            if (beforeSnapshot.receiveAudio !== this.latestSnapshot.receiveAudio) {
                this.emit("receiveAudio", this);
            }
        }
    }
}
