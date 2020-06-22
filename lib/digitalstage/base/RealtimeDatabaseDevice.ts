import {DatabaseDevice} from "./types";
import {DigitalStageAPI} from "./api/DigitalStageAPI";
import {DeviceEvents, IDevice} from "./IDevice";
import {EventEmitter} from "events";
import * as firebase from "firebase/app";
import "firebase/database";
import {IDebugger} from "./IDebugger";

/**
 * Usage later:
 *
 * new MediasoupDevice(api, "mediasoup", false);
 * new SoundjackDevice(user, "soudjack", false);
 *
 * The devices should be controlled using the DigitalStageAPI only.
 * So the devices are more or less "headless" and provide no methods but react to the updates by the DigitalStageAPI instance.
 *
 */
export abstract class RealtimeDatabaseDevice extends EventEmitter implements IDevice {
    protected readonly mApi: DigitalStageAPI;
    protected readonly mIsRemote: boolean;
    protected mDeviceRef: firebase.database.Reference | undefined;
    protected mDeviceId: string | undefined;
    protected mLatestSnapshot: DatabaseDevice | undefined;
    protected mConnected: boolean = false;
    protected mDebug: IDebugger | undefined = undefined;

    protected constructor(api: DigitalStageAPI, isRemote: boolean = true) {
        super();
        this.mApi = api;
        this.mIsRemote = isRemote;
    }

    public get debug() {
        return this.mDebug;
    }

    public setDebug(debug: IDebugger | undefined) {
        this.mDebug = debug;
    }

    public get connected() {
        return this.mConnected;
    }

    public connect(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.mDeviceRef)
                return reject(new Error("Please set a valid device ID first"));
            if (this.connected) {
                return resolve(false);
            }
            this.mDebug && this.mDebug.debug("Attach database listener for deviceId=" + this.mDeviceId, this);
            this.mDeviceRef = firebase.database()
                .ref("users/" + this.mApi.getUid() + "/devices/" + this.mDeviceId);
            this.mDeviceRef.on("value", this.handleDeviceChange, this.handleFirebaseError);
            this.mConnected = true;
            this.emit("connected", true);
            return resolve(true);
        });
    }

    public disconnect(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.mDeviceRef)
                return reject(new Error("Please set a valid device ID first"));
            if (this.connected) {
                return resolve(false);
            }
            this.mDebug && this.mDebug.debug("Detach database listener for deviceId=" + this.mDeviceId, this);
            this.mDeviceRef.off("value", this.handleDeviceChange, this.handleFirebaseError);
            this.mConnected = false;
            this.emit("connected", true);
            return resolve(true);
        });
    }

    public setDeviceId(deviceId: string) {
        if (this.mDeviceRef) {
            this.mDebug && this.mDebug.debug("Detach database listener for deviceId=" + this.mDeviceId, this);
            this.mDeviceRef.off("value", this.handleDeviceChange, this.handleFirebaseError);
        }
        this.mDeviceId = deviceId;
        if (this.mDeviceId) {
            this.mDebug && this.mDebug.debug("Attach database listener for deviceId=" + this.mDeviceId, this);
            this.mDeviceRef = firebase.database()
                .ref("users/" + this.mApi.getUid() + "/devices/" + this.mDeviceId);
            this.mDeviceRef.on("value", this.handleDeviceChange, this.handleFirebaseError);
        }
    }

    addListener(event: DeviceEvents | string, listener: (arg: any) => void): this {
        return super.addListener(event, listener);
    }

    removeListener(event: DeviceEvents | string, listener: (arg: any) => void): this {
        return super.removeListener(event, listener);
    }

    removeAllListeners(event?: DeviceEvents | string): this {
        return super.removeAllListeners(event);
    }

    emit(event: DeviceEvents | string, arg: any): boolean {
        return super.emit(event, arg);
    }

    on(event: DeviceEvents | string, listener: (arg: any) => void): this {
        return super.on(event, listener);
    }

    once(event: DeviceEvents | string, listener: (arg: any) => void): this {
        return super.once(event, listener);
    }

    off(event: DeviceEvents | string, listener: (arg: any) => void): this {
        return super.off(event, listener);
    }

    private handleFirebaseError(error: Error) {
        this.mDebug && this.mDebug.handleError(error, this);
    }

    private handleDeviceChange = (snapshot: firebase.database.DataSnapshot) => {
        this.mDebug && this.mDebug.debug("Device changed", this);
        const before: DatabaseDevice | undefined = this.mLatestSnapshot;
        this.mLatestSnapshot = snapshot.val();
        this.emit("device-changed", this);

        if (before && this.mLatestSnapshot) {
            if (before.caption !== this.mLatestSnapshot.caption) {
                this.mDebug && this.mDebug.debug("caption changed to " + this.mLatestSnapshot.caption, this);
                this.emit("caption", this.mLatestSnapshot.caption);
            }
            if (before.audioDevices !== this.mLatestSnapshot.audioDevices) {
                this.mDebug && this.mDebug.debug("audioDevices changed to " + this.mLatestSnapshot.audioDevices, this);
                this.emit("audioDevices", this.mLatestSnapshot.audioDevices);
            }
            if (before.inputAudioDevice !== this.mLatestSnapshot.inputAudioDevice) {
                this.mDebug && this.mDebug.debug("inputAudioDevice changed to " + this.mLatestSnapshot.inputAudioDevice, this);
                this.emit("inputAudioDevice", this.mLatestSnapshot.inputAudioDevice);
            }
            if (before.outputAudioDevice !== this.mLatestSnapshot.outputAudioDevice) {
                this.mDebug && this.mDebug.debug("outputAudioDevice changed to " + this.mLatestSnapshot.outputAudioDevice, this);
                this.emit("outputAudioDevice", this.mLatestSnapshot.outputAudioDevice);
            }
            if (before.canVideo !== this.mLatestSnapshot.canVideo) {
                this.mDebug && this.mDebug.debug("canVideo changed to " + this.mLatestSnapshot.canVideo, this);
                this.emit("canVideo", this.mLatestSnapshot.canVideo);
            }
            if (before.canAudio !== this.mLatestSnapshot.canAudio) {
                this.mDebug && this.mDebug.debug("canAudio changed to " + this.mLatestSnapshot.canAudio, this);
                this.emit("canAudio", this.mLatestSnapshot.canAudio);
            }
            if (before.receiveAudio !== this.mLatestSnapshot.receiveAudio) {
                this.mDebug && this.mDebug.debug("receiveAudio changed to " + this.mLatestSnapshot.receiveAudio, this);
                this.emit("receiveAudio", this.mLatestSnapshot.receiveAudio);
            }
            if (before.receiveVideo !== this.mLatestSnapshot.receiveVideo) {
                this.mDebug && this.mDebug.debug("receiveVideo changed to " + this.mLatestSnapshot.receiveVideo, this);
                this.emit("receiveVideo", this.mLatestSnapshot.receiveVideo);
            }
            if (before.sendAudio !== this.mLatestSnapshot.sendAudio) {
                this.mDebug && this.mDebug.debug("sendAudio changed to " + this.mLatestSnapshot.sendAudio, this);
                this.emit("sendAudio", this.mLatestSnapshot.sendAudio);
            }
            if (before.sendVideo !== this.mLatestSnapshot.sendVideo) {
                this.mDebug && this.mDebug.debug("sendVideo changed to " + this.mLatestSnapshot.sendVideo, this);
                this.emit("sendVideo", this.mLatestSnapshot.sendVideo);
            }
            if (before.error !== this.mLatestSnapshot.error) {
                this.mDebug && this.mDebug.debug("error changed to " + this.mLatestSnapshot.error, this);
                this.emit("error", this.mLatestSnapshot.error);
            }
        }
    }

    get id(): string | undefined {
        return this.mDeviceId;
    }

    get isRemote(): boolean {
        return this.mIsRemote;
    }

    get name(): string {
        return this.mLatestSnapshot ? this.mLatestSnapshot.name : "";
    }

    get caption(): string | undefined {
        return this.mLatestSnapshot && this.mLatestSnapshot.caption;
    }

    get canVideo(): boolean {
        return this.mLatestSnapshot ? this.mLatestSnapshot.canVideo : false;
    }

    get canAudio(): boolean {
        return this.mLatestSnapshot ? this.mLatestSnapshot.canAudio : false;
    }

    get sendAudio(): boolean {
        return this.mLatestSnapshot ? this.mLatestSnapshot.sendAudio : false;
    }

    get sendVideo(): boolean {
        return this.mLatestSnapshot ? this.mLatestSnapshot.sendVideo : false;
    }

    get receiveAudio(): boolean {
        return this.mLatestSnapshot ? this.mLatestSnapshot.receiveAudio : false;
    }

    get receiveVideo(): boolean {
        return this.mLatestSnapshot ? this.mLatestSnapshot.receiveVideo : false;
    }

    get error(): string | undefined {
        return this.mLatestSnapshot ? this.mLatestSnapshot.error : undefined;
    }

    get audioDevices(): string[] {
        return this.mLatestSnapshot && this.mLatestSnapshot.audioDevices ? this.mLatestSnapshot.audioDevices : [];
    }

    get inputAudioDevice(): number | undefined {
        return this.mLatestSnapshot ? this.mLatestSnapshot.inputAudioDevice : undefined;
    }

    get outputAudioDevice(): number | undefined {
        return this.mLatestSnapshot ? this.mLatestSnapshot.outputAudioDevice : undefined;
    }

    private update(device: Partial<DatabaseDevice>) {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.mDeviceId)
                return reject("Not connected");
            if (this.mLatestSnapshot) {
                if (Object.keys(device).every(
                    (key: string) => this.mLatestSnapshot && this.mLatestSnapshot[key] === device[key])) {
                    //TODO: tslint bug ... try removing the redundant undefined check of this.mLatestSnapshot above and see...
                    return resolve(false);
                }
            }
            return this.mApi
                .updateDevice(this.mDeviceId, device)
                .then(() => resolve(true))
        });
    }

    setCaption(caption: string): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setCaption()", this);
        return this.update({
            caption: caption
        });
    }

    setCanAudio(enable: boolean): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setCanAudio()", this);
        return this.update({
            canAudio: enable
        });
    }

    setCanVideo(enable: boolean): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setCanVideo()", this);
        return this.update({
            canVideo: enable
        });
    }

    setReceiveAudio(enable: boolean): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setReceiveAudio()", this);
        return this.update({
            receiveAudio: enable
        });
    }

    setReceiveVideo(enable: boolean): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setReceiveVideo()", this);
        return this.update({
            receiveVideo: enable
        });
    }

    setSendAudio(enable: boolean): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setSendAudio()", this);
        return this.update({
            sendAudio: enable
        });
    }


    setSendVideo(enable: boolean): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setSendVideo()", this);
        return this.update({
            sendVideo: enable
        });
    }

    setError(error?: string): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setError()", this);
        return this.update({
            error: error
        });
    }


    setAudioDevices(audioDevices: string[]): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setAudioDevices()", this);
        return this.update({
            audioDevices: audioDevices
        });
    }

    setAudioInputDevice(audioDeviceId: number): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setAudioInputDevice()", this);
        return this.update({
            inputAudioDevice: audioDeviceId
        })
    }

    setAudioOutputDevice(audioDeviceId: number): Promise<boolean> {
        this.mDebug && this.mDebug.debug("setAudioOutputDevice()", this);
        return this.update({
            outputAudioDevice: audioDeviceId
        })
    }
}
