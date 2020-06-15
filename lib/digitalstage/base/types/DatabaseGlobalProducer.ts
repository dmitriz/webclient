// /producers/{globalProducerId}
export interface DatabaseGlobalProducer {
    uid: string;
    deviceId: string;
    routerId: string;
    producerId: string;
    kind: "audio" | "video";
}
