import {AbstractMediasoupProducer} from "./AbstractMediasoupProducer";
import {DigitalStageAPI} from "../../base";
import {DatabaseGlobalProducer} from "../../base/types";
import {DatabaseGlobalVideoProducer} from "../../base/types/DatabaseGlobalVideoProducer";

export class MediasoupVideoProducer extends AbstractMediasoupProducer {
    kind: "audio" | "video" = "video";

    constructor(api: DigitalStageAPI, id: string, initialData: DatabaseGlobalVideoProducer) {
        super();
    }

    track: MediaStreamTrack;


}
