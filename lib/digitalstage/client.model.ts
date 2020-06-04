// DATABASE MODEL
import {IAudioContext, IGainNode, IMediaStreamTrackAudioSourceNode} from "standardized-audio-context";
import mediasoupClient from "mediasoup-client";
import {types} from "digitalstage-client-base";

/**
 * Extended version of the database router, necessary for client interactions
 */
export interface MediasoupRouter extends types.DatabaseRouter {
    id: string;
}

/**
 *  Internal stage model (for clients, react, etc.)
 */
export interface Stage extends types.DatabaseStage {
}

/**
 * Client-based member model holding the media tracks
 */
export interface StageMember extends types.DatabaseStageMember {
    tracks: MediaTrack[];
}

export interface MediaTrack {
    id: string;
    type: "audio" | "soundjack" | "video"
}

export interface MediasoupVideoTrack extends MediaTrack {
    type: "video";
    track: MediaStreamTrack;
}


export interface AudioTrack extends MediaTrack {
    type: "audio"
    track: MediaStreamTrack;

    volume: number;

    mute();

    unmute();

    setVolume(volume: number);
}

export class MediasoupAudioTrack implements AudioTrack {
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
