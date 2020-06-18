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
    | "connection-state-changed"
    | "stage-id-changed"
    | "stage-name-changed"
    | "stage-password-changed"
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
    | "soundjack-unpublished"
    | "click";

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

export type StageIdEvent = string | undefined;
export type StageNameEvent = string | undefined;
export type StagePasswordEvent = string | undefined;

export type StageCreatedEvent = DatabaseStage;

export type StageJoinedEvent = DatabaseStage;

export type MemberEvent = {
    uid: string;
    member: DatabaseStageMember;
}

export type DeviceEvent = {
    id: string;
    device: DatabaseDevice;
};

export abstract class DigitalStageAPI extends EventEmitter {
    public abstract readonly connected: boolean;

    public abstract connect(): void;

    public abstract disconnect(): void;

    public abstract getUid(): string;

    public abstract createStage(name: string, password?: string): Promise<DatabaseStage>;

    public abstract joinStage(stageId: string, password?: string): Promise<DatabaseStage>;

    public abstract leaveStage(): Promise<boolean>;

    public abstract registerDevice(device: IDevice): Promise<string>;

    public abstract updateDevice(deviceId: string, device: Partial<DatabaseDevice>): Promise<any>;

    public abstract unregisterDevice(deviceId: string): Promise<any>;

    public abstract setRemoteMasterVolume(uid: string, volume: number): Promise<any>;

    public abstract setRemoteSoundjackVolume(id: string, volume: number): Promise<any>;

    public abstract setRemoteProducerVolume(id: string, volume: number): Promise<any>;

    public abstract publishSoundjack(soundjack: DatabaseGlobalSoundjack): Promise<string>;

    public abstract unpublishSoundjack(id: string): Promise<any>;

    public abstract publishProducer(producer: DatabaseGlobalProducer): Promise<string>;

    public abstract unpublishProducer(id: string): Promise<any>;

    public abstract startClick(time: number): Promise<any>;

    public abstract stopClick(): Promise<any>;

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
