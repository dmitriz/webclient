// DATABASE
export interface Device {
    uid: string;
    ipv4: string;
    ipv6: string;
    stageId: string;
    soundjack: boolean;
}
export interface MediasoupProducer {
    uid: string;
    kind: 'audio' | 'video';
    deviceId: string;
    routerId: string;
    stageId: string;
    mediasoupRouterId: string;
    mediasoupProducerId: string;
}
export interface MediasoupRouter {
    ipv4: string;
    ipv6: string;
    port: number;
    clientId: string; // client == server instance
}
export interface Stage {
    name: string;
    ownerUid: string;
    members: StageMember[];
}
export interface StageMember {
    uid: string
    displayName: string;
    devices: Device[];
}