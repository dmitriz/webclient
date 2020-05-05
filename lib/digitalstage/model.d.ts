export interface Participant {
    userId: string;
    socketId: string;
    displayName: string;
    ipv4: string;
    ipv6: string;
    soundjack: boolean;
    producerIds: string[]
}

export interface Stage {
    id: string;
    name: string;
    password: string;
    directorUserId: string;
    participants: {
        [userId: string]: Participant
    }
}
