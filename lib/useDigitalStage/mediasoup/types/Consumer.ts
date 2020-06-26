import mediasoupClient from "mediasoup-client";
import {GlobalProducer} from "../MediasoupDevice";

export interface Consumer {
    globalProducer: GlobalProducer,
    consumer: mediasoupClient.types.Consumer,
}
