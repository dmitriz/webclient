// REACT MODELS
import {Observable} from "rxjs";

export interface Stage {
    name: string;
    members: Observable<StageMember[]>;
}

export interface StageMember {
    uid: string;
    displayName: Observable<string>;
}

export interface AudioSource {
    gain: Observable<number>;
    label: string;
}

export interface VideoSource {
    label: string;
}

export interface Device {
    ipv4: Observable<string>;
    ipv6: Observable<string>;

    input: {
        audio: {
            available: Observable<{
                [deviceId: string]: AudioSource
            }>;
            selected: Observable<{
                [deviceId: string]: AudioSource
            }>;
            active: Observable<boolean>;
        };
        video: {
            available: Observable<{
                [deviceId: string]: VideoSource
            }>;
            selected: Observable<{
                [deviceId: string]: VideoSource
            }>;
            active: Observable<boolean>;
        };
    };
    output: {
        active: Observable<boolean>;
        volume: Observable<number>;
    }
}

// FIREBASE MODELS
export interface FirebaseStage {
    name: string;
    password: string;
    members: FirebaseStageMember[];
}

export interface FirebaseStageMember {
    uid: string;
    displayName: string;
}

export interface FirebaseUser { // uid === id
    audioProducer: {    // Assigned by stage handler
        uid: string;
        producerId: string;
        volume: number;
    };
    videoProducer: {   // Assigned by stage handler
        uid: string;
        producerId: string;
    };
    soundjackConnector: {   // Assigned by stage handler
        uid: string;
        connectorId: string;
        volume: number;
    }
    soundjackConnectors: string[];
    stageId: string;
    devices: FirebaseDevice[];
}

export interface FirebaseAudioDevice {
    label: string;
    gain: number;
}

export interface FirebaseVideoDevice {
    label: string;
}

export interface FirebaseDevice {
    ipv4: string;
    ipv6: string;

    input: {
        audio: {
            available: {
                [deviceId: string]: FirebaseAudioDevice
            };
            selected: {
                [deviceId: string]: FirebaseAudioDevice
            };
            active: boolean;
        };
        video: {
            available: {
                [deviceId: string]: FirebaseVideoDevice
            };
            selected: {
                [deviceId: string]: FirebaseVideoDevice
            };
            active: boolean;
        }
    }
    output: {
        audio: {
            volume: number;
        } | false;
        video: boolean;
    }
}

export interface FirebaseSoundjackConnector {
    ipv4: string;
    ipv6: string;
    port: number;
}

export interface FirebaseProducers {
    uid: string;
    stageId: string;
    routerId: string;
    kind: "video" | "audio";
}

export interface FirebaseRouter {
    ipv4: string;
    ipv6: string;
    port: number;
}
