import React, {useEffect, useRef, useState} from "react";
import {styled} from "baseui";
import CanvasPlayer from "./video/CanvasPlayer";
import MediasoupAudioPlayer from "./audio/MediasoupAudioPlayer";
import {MediasoupMember} from "../../lib/digitalstage/mediasoup/types/MediasoupMember";
import {MediasoupVideoProducer} from "../../lib/digitalstage/mediasoup/types/MediasoupVideoProducer";

const MemberPanel = styled("div", {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    position: 'relative',
    boxSizing: "border-box",
    zIndex: 1
});

const MemberTitle = styled("div", {
    width: '100%',
    position: "absolute",
    top: "8px",
    right: 0,
    left: "8px",
    boxSizing: "border-box",
    textShadow: "0 0 4px #000",
    zIndex: 2
});

const MemberVideo = styled(CanvasPlayer, {
    width: '100%',
    height: '100%',
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    boxSizing: "border-box",
    zIndex: 1
});

const SoundjackLogo = styled("img", {
    position: "absolute",
    top: "2px",
    right: "2px",
    width: "24px",
    height: "24px",
    zIndex: 2
});

const StyledMediasoupAudioPlayer = styled(MediasoupAudioPlayer, {
    zIndex: 3
});

export default (props: {
    member: MediasoupMember
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
            {props.member.soundjacks.length > 0 && (
                <SoundjackLogo src="/soundjack.png"/>
            )}
            <MemberTitle>{props.member.name}</MemberTitle>
            <MemberVideo width={width} height={height}
                         videoTracks={props.member.getVideoProducers().map((videoProducer: MediasoupVideoProducer) => videoProducer.track)}/>

            <StyledMediasoupAudioPlayer member={props.member}/>
        </MemberPanel>
    )
}
