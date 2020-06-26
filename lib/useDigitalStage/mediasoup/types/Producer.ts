import mediasoupClient from "mediasoup-client";

export interface Producer {
    producer: mediasoupClient.types.Producer,
    globalProducerId?: string;
}
