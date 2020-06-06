import {IAudioContext, IGainNode, IMediaStreamTrackAudioSourceNode} from "standardized-audio-context";
import mediasoupClient from "mediasoup-client";
import {IMediasoupTrack} from "./IMediasoupTrack";

export class MediasoupAudioTrack implements IMediasoupTrack {
    public readonly type = "audio";
    public readonly track: MediaStreamTrack;
    private readonly source: IMediaStreamTrackAudioSourceNode<IAudioContext>;
    public readonly gainNode: IGainNode<IAudioContext>;
    public readonly mediaStream: MediaStream;
    public readonly id: string;
    private muted: boolean;
    private internalVolume: number = 0;

    get volume(): number {
        return this.internalVolume
    }

    constructor(id: string, consumer: mediasoupClient.types.Consumer, audioContext: IAudioContext) {
        this.id = id;
        this.track = consumer.track;
        this.source = audioContext.createMediaStreamTrackSource(consumer.track);

        //TODO: This is so ugly, but necessary, see https://bugs.chromium.org/p/chromium/issues/detail?id=933677
        this.mediaStream = new MediaStream([consumer.track]);
        this.gainNode = this.source.context.createGain();
        this.source.connect(this.gainNode);
        this.gainNode.connect(audioContext.destination);
        this.internalVolume = this.gainNode.gain.value;
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
            this.gainNode.gain.value = volume;
        }
    }
}
