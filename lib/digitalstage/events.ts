import {Participant, Stage} from "./model";

export const StageRequests = {
    CreateStage: "stg/create-stage",
    JoinStage: "stg/join-stage"
};
export const StageEvents = {
    ParticipantAdded: "stg/participant-added",
    ParticipantChanged: "stg/participant-changed",
    ParticipantRemoved: "stg/participant-removed"
};
export const WebP2PRequests = {
    MakeAnswer: "p2p/make-answer",
    MakeOffer: "p2p/make-answer",
    SendCandidate: "p2p/send-candidate"
};
export const WebP2PEvents = {
    AnswerMade: "p2p/answer-made",
    OfferMade: "p2p/offer-made",
    CandidateSent: "p2p/candidate-sent",
};
export const SoundjackRequests = {
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

export interface MakeAnswerPayload {
    answer: RTCSessionDescriptionInit,
    targetUserId: string;
}

export interface AnswerMadePayload {
    answer: RTCSessionDescriptionInit;
    userId: string;
}

export interface MakeOfferPayload {
    offer: RTCSessionDescriptionInit,
    targetUserId: string;
}

export interface OfferMadePayload {
    offer: RTCSessionDescriptionInit;
    userId: string;
}

export interface SendCandidatePayload {
    candidate: RTCIceCandidateInit,
    targetUserId: string;
}

export interface CandidateSentPayload {
    candidate: RTCIceCandidateInit;
    userId: string;
}
