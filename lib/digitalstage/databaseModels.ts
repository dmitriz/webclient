// DATABASE
/**
 * List of all devices, only interesting for the user itself (to remote control etc.)
 * IMPORTANT: Since every webclient registers itself as a new device, we have to remove this
 * when disconnecting or clean up automatically (maybe websockets are the best approach here?)
 *
 * The streamAudio e.g. can be maniupulated by the user itself.
 * Then the device should already now, if the user is attached to a stage (using firestore for this?).
 *
 * When receiveAudio=true and user in stage -> listen to all mediasoup producers and soundjack devices and
 * create consumers for producers and connect local soundjack client to all other soundjack devices
 */
export interface Device {
    uid: string;
    ipv4: string;
    ipv6: string;
    canVideo: boolean;
    canAudio: boolean;
    streamVideo: boolean;
    receiveVideo: boolean;
    streamAudio: "soundjack" | "mediasoup" | false;
    receiveAudio: boolean;
}

/**
 * List of all available mediasoup producers, created and maintained only by the device itself
 */
export interface MediasoupProducer {
    uid: string;
    stageId: string; // This must be changed automatically
    kind: 'audio' | 'video';
    deviceId: string;
    routerId: string;
    mediasoupRouterId: string;
    mediasoupProducerId: string;
}

/**
 * List of all available soundjack connectors, created and maintained only by the device itself
 */
export interface SoundjackConnectors {
    uid: string;
    stageId: string;    // This must be changed automatically
    ipv4: string;   // Updated and maintained by connector itself
    ipv6: string;   // Updated and maintained by connector itself
    port: number;   // Updated and maintained by connector itself
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