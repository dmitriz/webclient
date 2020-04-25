import {Participant} from "./Connection";

export default interface IBaseController {
    connect(): Promise<void>;

    disconnect(): Promise<void>;

    publishTack(track: MediaStreamTrack): Promise<void>

    unpublishTrack(track: MediaStreamTrack): Promise<void>

    handleParticipantAdded(participant: Participant): Promise<void>;
}
