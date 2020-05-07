import React, {Dispatch, SetStateAction, useContext, useState} from "react";
import {Stage} from "../lib/digitalstage/model";
import {SocketWithRequest} from "../util/SocketWithRequest";

export interface ConnectionProps {
    stage?: Stage;
    setStage: Dispatch<SetStateAction<Stage | undefined>>;
    socket?: SocketWithRequest;
    setSocket: Dispatch<SetStateAction<SocketWithRequest | undefined>>;
    connected: boolean;
}

const ConnectionContext = React.createContext<ConnectionProps>(undefined);

export const ConnectionConsumer = ConnectionContext.Consumer;

export const ConnectionProvider = (props: {
    children: React.ReactNode,
}) => {
    const [stage, setStage] = useState<Stage>();
    const [socket, setSocket] = useState<SocketWithRequest>();

    return (
        <ConnectionContext.Provider value={{
            stage: stage,
            setStage: setStage,
            socket: socket,
            setSocket: setSocket,
            connected: socket !== undefined
        }}>
            {props.children}
        </ConnectionContext.Provider>
    );
};
export const useConnection = () => useContext<ConnectionProps>(ConnectionContext);
