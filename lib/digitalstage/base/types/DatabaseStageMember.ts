/**
 * Member of a DatabaseStage
 *
 * Location in firestore:
 * /stages/{stageId}/members/{uuid}
 *
 * Read access to all authenticated clients (currently) TODO: Only access if user is actual member of this stage
 */
export interface DatabaseStageMember {
    displayName: string;
    online: boolean;
}
