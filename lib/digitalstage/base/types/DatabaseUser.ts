/**
 * Location in firestore:
 * /users/{uid}
 *
 * Read access only to authenticated clients with uid
 */
export interface DatabaseUser {
    uid: string;
    displayName: string;
    stageId?: string;
}
