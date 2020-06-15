import {DatabaseGlobalSoundjack} from "./DatabaseGlobalSoundjack";

export interface DatabaseUserRemoteSoundjack extends DatabaseGlobalSoundjack {
    volume: number;
}
