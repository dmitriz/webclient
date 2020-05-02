export interface Server {
    id: string;
    ip: string;
    port: number;

    connectedDeviceIDs: string[] // refers to Device->id's
    // A session may use several servers, but a device has to be connected to one single server
}

export interface User {
    id: string;
    sessionId: string;  // refers to Session->id
}

export interface Session {
    id: string;
    deviceIDs: string[];    // refers to Device->id's

}

export interface Stage {
    id: string;
    name: string;
    directorSessionID: string;  // refers to director's Session->id
    // but we may need to consider adding also the user id - since the session id changes
    // and the director needs to be able to rejoin

    sessionIDs: string; // refers to Session->id's
}

export interface Device {
    id: string;
    socketId: string;   // <-- non public of course

    /* wft?
    soundjack?: {
        publicIP: string;
        publicPort: number;
    }*/
}

export interface SoundjackStream {
    id: string;

    level: number;  // only incoming streams have levels, so maybe using two inheriting interfaces instead?
}

export interface SoundjackDevice extends Device {   // For firebase we might use different classes instead (no inheritence possible)
    id: string;
    soundLevel: number;

    incomingStreamIds: string[];    // <-- refers to SoundjackStream->id
    outgoinStreamIds: string[]; // <-- refers to SoundjackStream->id
}
