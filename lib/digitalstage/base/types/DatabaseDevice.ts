/**
 * Device
 *
 * Location in realtime database:
 * /user/{uid}/devices/{deviceId}
 */
export interface DatabaseDevice {
    uid: string;

    name: string;

    caption: string;

    canAudio: boolean;
    canVideo: boolean;

    sendAudio: boolean;
    sendVideo: boolean;
    receiveAudio: boolean;
    receiveVideo: boolean;

    error?: string;

    audioDevices: string[];
    inputAudioDevice?: number;
    outputAudioDevice?: number;
}
