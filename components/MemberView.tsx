import {MediasoupAudioTrack, MediasoupVideoTrack, StageMember} from "../lib/digitalstage/client.model";
import {useEffect, useRef, useState} from "react";
import {Slider} from "baseui/slider";
import VideoTrackPlayer from "./video/VideoTrackPlayer";
import {styled} from "baseui";

const HiddenAudioPlayer = styled("audio", {
    display: "none"
})

export default (props: {
    member: StageMember
}) => {
    const [volume, setVolume] = useState<number>(0);
    const audioRef = useRef<HTMLAudioElement>();

    const audioTracks: MediasoupAudioTrack[] = props.member.tracks.filter((track) => track.type === "audio").map((track) => track as MediasoupAudioTrack);
    const videoTracks: MediasoupVideoTrack[] = props.member.tracks.filter((track) => track.type === "video").map((track) => track as MediasoupVideoTrack);

    useEffect(() => {
        if (audioTracks.length > 0) {
            audioTracks.forEach((audioTrack) => audioTrack.setVolume(volume));
        }
    }, [volume, audioTracks]);

    useEffect(() => {
        if (audioRef && audioRef.current && audioTracks.length > 0) {
            audioRef.current.srcObject = new MediaStream([audioTracks[0].track]);
        }
    }, [audioTracks])

    return (
        <>
            <strong>{props.member.displayName}</strong>
            <ul>
                <li>{audioTracks.length} Audio Tracks</li>
                <HiddenAudioPlayer ref={audioRef}></HiddenAudioPlayer>
                {audioTracks.length > 0 && (
                    <Slider min={0} max={1} step={0.1} value={[volume]} onChange={(e) => setVolume(e.value[0])}/>
                )}
                <li>{videoTracks.length} Video Tracks</li>
                {videoTracks.map((videoTrack) => (
                    <VideoTrackPlayer track={videoTrack.track}/>
                ))}
            </ul>
        </>
    )
}
