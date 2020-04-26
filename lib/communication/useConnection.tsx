import {useCallback, useEffect, useState} from "react";
import Connection, {Participant, Stage} from "./Connection";
import firebase from "firebase";

export default () => {
    const [connection] = useState(new Connection());
    const [connected, setConnected] = useState<boolean>(false);
    const [stage, setStage] = useState<Stage>();
    const [participants, setParticipants] = useState<Participant[]>([]);

    useEffect(() => {
        // Register event listener
        connection.addEventListener({
            onParticipantAdded: (participant: Participant) => {
                setParticipants(prevState => ([...prevState, participant]));
            },
            onParticipantChanged: (participant: Participant) => {
                setParticipants(prevState => prevState.map((p: Participant) => {
                    if (p.userId === participant.userId) {
                        p.tracks = participant.tracks;
                    }
                    return p;
                }));
                console.log("onParticipantChanged");
            },
            onParticipantRemoved: (participant: Participant) => {
                setParticipants(prevState => prevState.filter((p: Participant) => p.userId !== participant.userId));
            },
        });
    }, [connection]);

    const connect = useCallback((host: string, port: number): Promise<void> => {
        if (connection.connected())
            throw new Error("Already connected, disconnect first");
        return connection.connect(host, port).then(() => setConnected(true));
    }, [connection]);

    const disconnect = useCallback((): Promise<void> => {
        return connection.disconnect().then(() => setConnected(false))
    }, [connection]);

    const createStage = useCallback((user: firebase.User, name: string, password?: string, type: 'theater' | 'music' | 'conference' = 'theater'): Promise<Stage> => {
        if (stage)
            throw new Error("Already in a stage");
        return connection.createStage(user, password, type)
    }, [connection, stage]);

    const joinStage = useCallback((user: firebase.User, stageId: string, password?: string): Promise<Stage> => {
        if (stage)
            throw new Error("Already in a stage");
        return connection.joinStage(user, stageId, password)
            .then((stage: Stage) => {
                setStage(stage);
                return stage;
            });

    }, [connection, stage]);

    return {
        connect,
        connected,
        publishTrack: connection.publishTrack,
        stage,
        participants,
        createStage,
        joinStage
    };
}
