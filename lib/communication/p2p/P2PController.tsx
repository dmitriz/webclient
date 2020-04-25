import IBaseController from "../IBaseController";
import {Participant} from "../Connection";

export default class P2PController implements IBaseController {
    connect(): Promise<void> {
        return undefined;
    }

    disconnect(): Promise<void> {
        return undefined;
    }

    handleParticipantAdded(participant: Participant): Promise<void> {
        return undefined;
    }

    publishTack(track: MediaStreamTrack): Promise<void> {
        return undefined;
    }

    unpublishTrack(track: MediaStreamTrack): Promise<void> {
        return undefined;
    }

}
