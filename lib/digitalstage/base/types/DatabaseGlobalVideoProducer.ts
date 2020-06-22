import {DatabaseGlobalProducer} from "./DatabaseGlobalProducer";

export interface DatabaseGlobalVideoProducer extends DatabaseGlobalProducer {
    kind: "video";
}
