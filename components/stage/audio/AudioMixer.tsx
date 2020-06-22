import {styled} from "baseui";
import {IAudioProducer, IMember, ISoundjack} from "../../../lib/digitalstage/useStage";
import VolumeSlider from "../../theme/VolumeSlider";
import React, {MutableRefObject, useRef} from "react";
import useHover from "../../../lib/useHover";
import {AudioPlayer} from "./AudioPlayer";

const SliderOverlay = styled("div", {
    position: "absolute",
    left: "0",
    bottom: "0",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    zIndex: 1
});

const SliderWrapper = styled("div", {
    marginTop: "5px"
});

const SliderPopout = styled("div", (props: {
    $hovered: boolean
}) => ({
    opacity: props.$hovered ? 1 : 0,
    transitionTimingFunction: "cubic-bezier(0, 0, 1, 1)",
    transitionDuration: "200ms",
    transitionProperty: "opacity",
    zIndex: 2
}));

export default (
    props: {
        member: IMember
    }
) => {
    const hoverRef: MutableRefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const hovered = useHover<HTMLDivElement>(hoverRef);

    return (
        <SliderOverlay ref={hoverRef}>
            <SliderPopout $hovered={hovered}>
                {props.member.soundjacks.map((soundjack: ISoundjack) => (
                    <VolumeSlider min={0} max={1} step={0.1} value={soundjack.volume}
                                  onChange={soundjack.setVolume}/>
                ))}
                {props.member.audioProducers.map((producer: IAudioProducer) => producer.consumer ? (
                    <React.Fragment key={producer.id}>
                        <VolumeSlider min={0} max={1} step={0.1} value={producer.volume}
                                      onChange={producer.setVolume}/>
                        <AudioPlayer track={producer.consumer.track} masterVolume={props.member.volume}
                                     trackVolume={producer.volume}/>
                    </React.Fragment>
                ) : null)}
            </SliderPopout>
            {(props.member.audioProducers.length > 0 || props.member.soundjacks.length > 0) && (
                <SliderWrapper>
                    <VolumeSlider min={0} max={1} step={0.1} value={props.member.volume}
                                  onChange={v => props.member.setVolume(v)}/>
                </SliderWrapper>
            )}
        </SliderOverlay>
    )
}
