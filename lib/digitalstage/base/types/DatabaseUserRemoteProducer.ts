import {DatabaseGlobalProducer} from "./DatabaseGlobalProducer";

export interface DatabaseUserRemoteProducer extends DatabaseGlobalProducer {
    volume: number;
}
