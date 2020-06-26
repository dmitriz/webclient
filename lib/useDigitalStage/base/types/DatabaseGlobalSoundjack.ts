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
    deviceId: string;
    ipv4: string;
    ipv6: string;
    port: number;
}
