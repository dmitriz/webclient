import {DatabaseGlobalProducer} from "./DatabaseGlobalProducer";

export interface DatabaseGlobalAudioProducer extends DatabaseGlobalProducer {
    volume: number;
    kind: "video";
}
