import {useCallback, useEffect, useState} from "react";
import {BehaviorSubject, Observable, of, Subject} from "rxjs";
import {Device, MediasoupProducer, Stage as DbStage, StageMember} from "./databaseModels";
import {distinctUntilChanged, map, scan, shareReplay, skip} from "rxjs/operators";
import {MediasoupTransport, Member, Stage} from "./temp";
import firebase from 'firebase/app';
import 'firebase/firestore';
import {Consumer} from "mediasoup-client/lib/Consumer";

const fetchConsumerForProducer = (producerId: string): Promise<Consumer> => {
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
            //mediasoup.cleanMembers(members);
            // alltheotherhandlers.cleanMembers(members);
        });
    firebase
        .firestore()
        .collection('stage')
        .doc(stageId)
        .onSnapshot(stageSnaps);
    firebase
        .firestore()
        .collection('producer')
        .where('stageId', '==', stageId)
        .onSnapshot(producerSnaps);
    firebase
        .firestore()
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

export default () => {
    const [stageId, setStageId] = useState<string>();
    const [stage, setStage] = useState<Stage>();


    const create = useCallback(() => {
        if (stage) {
            return;
        }

        // TODO: Create state, then listen
        setStageId("mystageid");

    }, [stage]);

    const join = useCallback(() => {
        if (stage) {
            return;
        }

        // TODO: Join state, then listen
        setStageId("mystageid");
    }, []);

    useEffect(() => {
        if (stageId) {
            evalStage(stageId)
                .then((stage: Stage) => setStage(stage));
        }
    }, [stageId])


    return {
        join,
        create,
        stage
    }
}