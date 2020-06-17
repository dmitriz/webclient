import {AbstractMediasoupProducer} from "./AbstractMediasoupProducer";
import {IAudioContext, IGainNode, IMediaStreamTrackAudioSourceNode} from "standardized-audio-context";
import {DigitalStageAPI} from "../../base";
import {DatabaseGlobalAudioProducer} from "../../base/types/DatabaseGlobalAudioProducer";
import {IVolumeControl} from "../../base/types/IVolumeControl";
import {ProducerEvent} from "../../base/api/DigitalStageAPI";

export class MediasoupAudioProducer extends AbstractMediasoupProducer implements IVolumeControl {
    protected mLatestSnapshot: DatabaseGlobalAudioProducer;
    private mTrack: MediaStreamTrack;
    private source: IMediaStreamTrackAudioSourceNode<IAudioContext>;
    public gainNode: IGainNode<IAudioContext>;
    public mediaStream: MediaStream;
    private readonly audioContext: IAudioContext;
    kind: "audio" | "video" = "audio";

    constructor(api: DigitalStageAPI, id: string, initialData: DatabaseGlobalAudioProducer, audioContext: IAudioContext) {
        super(api, id, initialData);
        this.audioContext = audioContext;
    }

    protected handleUpdate(event: ProducerEvent) {
        super.handleUpdate(event);
        if (this.gainNode)
            this.gainNode.gain.value = this.mLatestSnapshot.volume;
    }

    public get volume() {
        return this.mLatestSnapshot.volume;
    }

    setVolume(volume: number) {
        if (this.gainNode)
            this.gainNode.gain.value = volume;
        return this.mApi.setRemoteProducerVolume(this.mId, volume);
    }

    setTrack(track: MediaStreamTrack) {
        this.gainNode = this.source.context.createGain();
        this.mTrack = track;
        //TODO: This is so ugly, but necessary, see https://bugs.chromium.org/p/chromium/issues/detail?id=933677
        this.mediaStream = new MediaStream([track]);
        this.source = this.audioContext.createMediaStreamTrackSource(track);
        this.source.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
    }

    public get track() {
        return this.mTrack;
    }

}
