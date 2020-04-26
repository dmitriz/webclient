export const SocketEvents = {
    stage: {
        create: 'stg/create',
        join: 'stg/join',
        participants: 'stg/participants/state',
        soundjack: {
            sendIp: 'stg/sj/send-ip',
            ipSent: 'stg/sj/ip-sent',
        }
    },
};

export interface StageCreatePayload {
    token: string;
    stageName: string;
    type: "theater" | "music" | "conference";
    password: string;
}

export interface StageJoinPayload {
    token: string;
    stageId: string;
    password: string;
}

export interface StageParticipantAnnouncement {
    userId: string;
    name: string;
    socketId: string;
}

export interface ClientIpPayload {
    ip: string;
    port: number;
}

export interface MediasoupProducerAnnouncement {
    userId: string;
    producer: string[];
}
