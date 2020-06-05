import {IAudioContext} from "standardized-audio-context";
import { IMediasoupTrack } from "./types/IMediasoupTrack";
import { MediasoupAudioTrack } from "./types/MediasoupAudioTrack";
import {MediasoupVideoTrack} from "./types/MediasoupVideoTrack";
import mediasoupClient from "mediasoup-client";

export const createMediasoupMediaTrack = (id: string, consumer: mediasoupClient.types.Consumer, audioContext: IAudioContext): IMediasoupTrack => {
    if (consumer.kind === "audio") {
        return new MediasoupAudioTrack(id, consumer, audioContext);
    }
    return {
        id: id,
        type: "video",
        track: consumer.track
    } as MediasoupVideoTrack;
}
