import {
    DtlsParameters,
    IceCandidate,
    IceParameters,
    MediaKind,
    RtpCapabilities,
    RtpParameters
} from "mediasoup-client/lib/types";

/**
 * We use only requests for mediasoup, meaning sends with callback.
 * So there is always a payload (for sending) and result (the callback).
 */

export const MediasoupRequests = {
    GetRTPCapabilities: "ms/get-rtp-capabilities",
    CreateReceiveTransport: "ms/create-receive-transport",
    CreateSendTransport: "ms/create-send-transport",
    ConnectTransport: "ms/create-receive-transport",
    SendTrack: "ms/send-track",
    Consume: "ms/consume",
    FinishConsume: "ms/finish-consume"
};

export interface MediasoupGetRTPCapabilitiesPayload extends RtpCapabilities {
}

export interface MediasoupSentTransportPayload {
    preferTcp: boolean,
    rtpCapabilities: RtpCapabilities;
}

// For both send and receive
export interface MediasoupTransportResult {
    id: string;
    iceParameters: IceParameters,
    iceCandidates: IceCandidate[],
    dtlsParameters: DtlsParameters
}

// For both send and receive
export interface MediasoupTransportPayload {
    preferTcp: boolean,
    rtpCapabilities: RtpCapabilities;
}

export interface MediasoupConnectTransportPayload {
    transportId: string;
    dtlsParameters: DtlsParameters;
}

export interface MediasoupSendTrackPayload {
    transportId: string;
    rtpParameters: RtpParameters;
    kind: MediaKind;
}

export interface MediasoupSendTrackResult {
    producerId: string;
}

export interface MediasoupConsumePayload {
    producerId: string;
    transportId: string;
    rtpCapabilities: RtpCapabilities;
}

export interface MediasoupConsumeResult {
    consumerId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
    producerPaused: boolean;
    type: any; // ConsumerType
}

export interface MediasoupFinishConsumePayload {
    userId: string;
    consumerId: string;
}

export interface MediasoupFinishConsumeResult {
}
