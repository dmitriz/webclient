import {AbstractProducer} from "./AbstractProducer";
import {DatabaseGlobalAudioProducer} from "./DatabaseGlobalAudioProducer";
import {DigitalStageAPI} from "..";
import {IVolumeControl} from "./IVolumeControl";

export class AudioProducer extends AbstractProducer implements IVolumeControl {
    protected mLatestSnapshot: DatabaseGlobalAudioProducer;
    public kind: "audio" | "video" = "audio";

    constructor(api: DigitalStageAPI, id: string, initialData: DatabaseGlobalAudioProducer) {
        super(api, id, initialData);
    }

    public get volume() {
        return this.mLatestSnapshot.volume;
    }

    setVolume(volume: number) {
        return this.mApi.setRemoteProducerVolume(this.mId, volume);
    }
}
