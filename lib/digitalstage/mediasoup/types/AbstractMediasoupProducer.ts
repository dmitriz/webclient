import {AbstractProducer} from "../../base/types/AbstractProducer";

export abstract class AbstractMediasoupProducer extends AbstractProducer {
    public abstract track: MediaStreamTrack;

    public abstract setTrack(track: MediaStreamTrack);
}
