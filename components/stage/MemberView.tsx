import React, {useEffect, useRef, useState} from "react";
import {styled} from "baseui";
import CanvasPlayer from "./video/CanvasPlayer";
import {StageMember} from "../../lib/digitalstage/useDigitalStage";
import {MediasoupVideoTrack} from "../../lib/digitalstage/types/MediasoupVideoTrack";
import MediasoupAudioPlayer from "./audio/MediasoupAudioPlayer";

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
    boxSizing: "border-box"
});

const SoundjackLogo = styled("img", {
    position: "absolute",
    top: "2px",
    right: "2px",
    width: "24px",
    height: "24px"
});

export default (props: {
    member: StageMember
}) => {
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const panelRef = useRef<HTMLDivElement>();

    useEffect(() => {
        if (panelRef && panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            setWidth(rect.width);
            setHeight(rect.height);
        }
    }, [panelRef])

    return (
        <MemberPanel ref={panelRef}>
            {props.member.audio.soundjackVolume && (
                <SoundjackLogo src="/soundjack.png"/>
            )}
            <MemberTitle>{props.member.displayName}</MemberTitle>
            <MemberVideo width={width} height={height}
                         videoTracks={props.member.videoTracks.map((videoTrack: MediasoupVideoTrack) => videoTrack.track)}/>
            <MediasoupAudioPlayer member={props.member}/>

        </MemberPanel>
    )
}
