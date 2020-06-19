import {EventEmitter} from "events";
import {IDebugger} from "./IDebugger";

export type DeviceEvents =
    | "connected"
    | "sendAudio"
    | "sendVideo"
    | "receiveAudio"
    | "receiveVideo"
    | "error"
    | "audioDevices"
    | "inputAudioDevice"
    | "outputAudioDevice"
    | "name"
    | "caption"
    | "device-changed";

export interface IDevice extends EventEmitter {
    readonly id: string | undefined;
    readonly name: string;
    readonly isRemote: boolean;
    readonly caption: string | undefined;
    readonly canVideo: boolean;
    readonly canAudio: boolean;
    readonly sendAudio: boolean;
    readonly sendVideo: boolean;
    readonly receiveAudio: boolean;
    readonly receiveVideo: boolean;
    readonly error: string | undefined;
    readonly audioDevices: string[];
    readonly inputAudioDevice: number | undefined;
    readonly outputAudioDevice: number | undefined;
    readonly connected: boolean;
    debug: IDebugger | undefined;

    setDebug(debug: IDebugger): void;

    connect(): Promise<boolean>;

    disconnect(): Promise<boolean>;

    setDeviceId(deviceId: string): any;

    addListener(event: DeviceEvents | string, listener: (...args: any[]) => void): this;

    removeListener(event: DeviceEvents | string, listener: (...args: any[]) => void): this;

    removeAllListeners(event?: DeviceEvents | string | symbol): this;

    emit(event: DeviceEvents | string, ...args: any[]): boolean;

    on(event: DeviceEvents | string, listener: (...args: any[]) => void): this;

    once(event: DeviceEvents | string, listener: (...args: any[]) => void): this;

    off(event: DeviceEvents | string, listener: (...args: any[]) => void): this;

    setCaption(caption: string): Promise<boolean>;

    setCanAudio(enable: boolean): Promise<boolean>;

    setCanVideo(enable: boolean): Promise<boolean>;

    setReceiveAudio(enable: boolean): Promise<boolean>;

    setReceiveVideo(enable: boolean): Promise<boolean>;

    setSendAudio(enable: boolean): Promise<boolean>;

    setSendVideo(enable: boolean): Promise<boolean>;

    setError(error?: string): Promise<boolean>;

    setAudioDevices(audioDevices: string[]): Promise<boolean>;

    setAudioInputDevice(audioDeviceId: number): Promise<boolean>;

    setAudioOutputDevice(audioDeviceId: number): Promise<boolean>;
}
