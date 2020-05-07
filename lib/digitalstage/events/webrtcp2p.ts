
export const WebP2PEvents = {
    AnswerMade: "p2p/answer-made",
    OfferMade: "p2p/offer-made",
    CandidateSent: "p2p/candidate-sent",
};
export const WebP2PSends = {
    MakeAnswer: "p2p/make-answer",
    MakeOffer: "p2p/make-offer",
    SendCandidate: "p2p/send-candidate"
};
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
