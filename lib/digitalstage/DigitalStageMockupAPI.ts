import {DigitalStageAPI, IDebugger, IDevice} from "./base";
import {DatabaseDevice, DatabaseGlobalProducer, DatabaseGlobalSoundjack, DatabaseStage} from "./base/types";

export class DigitalStageMockupAPI extends DigitalStageAPI {
    readonly connected: boolean;
    debug: IDebugger | undefined;

    connect(): void {
    }

    createStage(name: string, password?: string): Promise<DatabaseStage> {
        return Promise.resolve(undefined);
    }

    disconnect(): void {
    }

    getUid(): string {
        return "";
    }

    joinStage(stageId: string, password?: string): Promise<DatabaseStage> {
        return Promise.resolve(undefined);
    }

    leaveStage(): Promise<boolean> {
        return Promise.resolve(false);
    }

    publishProducer(producer: DatabaseGlobalProducer): Promise<string> {
        return Promise.resolve("");
    }

    publishSoundjack(soundjack: DatabaseGlobalSoundjack): Promise<string> {
        return Promise.resolve("");
    }

    registerDevice(device: IDevice): Promise<string> {
        return Promise.resolve("");
    }

    setDebug(debug: IDebugger): void {
    }

    setRemoteMasterVolume(uid: string, volume: number): Promise<any> {
        return Promise.resolve(undefined);
    }

    setRemoteProducerVolume(id: string, volume: number): Promise<any> {
        return Promise.resolve(undefined);
    }

    setRemoteSoundjackVolume(id: string, volume: number): Promise<any> {
        return Promise.resolve(undefined);
    }

    startClick(time: number): Promise<any> {
        return Promise.resolve(undefined);
    }

    stopClick(): Promise<any> {
        return Promise.resolve(undefined);
    }

    unpublishProducer(id: string): Promise<any> {
        return Promise.resolve(undefined);
    }

    unpublishSoundjack(id: string): Promise<any> {
        return Promise.resolve(undefined);
    }

    unregisterDevice(deviceId: string): Promise<any> {
        return Promise.resolve(undefined);
    }

    updateDevice(deviceId: string, device: Partial<DatabaseDevice>): Promise<any> {
        return Promise.resolve(undefined);
    }

}
