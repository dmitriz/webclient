import React, {useCallback, useContext, useEffect, useState} from "react";
import StageConnector from "./StageConnector";
import * as config from "../../env";
import {Stage} from "./model";
import {CreateStageResult, JoinStageResult} from "./events";

const HOST: string = config.SERVER_URL;
const PORT: number = config.SERVER_PORT;

export interface StageProps {
    stage?: Stage,
    setStage: (stage: Stage) => void;
}

const StageContext = React.createContext<StageProps>({
    setStage: () => {
    }
});

export const StageConsumer = StageContext.Consumer;

export const StageProvider = (props: {
    children: React.ReactNode,
}) => {
    const [stage, setStage] = useState<Stage>();

    return (
        <StageContext.Provider value={{
            stage: stage,
            setStage: setStage
        }}>
            {props.children}
        </StageContext.Provider>
    );
};

export const useStage = () => useContext<StageProps>(StageContext);

export const useStageControl = (props: {
    user: firebase.User
}) => {
    const [stageConnection, setStageConnection] = useState<StageConnector>();
    const {stage, setStage} = useContext<StageProps>(StageContext);
    const [error, setError] = useState<Error>();

    const connect = useCallback(() => {
        console.log("Connecting to " + HOST + ":" + PORT);
        const stageConnection = new StageConnector();
        stageConnection.connect(props.user, HOST, PORT).then(
            () => {
                setStageConnection(stageConnection);
            }
        );
    }, [props.user]);

    const create = useCallback((stageName: string, password: string) => {
        if (stage) {
            return;
        }
        console.log("Create stage");
        stageConnection.createStage(stageName, "music", password)
            .then((result: CreateStageResult) => {
                console.log("Got stage");
                setStage(result.stage);
                setError(undefined);
            })
            .catch((error: Error) => setError(error));
    }, [stageConnection]);

    const join = useCallback((stageId: string, password: string) => {
        if (stage) {
            return;
        }
        console.log("Join stage");
        stageConnection.joinStage(stageId, password)
            .then((result: JoinStageResult) => {
                console.log("Got stage");
                setStage(result.stage);
                setError(undefined);
            })
            .catch((error: Error) => setError(error));
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
};
