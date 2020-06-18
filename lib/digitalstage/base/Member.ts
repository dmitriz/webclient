import {IVolumeControl} from "./types/IVolumeControl";
import {EventEmitter} from "events";
import {AbstractProducer} from "./types/AbstractProducer";
import {DatabaseStageMember} from "./types/DatabaseStageMember";
import {Soundjack} from "./types/Soundjack";
import {DigitalStageAPI, MemberEvent, ProducerEvent, SoundjackEvent, VolumeEvent} from "./api/DigitalStageAPI";
import {VideoProducer} from "./types/VideoProducer";
import {AudioProducer} from "./types/AudioProducer";
import {DatabaseGlobalAudioProducer} from "./types/DatabaseGlobalAudioProducer";
import {DatabaseGlobalVideoProducer} from "./types/DatabaseGlobalVideoProducer";

export type MemberEvents =
    | "changed"
    | "volume-changed"
    | "producer-added"
    | "producer-changed"
    | "producer-removed"
    | "soundjack-added"
    | "soundjack-changed"
    | "soundjack-removed";

export class Member extends EventEmitter implements IVolumeControl {
    protected readonly mUid: string;
    protected readonly mApi: DigitalStageAPI;
    protected mVolume: number;
    protected mLatestSnapshot: DatabaseStageMember;
    protected mProducers: AbstractProducer[] = [];
    protected mSoundjacks: Soundjack[] = [];

    constructor(api: DigitalStageAPI, uid: string, initialData: DatabaseStageMember) {
        super();
        this.mApi = api;
        this.mUid = uid;
        this.mLatestSnapshot = initialData;

        this.mApi.on("member-changed", this.handleUpdate);
        this.mApi.on("producer-added", this.handleProducerAdded);
        this.mApi.on("producer-removed", this.handleProducerRemoved);
        this.mApi.on("soundjack-added", this.handleSoundjackAdded);
        this.mApi.on("soundjack-removed", this.handleSoundjackRemoved);
        this.mApi.on("volume-changed", this.handleVolumeChanged);
    }

    public disconnect() {
        this.mApi.off("member-changed", this.handleUpdate);
        this.mApi.off("producer-changed", this.handleUpdate);
        this.mApi.off("producer-added", this.handleProducerAdded);
        this.mApi.off("producer-removed", this.handleProducerRemoved);
        this.mApi.off("soundjack-added", this.handleSoundjackAdded);
        this.mApi.off("soundjack-removed", this.handleSoundjackRemoved);
        this.mApi.off("volume-changed", this.handleVolumeChanged);
    }

    public get uid() {
        return this.mUid;
    }

    public get name() {
        return this.mLatestSnapshot.displayName;
    }

    public get soundjacks() {
        return this.mSoundjacks;
    }

    public get producers() {
        return this.mProducers;
    }

    public on(event: MemberEvents, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public off(event: MemberEvents, listener: (...args: any[]) => void): this {
        return super.off(event, listener);
    }

    public getSoundjack(id: string) {
        return this.mSoundjacks.find((soundjack: Soundjack) => soundjack.id === id);
    }

    public getProducer(id: string) {
        return this.mProducers.find((producer: AbstractProducer) => producer.id === id);
    }

    protected handleUpdate = (event: MemberEvent) => {
        if (this.mUid === event.uid) {
            this.mLatestSnapshot = event.member;
            this.emit("changed", this);
        }
    }

    protected handleVolumeChanged = (event: VolumeEvent) => {
        if (this.mUid === event.uid && this.mVolume !== event.volume) {
            this.mVolume = event.volume;
            this.emit("volume-changed", this.mVolume);
            this.emit("changed", this);
        }
    }

    protected handleProducerAdded = (event: ProducerEvent) => {
        if (event.producer.kind === "audio") {
            const audioProducer = new AudioProducer(this.mApi, event.id, event.producer as DatabaseGlobalAudioProducer);
            this.mProducers.push(audioProducer);
            this.emit("producer-added", audioProducer);
        } else {
            const videoProducer = new VideoProducer(this.mApi, event.id, event.producer as DatabaseGlobalVideoProducer);
            this.mProducers.push(videoProducer);
            this.emit("producer-added", videoProducer);
        }
        this.emit("changed", this);
    }

    protected handleProducerRemoved = (event: ProducerEvent) => {
        const producer: AbstractProducer = this.getProducer(event.id);
        if (producer) {
            this.mProducers = this.mProducers.filter((producer: AbstractProducer) => producer.id !== event.id);
            producer.disconnect();
            this.emit("producer-removed", producer)
            this.emit("changed", this);
        }
    }

    protected handleSoundjackAdded = (event: SoundjackEvent) => {
        const soundjack = new Soundjack(this.mApi, event.id, event.soundjack);
        this.mSoundjacks.push(soundjack);
        this.emit("soundjack-added", soundjack);
        this.emit("changed", this);
    }

    protected handleSoundjackRemoved = (event: SoundjackEvent) => {
        const soundjack: Soundjack = this.getSoundjack(event.id);
        if (soundjack) {
            this.mSoundjacks = this.mSoundjacks.filter((soundjack: Soundjack) => soundjack.id !== event.id);
            soundjack.disconnect();
            this.emit("soundjack-removed", soundjack);
            this.emit("changed", this);
        }
    }

    public get volume() {
        return this.mVolume;
    }

    setVolume(volume: number) {
        return this.mApi.setRemoteMasterVolume(this.mUid, volume);
    }

    getAudioProducers() {
        return this.mProducers.filter((producer: AbstractProducer) => producer.kind === "audio");
    }

    getVideoProducers() {
        return this.mProducers.filter((producer: AbstractProducer) => producer.kind === "video");
    }

}
