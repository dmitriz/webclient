import {AbstractProducer} from "./AbstractProducer";
import {DigitalStageAPI} from "..";
import {DatabaseGlobalProducer} from "./DatabaseGlobalProducer";

export class VideoProducer extends AbstractProducer {
    constructor(api: DigitalStageAPI, id: string, initialData: DatabaseGlobalProducer) {
        super(api, id, initialData);
    }

    kind: "audio" | "video" = "video";
}
