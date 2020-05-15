import {BehaviorSubject, Observable} from "rxjs";
import {Device} from "./databaseModels";
import {Consumer} from "mediasoup-client/lib/Consumer";

export interface Stage {
    name: Observable<string>;
    ownerUid: Observable<string>;
    members: Observable<Member[]>;
}

export interface Member {
    uid: string;
    displayName: Observable<string>;
    transports: Observable<MediasoupTransport[]>;
    devices: Observable<Device[]>;
    outputVolume: BehaviorSubject<number>;
    role: Observable<'artist' | 'conductor'>;
}

export type MediaTransport = MediasoupTransport | SoundjackTransport;

export interface MediasoupTransport {
    type: 'mediasoup';
    mediasoupProducerId: string;
    consumer?: Promise<Consumer>;
    docId: string;
}

export interface SoundjackTransport {
    type: 'soundjack';
    ipv4: string;
    ipv6: string;
    active: boolean;
}