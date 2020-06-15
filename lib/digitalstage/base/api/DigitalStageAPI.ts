import {
    DatabaseDevice,
    DatabaseGlobalProducer,
    DatabaseGlobalSoundjack,
    DatabaseStage,
    DatabaseStageMember,
    DatabaseUserRemoteProducer,
    DatabaseUserRemoteSoundjack
} from "../types";
import {EventEmitter} from "events";
import {IDevice} from "../IDevice";

export type DigitalStageEvents =
    "stage-id-changed"
    | "stage-changed"
    | "joined"
    | "created"
    | "left"
    | "device-registered"
    | "device-unregistered"
    | "device-added"
    | "device-changed"
    | "device-removed"
    | "member-added"
    | "member-changed"
    | "member-removed"
    | "volume-added"
    | "volume-changed"
    | "volume-removed"
    | "soundjack-added"
    | "soundjack-changed"
    | "soundjack-removed"
    | "producer-added"
    | "producer-changed"
    | "producer-removed"
    | "producer-published"
    | "producer-unpublished"
    | "soundjack-published"
    | "soundjack-unpublished";

export type SoundjackEvent = {
    id: string;
    soundjack: DatabaseUserRemoteSoundjack;
}

export type ProducerEvent = {
    id: string;
    producer: DatabaseUserRemoteProducer;
}

export type VolumeEvent = {
    uid: string;
    volume: number;
}

export type StageEvent = DatabaseStage | undefined;

export type StageIdEvent = string | undefined;

export type MemberEvent = {
    uid: string;
    member: DatabaseStageMember;
}

export type DeviceEvent = IDevice;

export abstract class DigitalStageAPI extends EventEmitter {
    public abstract getUid(): string;

    public abstract getStage(): DatabaseStage | undefined;

    public abstract getDevices(): IDevice[];

    public abstract getDevice(deviceId: string): IDevice | undefined;

    public abstract createStage(name: string, password?: string): Promise<DatabaseStage>;

    public abstract joinStage(stageId: string, password?: string): Promise<DatabaseStage>;

    public abstract leaveStage(): Promise<boolean>;

    public abstract registerDevice(device: IDevice, initialDatabaseDevice: DatabaseDevice): Promise<string>;

    public abstract updateDevice(deviceId: string, device: Partial<DatabaseDevice>): Promise<any>;

    public abstract unregisterDevice(deviceId: string): Promise<any>;

    public abstract setRemoteMasterVolume(uid: string, volume: number): Promise<any>;

    public abstract setRemoteSoundjackVolume(id: string, volume: number): Promise<any>;

    public abstract setRemoteProducerVolume(id: string, volume: number): Promise<any>;

    public abstract publishSoundjack(soundjack: DatabaseGlobalSoundjack): Promise<string>;

    public abstract unpublishSoundjack(id: string): Promise<any>;

    public abstract publishProducer(producer: DatabaseGlobalProducer): Promise<string>;

    public abstract unpublishProducer(id: string): Promise<any>;

    public addListener(event: DigitalStageEvents, listener: (...args: any[]) => void): this {
        return super.addListener(event, listener);
    }

    public removeListener(event: DigitalStageEvents, listener: (...args: any[]) => void): this {
        return super.removeListener(event, listener);
    }

    public removeAllListeners(event?: DigitalStageEvents): this {
        return super.removeAllListeners(event);
    }

    public emit(event: DigitalStageEvents, ...args: any[]): boolean {
        return super.emit(event, ...args);
    }

    public on(event: DigitalStageEvents, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public once(event: DigitalStageEvents, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }

    public off(event: DigitalStageEvents, listener: (...args: any[]) => void): this {
        return super.off(event, listener);
    }
}
