/**
 * Location in firestore:
 * /users/{uid}
 *
 * Read access only to authenticated clients with uid
 */
export interface DatabaseUser {
    uid: string;
    stageId?: string;
}

/**
 * Location in firestore:
 * /stages/{stageId}
 *
 * Read access to all authenticated clients (currently) TODO: Only access if user is actual member of this stage
 */
export interface DatabaseStage {
    id: string;
    name: string;
    password: string;
}

/**
 * Member of a DatabaseStage
 *
 * Location in firestore:
 * /stages/{stageId}/members/{uuid}
 *
 * Read access to all authenticated clients (currently) TODO: Only access if user is actual member of this stage
 */
export interface DatabaseStageMember {
    uid: string;
    displayName: string;

    volume: number; // Mastervolume for member between 0 and 1
}

/**
 * Audio Provider provided to member
 *
 * Location in firestore:
 * /stages/{stageId}/members/{uid}/audioproducers/{globalProducerId}
 *
 * Read access to member only
 */
export interface DatabaseStageMemberAudioProducer {
    globalProducerId: string;
    volume: number; // Trackvolume between 0 and 1
}

/**
 * Video Provider provided to member
 *
 * Location in firestore:
 * /stages/{stageId}/members/{uid}/videoproducers/{globalProducerId}
 *
 * Read access to member only
 */
export interface DatabaseStageMemberVideoProducer {
    globalProducerId: string;
}

export interface DatabaseStageMemberAudioProducer {

}

export interface DatabaseStageMemberSoundjack {
    globalSoundjackId: string;
}

/**
 * Router
 *
 * Location in realtime database:
 * /routers/{routerId}
 *
 * Read access to all
 */
export interface DatabaseRouter {
    ipv4: string,
    ipv6: string,
    domain: string;
    port: number,
    slotAvailable: number
}

interface DatabaseGlobalProducer {
    uid: string;        // Globally unique
    stageId: string;    // Globally unique
    routerId: string;   // Globally unique
    producerId: string; // Only unique inside routerId
    deviceId: string;   // Globally unique
}

/**
 * Global audio producer
 *
 * Location in firestore:
 * /audioproducers/{globalProducerId}
 *
 * Read access to all authenticated clients
 */
export interface DatabaseGlobalAudioProducer extends DatabaseGlobalProducer {
}

/**
 * Global audio producer
 *
 * Location in firestore:
 * /videoproducers/{globalProducerId}
 *
 * Read access to all authenticated clients
 */
export interface DatabaseGlobalVideoProducer extends DatabaseGlobalProducer {
}

/**
 * Global soundjack
 *
 * Location in firestore:
 * /soundjacks/{globalSoundjackId}
 *
 * Read access to all authenticated clients
 */
export interface DatabaseGlobalSoundjack {
    uid: string;
    deviceId: string;   // Globally unique
    stageId: string;
    ipv4: string;
    ipv6: string;
}

/**
 * Device
 *
 * Location in realtime database:
 * /devices/{deviceId}
 *
 * Read access only to authenticated client with uid
 */
export interface DatabaseDevice {
    uid: string;

    canAudio: boolean;
    canVideo: boolean;

    sendAudio: boolean;
    sendVideo: boolean;
    receiveAudio: boolean;
    receiveVideo: boolean;

    volume: number; // Output master volume for device between 0 and 1 (if implemented)
}
