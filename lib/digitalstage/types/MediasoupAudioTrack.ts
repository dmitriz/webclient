import {IAudioContext, IGainNode, IMediaStreamTrackAudioSourceNode} from "standardized-audio-context";
import mediasoupClient from "mediasoup-client";
import {IMediasoupTrack} from "./IMediasoupTrack";

export class MediasoupAudioTrack implements IMediasoupTrack {
    public readonly type = "audio";
    public readonly track: MediaStreamTrack;
    private readonly source: IMediaStreamTrackAudioSourceNode<IAudioContext>;
    private readonly gainNode: IGainNode<IAudioContext>;
    public readonly id: string;
    private muted: boolean;
    private internalVolume: number;

    get volume(): number {
        return this.internalVolume
    }

    constructor(id: string, consumer: mediasoupClient.types.Consumer, audioContext: IAudioContext) {
        this.id = id;
        this.track = consumer.track;
        this.source = audioContext.createMediaStreamTrackSource(consumer.track);
        this.gainNode = this.source.context.createGain();
        this.source.connect(this.gainNode);
        this.gainNode.connect(audioContext.destination);
    }

    public mute = () => {
        this.gainNode.gain.value = 0;
        this.muted = true;
    }
    public unmute = () => {
        this.gainNode.gain.value = this.internalVolume;
        this.muted = false;
    }

    public setVolume = (volume: number) => {
        this.internalVolume = volume;
        if (!this.muted) {
            console.log("Set gain to " + volume);
            this.gainNode.gain.value = volume;
        }
    }
}
