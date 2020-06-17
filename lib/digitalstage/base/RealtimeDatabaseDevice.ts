import {DatabaseDevice} from "./types";
import {DigitalStageAPI} from "./api/DigitalStageAPI";
import {DeviceEvents, IDevice} from "./IDevice";
import {EventEmitter} from "events";
import * as firebase from "firebase/app";
import "firebase/database";
import {Debugger} from "./Debugger";

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

    protected constructor(api: DigitalStageAPI, isRemote: boolean = true) {
        super();
        this.mApi = api;
        this.mIsRemote = isRemote;
    }

    public setDeviceId(deviceId: string) {
        if (this.mDeviceRef) {
            Debugger.debug("Detach database listener for deviceId=" + this.mDeviceId, this);
            this.mDeviceRef.off("value", this.handleDeviceChange, this.handleFirebaseError);
        }
        this.mDeviceId = deviceId;
        if (this.mDeviceId) {
            Debugger.debug("Attach database listener for deviceId=" + this.mDeviceId, this);
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
        Debugger.handleError(error, this);
    }

    private handleDeviceChange = (snapshot: firebase.database.DataSnapshot) => {
        Debugger.debug("Device changed", this);
        const before: DatabaseDevice | undefined = this.mLatestSnapshot;
        this.mLatestSnapshot = snapshot.val();
        this.emit("device-changed", this);

        if (before) {
            if (before.caption !== this.mLatestSnapshot.caption) {
                Debugger.debug("caption changed to " + this.mLatestSnapshot.caption, this);
                this.emit("caption", this.mLatestSnapshot.caption);
            }
            if (before.audioDevices !== this.mLatestSnapshot.audioDevices) {
                Debugger.debug("audioDevices changed to " + this.mLatestSnapshot.audioDevices, this);
                this.emit("audioDevices", this.mLatestSnapshot.audioDevices);
            }
            if (before.inputAudioDevice !== this.mLatestSnapshot.inputAudioDevice) {
                Debugger.debug("inputAudioDevice changed to " + this.mLatestSnapshot.inputAudioDevice, this);
                this.emit("inputAudioDevice", this.mLatestSnapshot.inputAudioDevice);
            }
            if (before.outputAudioDevice !== this.mLatestSnapshot.outputAudioDevice) {
                Debugger.debug("outputAudioDevice changed to " + this.mLatestSnapshot.outputAudioDevice, this);
                this.emit("outputAudioDevice", this.mLatestSnapshot.outputAudioDevice);
            }
            if (before.canVideo !== this.mLatestSnapshot.canVideo) {
                Debugger.debug("canVideo changed to " + this.mLatestSnapshot.canVideo, this);
                this.emit("canVideo", this.mLatestSnapshot.canVideo);
            }
            if (before.canAudio !== this.mLatestSnapshot.canAudio) {
                Debugger.debug("canAudio changed to " + this.mLatestSnapshot.canAudio, this);
                this.emit("canAudio", this.mLatestSnapshot.canAudio);
            }
            if (before.receiveAudio !== this.mLatestSnapshot.receiveAudio) {
                Debugger.debug("receiveAudio changed to " + this.mLatestSnapshot.receiveAudio, this);
                this.emit("receiveAudio", this.mLatestSnapshot.receiveAudio);
            }
            if (before.receiveVideo !== this.mLatestSnapshot.receiveVideo) {
                Debugger.debug("receiveVideo changed to " + this.mLatestSnapshot.receiveVideo, this);
                this.emit("receiveVideo", this.mLatestSnapshot.receiveVideo);
            }
            if (before.sendAudio !== this.mLatestSnapshot.sendAudio) {
                Debugger.debug("sendAudio changed to " + this.mLatestSnapshot.sendAudio, this);
                this.emit("sendAudio", this.mLatestSnapshot.sendAudio);
            }
            if (before.sendVideo !== this.mLatestSnapshot.sendVideo) {
                Debugger.debug("sendVideo changed to " + this.mLatestSnapshot.sendVideo, this);
                this.emit("sendVideo", this.mLatestSnapshot.sendVideo);
            }
            if (before.error !== this.mLatestSnapshot.error) {
                Debugger.debug("error changed to " + this.mLatestSnapshot.error, this);
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
        Debugger.debug("setCaption()", this);
        return this.update({
            caption: caption
        });
    }

    setCanAudio(enable: boolean): Promise<boolean> {
        Debugger.debug("setCanAudio()", this);
        return this.update({
            canAudio: enable
        });
    }

    setCanVideo(enable: boolean): Promise<boolean> {
        Debugger.debug("setCanVideo()", this);
        return this.update({
            canVideo: enable
        });
    }

    setReceiveAudio(enable: boolean): Promise<boolean> {
        Debugger.debug("setReceiveAudio()", this);
        return this.update({
            receiveAudio: enable
        });
    }

    setReceiveVideo(enable: boolean): Promise<boolean> {
        Debugger.debug("setReceiveVideo()", this);
        return this.update({
            receiveVideo: enable
        });
    }

    setSendAudio(enable: boolean): Promise<boolean> {
        Debugger.debug("setSendAudio()", this);
        return this.update({
            sendAudio: enable
        });
    }


    setSendVideo(enable: boolean): Promise<boolean> {
        Debugger.debug("setSendVideo()", this);
        return this.update({
            sendVideo: enable
        });
    }

    setError(error?: string): Promise<boolean> {
        Debugger.debug("setError()", this);
        return this.update({
            error: error
        });
    }


    setAudioDevices(audioDevices: string[]): Promise<boolean> {
        Debugger.debug("setAudioDevices()", this);
        return this.update({
            audioDevices: audioDevices
        });
    }

    setAudioInputDevice(audioDeviceId: number): Promise<boolean> {
        Debugger.debug("setAudioInputDevice()", this);
        return this.update({
            inputAudioDevice: audioDeviceId
        })
    }

    setAudioOutputDevice(audioDeviceId: number): Promise<boolean> {
        Debugger.debug("setAudioOutputDevice()", this);
        return this.update({
            outputAudioDevice: audioDeviceId
        })
    }
}
