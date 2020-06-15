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
