export interface IMember {
    readonly uid: string;
    name: string;
    audioProducers: IAudioProducer[];
    soundjacks: ISoundjack[];
}

export interface ISoundjack {
    readonly id: string;
    uid: string;
    deviceId: string;
    ipv4: string;
    ipv6: string;
    port: number;
}

export interface IProducer {
    readonly id: string;
    deviceId: string;
    routerId: string;
    producerId: string;
    kind: "audio" | "video";
}

export interface IVolumeControl {
    readonly volume: number;

    setVolume(volume: number): void;
}

export interface IVideoProducer extends IProducer {
    kind: "video";
}

export interface IAudioProducer extends IProducer, IVolumeControl {
    kind: "audio";
}

export class AudioProducer implements IAudioProducer {
    constructor(id: string) {
        this.id = id;
    }

    kind: "audio" = "audio";
    readonly id: string;
    deviceId: string = "";
    routerId: string = "";
    producerId: string = "";
    volume: number = 0;

    setVolume(volume: number) {
        this.volume = volume;
    }

}
