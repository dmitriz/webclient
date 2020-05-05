import {useCallback, useEffect, useState} from "react";
import StageConnector from "./StageConnector";
import * as config from "../../env";
import {Stage} from "./model";

const HOST: string = config.SERVER_URL;
const PORT: number = config.SERVER_PORT;

export const useStage = (props: {
    user: firebase.User
}) => {
    const [stageConnection, setStageConnection] = useState<StageConnector>();
    const [stage, setStage] = useState<Stage>();
    const [error, setError] = useState<string>();

    const connect = useCallback(() => {
        console.log("Connecting to " + HOST + ":" + PORT);
        const stageConnection = new StageConnector();
        stageConnection.connect(props.user, HOST, PORT).then(
            () => {
                setStageConnection(stageConnection);
            }
        );
    }, [props.user]);

    const join = useCallback((stageId: string, password: string) => {
        console.log("Join stage");
        stageConnection.joinStage(stageId, password)
            .then(() => {
                setError(undefined);
            })
            .catch((error: Error) => setError(error.message));
    }, [stageConnection]);

    const create = useCallback((stageName: string, password: string) => {
        console.log("Create stage");
        stageConnection.createStage(stageName, "music", password)
            .then(() => {
                setError(undefined);
            })
            .catch((error: Error) => setError(error.message));
    }, [stageConnection]);

    useEffect(() => {
        if (props.user)
            connect();
    }, [props.user]);

    return {
        create,
        join,
        stage,
        error
    }
}
