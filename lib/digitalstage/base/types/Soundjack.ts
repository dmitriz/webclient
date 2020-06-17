import {DigitalStageAPI} from "..";
import {IVolumeControl} from "./IVolumeControl";
import {DatabaseUserRemoteSoundjack} from "./DatabaseUserRemoteSoundjack";
import {EventEmitter} from "events";
import {SoundjackEvent} from "../api/DigitalStageAPI";

export class Soundjack extends EventEmitter implements IVolumeControl {
    protected readonly mApi: DigitalStageAPI;
    protected readonly mId: string;
    protected mLatestSnapshot: DatabaseUserRemoteSoundjack;

    constructor(api: DigitalStageAPI, id: string, initialData: DatabaseUserRemoteSoundjack) {
        super();
        this.mApi = api;
        this.mId = id;
        this.mLatestSnapshot = initialData;
        this.mApi.on("soundjack-changed", this.handleUpdate);
    }

    public disconnect() {
        this.mApi.off("soundjack-changed", this.handleUpdate);
    }

    protected handleUpdate(event: SoundjackEvent) {
        if (this.id === event.id) {
            this.mLatestSnapshot = event.soundjack;
        }
    }

    public get id() {
        return this.id;
    }

    public get deviceId() {
        return this.mLatestSnapshot.deviceId;
    }

    public get ipv4() {
        return this.mLatestSnapshot.ipv4;
    }

    public get ipv6() {
        return this.mLatestSnapshot.ipv6;
    }

    public get port() {
        return this.mLatestSnapshot.port;
    }

    public get volume() {
        return this.mLatestSnapshot.volume;
    }

    setVolume(volume: number) {
        return this.mApi.setRemoteSoundjackVolume(this.mId, volume);
    }
}
