import {useCallback, useState} from "react";
import Connection, {Participant, Stage} from "./Connection";
import firebase from "firebase";

export default () => {
    const [connection] = useState(() => {
        const connection: Connection = new Connection();
        connection.onParticipantAdded = (participant: Participant) => {
            console.log("onParticipantsAdded");
            setParticipants(prevState => ([...prevState, participant]));
        };
        connection.onParticipantChanged = (participant: Participant) => {
            console.log("onParticipantChanged");
            setParticipants(prevState => prevState.map((p: Participant) => {
                if (p.userId === participant.userId) {
                    p.tracks = participant.tracks;
                }
                return p;
            }));
        };
        connection.onParticipantRemoved = (participant: Participant) => {
            console.log("onParticipantRemoved");
            setParticipants(prevState => prevState.filter((p: Participant) => p.userId !== participant.userId));
        };
        return connection;
    });
    const [connected, setConnected] = useState<boolean>(false);
    const [stage, setStage] = useState<Stage>();
    const [participants, setParticipants] = useState<Participant[]>([]);

    const connect = useCallback((host: string, port: number): Promise<void> => {
        if (connection.connected())
            throw new Error("Already connected, disconnect first");
        return connection.connect(host, port).then(() => setConnected(true));
    }, [connection]);

    const disconnect = useCallback((): Promise<void> => {
        return connection.disconnect().then(() => setConnected(false))
    }, [connection]);

    const createStage = useCallback((user: firebase.User, localStream: MediaStream, name: string, password?: string, type: 'theater' | 'music' | 'conference' = 'theater'): Promise<Stage> => {
        if (stage)
            throw new Error("Already in a stage");
        return connection.createStage(user, localStream, password, type)
    }, [connection, stage]);

    const joinStage = useCallback((user: firebase.User, localStream: MediaStream, stageId: string, password?: string): Promise<Stage> => {
        if (stage)
            throw new Error("Already in a stage");
        return connection.joinStage(user, localStream, stageId, password)
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
