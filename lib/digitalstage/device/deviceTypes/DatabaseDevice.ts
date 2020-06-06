/**
 * Device
 *
 * Location in realtime database:
 * /devices/{deviceId}
 *
 * Read access only to authenticated client with uid
 */
export default interface DatabaseDevice {
    uid: string;

    name: string;

    caption: string;

    canAudio: boolean;
    canVideo: boolean;

    sendAudio: boolean;
    sendVideo: boolean;
    receiveAudio: boolean;
    receiveVideo: boolean;
}
