// CLIENT
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

import firebase from 'firebase/app';
import 'firebase/firestore';
import {BehaviorSubject, Observable, Subject, combineLatest, of} from 'rxjs';
import {map, scan, distinctUntilChanged, shareReplay, skip, filter} from 'rxjs/operators';
import {Stage as DbStage, StageMember, MediasoupProducer, Device} from './databaseModels';

const firestore = firebase.firestore();
const consumers: { [producerId: string]: Consumer } = {};

async function fetchConsumerForProducer(docId: string): Promise<Consumer> {
    return null;
}

async function evalStage(stageId: string): Promise<Stage> {
    const stageSnaps: Subject<firebase.firestore.QueryDocumentSnapshot> = new Subject();
    const producerSnaps: Subject<firebase.firestore.QuerySnapshot> = new Subject();
    const deviceSnaps: Subject<firebase.firestore.QuerySnapshot> = new Subject();
    const stages: Observable<DbStage> = stageSnaps.pipe(map(snap => snap.data() as DbStage));
    const name = stages.pipe(
        map(stage => stage.name),
        distinctUntilChanged(),
        shareReplay(1),
    );
    const ownerUid = stages.pipe(
        map(stage => stage.ownerUid),
        distinctUntilChanged(),
        shareReplay(1),
    );
    const membersEvaluated = stageSnaps.pipe(
        scan((acc, snap) => {
            const stage: DbStage = snap.data() as DbStage;
            const {consumer, members} = acc;
            const newMembers: StageMember[] = stage.members
                .filter(newMember => acc.stage.members
                    .findIndex(oldMember =>
                        newMember.uid === oldMember.uid
                    ) < 0
                );
            const deletedMembers: StageMember[] = acc.stage.members
                .filter(oldMember => stage.members
                    .findIndex(newMember =>
                        oldMember.uid === newMember.uid
                    ) < 0
                );
            for (let member of newMembers) {
                const transports: Observable<MediasoupTransport[]> = producerSnaps
                    .pipe(
                        map(snap => snap.docs
                            .map(doc => {
                                const data = doc.data() as MediasoupProducer;
                                if (data.uid !== member.uid) {
                                    return null;
                                }
                                return {
                                    docId: doc.id,
                                    mediasoupProducerId: data.mediasoupProducerId,
                                    type: "mediasoup",
                                    consumer: fetchConsumerForProducer(doc.id),
                                } as MediasoupTransport;
                            })
                            .filter(producer => producer)
                        ),
                        distinctUntilChanged((x, y) => x.length !== y.length),
                    );
                const devices: Observable<Device[]> = deviceSnaps
                    .pipe(
                        map(snap => snap.docs
                            .filter(doc => doc.data().uid !== member.uid)
                            .map(doc => doc.data() as Device)
                        ),
                        distinctUntilChanged((x, y) => x.length !== y.length),
                    );
                const uiMember: Member = {
                    uid: member.uid,
                    role: of('artist'),
                    displayName: of(member.displayName),
                    outputVolume: new BehaviorSubject(0.9),
                    transports,
                    devices,
                };
                members.push(uiMember);
            }
            return {
                members,
                consumer,
                deletedMembers,
                newMembers,
                stage,
            };
        }, {
            consumer: {},
            members: [],
            deletedMembers: [],
            newMembers: [],
            stage: null,
        }),
        skip(1),
    );
    membersEvaluated
        .pipe(
            map(evaluated => evaluated.deletedMembers)
        )
        .subscribe(members => {
            mediasoup.cleanMembers(members);
            // alltheotherhandlers.cleanMembers(members);
        });
    firestore
        .collection('stage')
        .doc(stageId)
        .onSnapshot(stageSnaps);
    firestore
        .collection('producer')
        .where('stageId', '==', stageId)
        .onSnapshot(producerSnaps);
    firestore
        .collection('devices')
        .where('stageId', '==', stageId)
        .onSnapshot(deviceSnaps);
    const members = membersEvaluated
        .pipe(
            map(evaluated => evaluated.members),
        );
    return {
        name,
        ownerUid,
        members,
    };
}

class Mediasoup {
    cleanMembers(member: any[]) {
    }
}

var mediasoup = new Mediasoup();