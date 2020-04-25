import React, {Context, createContext, useCallback, useState} from "react";
import firebase from "firebase/app";
import Connection, {Participant, Stage} from "./communication/Connection";

interface StageContextProps {
    stage?: Stage;
    participants: Participant[],
    connect: (hostname: string, port: number) => Promise<void>,
    disconnect: () => Promise<void>,3
    createStage: (user: firebase.User, name: string, password?: string, type?: 'theater' | 'music' | 'conference') => Promise<void>,
    joinStage: (user: firebase.User, stageId: string, password?: string) => Promise<void>
}

const StageContext: Context<StageContextProps> = createContext(undefined);


export const StageProvider = (props: {
    children: React.ReactNode
}) => {
    const [connection] = useState<Connection>(new Connection());

    const connect = useCallback((hostname: string, port: number) => {
        return new Promise<void>((resolve, reject) => {
            if (connection) {
                console.log("Connecting...");
                return connection.connect(hostname, port);
            }
            console.log(connection);
            reject("API not ready...")
        });
    }, [connection]);

    const disconnect = useCallback(async () => {
        return new Promise<void>(resolve => {
            connection.disconnect();
            resolve();
        });
    }, [connection]);

    const createStage = useCallback(async (user: firebase.User, name: string, password?: string, type: 'theater' | 'music' | 'conference' = 'theater') => {
        if (connection) {
            return connection.createStage(user, name, password, type)
                .then((stage: Stage) => {
                    console.log("Created stage!");
                    setState(prevState => ({
                        ...prevState,
                        stage: stage
                    }));
                });
        }
    }, [connection]);

    const joinStage = useCallback(async (user: firebase.User, stageId: string, password?: string) => {
        if (connection) {
            return connection.joinStage(user, stageId, password)
                .then((stage: Stage) => {
                    console.log("Joined stage!");
                    setState(prevState => ({
                        ...prevState,
                        stage: stage
                    }));
                });
        }
    }, [connection]);
    const [state, setState] = useState<StageContextProps>({
        participants: [],
        connect: connect,
        disconnect: disconnect,
        createStage: createStage,
        joinStage: joinStage
    });
    return (
        <StageContext.Provider value={state}>
            {props.children}
        </StageContext.Provider>
    );
};

export const useStage = (): StageContextProps => React.useContext<StageContextProps>(StageContext);
export default useStage;
