/**
 *
 * Each user has
 */

interface Stage {

}


interface RemoteParticipant {
    sessionID: string;
    ip: string;

}

interface Device {

    type: "ovbox" | "soundcheck";
}

interface Participant {

    devices: {}

}

interface SoundjackDevice {
    deviceId: string;
    isRemote: boolean;
}

export interface StageEvents {
    onStageEntered: () => {};
    onStageLeft: () => {};
    onParticipantAdded: () => {};
    onParticipantChanged: () => {};
    onParticipantRemoved: () => {};
}

export default class StageConnector {
    private stage: Stage | null = null;

    public enterStage = () => {

    };

    public leaveStage = () => {

    };

    /**
     * Publish any kind of track (e.g. video or audio).
     * The internal logic or server logic decided, who'll receive the stream.
     * @param track
     */
    public publishTrack = (track: MediaStreamTrack) => {
    };

    /**
     * Stops publishing the given track.
     * @param track
     */
    public unpublishTrack = (track: MediaStreamTrack) => {

    };

    public addSoundjack = (soundjackDevice: SoundjackDevice) => {

    }
}

