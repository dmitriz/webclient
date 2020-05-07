import {
    DtlsParameters,
    IceCandidate,
    IceParameters,
    MediaKind,
    RtpCapabilities,
    RtpParameters,
    SctpParameters
} from "mediasoup-client/lib/types";

/**
 * We use only requests for mediasoup, meaning sends with callback.
 * So there is always a payload (for sending) and result (the callback).
 */

export const MediasoupRequests = {
    GetRTPCapabilities: "ms/get-rtp-capabilities",
    CreateReceiveTransport: "ms/create-receive-transport",
    CreateSendTransport: "ms/create-send-transport",
    ConnectTransport: "ms/connect-transport",
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
    iceParameters: IceParameters;
    iceCandidates: IceCandidate[];
    dtlsParameters: DtlsParameters;
    sctpParameters?: SctpParameters;
    iceServers?: RTCIceServer[];
    iceTransportPolicy?: RTCIceTransportPolicy;
    additionalSettings?: any;
    proprietaryConstraints?: any;
    appData?: any;
    error?: string;
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
    id: string;
}

export interface MediasoupConsumePayload {
    producerId: string;
    transportId: string;
    rtpCapabilities: RtpCapabilities;
}

export interface MediasoupConsumeResult {
    id: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
    producerPaused: boolean;
    type: any; // ConsumerType
}

export interface MediasoupFinishConsumePayload {
    id: string;
}

export interface MediasoupFinishConsumeResult {
}
