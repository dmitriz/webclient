export interface DatabaseRouter {
    id: string;
    ipv4: string,
    ipv6: string,
    domain: string;
    port: number,
    slotAvailable: number
}

export interface DatabaseGlobalProducer {
    uid: string;        // Globally unique
    stageId: string;    // Globally unique
    routerId: string;   // Globally unique
    producerId: string; // Only unique inside routerId
    deviceId: string;   // Globally unique
    kind: string;
}
