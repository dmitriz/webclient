import {MediasoupAudioTrack, MediasoupVideoTrack, StageMember} from "../lib/digitalstage/client.model";
import {useEffect, useRef, useState} from "react";
import {styled} from "baseui";
import CanvasPlayer from "./CanvasPlayer";
import {Slider} from "baseui/slider";

const MemberPanel = styled("div", {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    position: 'relative',
    boxSizing: "border-box"
});

const MemberTitle = styled("div", {
    width: '100%',
    position: "absolute",
    top: "8px",
    right: 0,
    left: "8px",
    zIndex: 200,
    boxSizing: "border-box",
    textShadow: "0 0 4px #000"
});

const MemberVideo = styled(CanvasPlayer, {
    width: '100%',
    height: '100%',
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    boxSizing: "border-box"
});

const SliderWrapper = styled("div", {
    position: "absolute",
    left: "0",
    bottom: "0",
    width: "100%",
    zIndex: 9999,
})

const HiddenAudioPlayer = styled("audio", {})

export default (props: {
    member: StageMember
}) => {
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const panelRef = useRef<HTMLDivElement>();
    const [volume, setVolume] = useState<number>(0);
    const audioRef = useRef<HTMLAudioElement>();

    const audioTracks: MediasoupAudioTrack[] = props.member.tracks.filter((track) => track.type === "audio").map((track) => track as MediasoupAudioTrack);
    const videoTracks: MediaStreamTrack[] = props.member.tracks.filter((track) => track.type === "video").map((track: MediasoupVideoTrack) => track.track);

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

    useEffect(() => {
        if (panelRef && panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            setWidth(rect.width);
            setHeight(rect.height);
        }
    }, [panelRef])

    return (
        <MemberPanel ref={panelRef}>
            <MemberTitle>{props.member.displayName}</MemberTitle>
            <MemberVideo width={width} height={height} videoTracks={videoTracks}/>
            <HiddenAudioPlayer ref={audioRef} playsInline={true}/>
            {audioTracks.length > 0 && (
                <SliderWrapper>
                    <Slider min={0} max={1} step={0.1} value={[volume]} onChange={(e) => setVolume(e.value[0])}/>
                </SliderWrapper>
            )}
        </MemberPanel>
    )
}
