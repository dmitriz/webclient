import {IMediasoupTrack} from "./IMediasoupTrack";

export interface MediasoupVideoTrack extends IMediasoupTrack {
    type: "video";
    track: MediaStreamTrack;
}
