import {MediasoupAudioTrack} from "./MediasoupAudioTrack";
import {DatabaseStageMember} from "../base/types";
import {MediasoupVideoTrack} from "./MediasoupVideoTrack";

export interface StageMember extends DatabaseStageMember {
    uid: string;
    audio: {
        //globalGain: IGainNode<IAudioContext>;
        audioTracks: MediasoupAudioTrack[];
        soundjackVolume?: number;
        globalVolume: number;
    }
    videoTracks: MediasoupVideoTrack[];
}
