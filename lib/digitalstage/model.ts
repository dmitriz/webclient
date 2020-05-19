// DATABASE MODEL
import {IMediaStreamTrackAudioSourceNode} from "standardized-audio-context/src/interfaces/media-stream-track-audio-source-node";
import {IAudioContext, IGainNode} from "standardized-audio-context";

export interface DatabaseRouter {
    ipv4: string,
    ipv6: string,
    domain: string;
    port: number,
    slotAvailable: number
}

export interface DatabaseStage {
    id: string;
    name: string;
    password: string;
}

export interface DatabaseStageMember {
    uid: string;
    displayName: string;
}

export interface DatabaseProducer {
    uid: string;
    stageId: string;
    routerId: string;
    kind: string;
}

export interface DatabaseDevice {
    uid: string;

    ipv4: string;
    ipv6: string;

    canAudio: boolean;
    canVideo: boolean;

    sendAudio: boolean;
    sendVideo: boolean;
    receiveAudio: boolean;
    receiveVideo: boolean;
}

// INTERNAL MODEL
export interface Stage {
    id: string;
    name: string;
    password: string;
}

export interface StageMemberNew {
    uid: string;
    displayName: string;
    tracks: MediaTrack[];
}

export interface StageMember {
    uid: string;
    displayName: string;
    tracks: {
        [id: string]: MediaTrack;
    }
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

    volume: number;

    mute();

    unmute();

    setVolume(volume: number);
}

export class MediasoupAudioTrack implements AudioTrack {
    public readonly type = "audio";
    private readonly source: IMediaStreamTrackAudioSourceNode<IAudioContext>;
    private readonly gainNode: IGainNode<IAudioContext>;
    public readonly id: string;
    private muted: boolean;
    private internalVolume: number;

    get volume(): number {
        return this.internalVolume
    }

    constructor(id: string, source: IMediaStreamTrackAudioSourceNode<IAudioContext>) {
        this.id = id;
        this.source = source;
        this.gainNode = this.source.context.createGain();
        this.source.connect(this.gainNode);
        this.gainNode.connect(this.source.context.destination);
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
