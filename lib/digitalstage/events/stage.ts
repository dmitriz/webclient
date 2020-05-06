import {Participant, Stage} from "../model";
export * from "./mediasoup";

/**
 * We divide between:
 * - Events for socket.on(...)
 * - Sends for socket.emit(...)
 * - Requests for socket.request(...), a send with callback
 *
 * Before you can use any other events, you have to create or join a stage.
 * And the socket connection requires a token as query parameter, otherwise the connection is directly denied.
 */

/** STAGE HANDLING **/
export const StageRequests = {
    CreateStage: "stg/create-stage",
    JoinStage: "stg/join-stage"
};
export const StageEvents = {
    ParticipantAdded: "stg/participant-added",
    ParticipantChanged: "stg/participant-changed",
    ParticipantRemoved: "stg/participant-removed"
};
export const SoundjackSends = {
    EnableSoundjack: "sj/enable",
};

export interface CreateStagePayload {
    stageName: string;
    password: string;
    soundjack: boolean;
}

export interface CreateStageResult {
    stage: Stage
}

export interface JoinStagePayload {
    stageId: string;
    password: string;
    soundjack: boolean;
}

export interface JoinStageResult {
    stage: Stage
}

export interface ParticipantAddedPayload extends Participant {
}

export interface ParticipantRemovedPayload extends Participant {
}

export interface ParticipantChangedPayload extends Participant {
}

