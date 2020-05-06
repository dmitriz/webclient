import {Stage} from "../model";
import React, {Dispatch, SetStateAction, useState} from "react";


export class StageConnector {

}


/* HOOKS FOR REACT: */
export interface StageProps {
    stage?: Stage;
    setStage: Dispatch<SetStateAction<Stage | undefined>>;
}

const StageContext = React.createContext<StageProps>({
    setStage: () => {
    },
});

export const StageConsumer = StageContext.Consumer;

export const StageProvider = (props: {
    children: React.ReactNode,
}) => {
    const [stage, setStage] = useState<Stage>();
    //const [remoteParticipants, setRemoteParticipants] = useState<{ [userId: string]: Participant }>();

    return (
        <StageContext.Provider value={{
            stage: stage,
        }}>
            {props.children}
        </StageContext.Provider>
    );
};
