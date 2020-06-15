import {MediasoupAudioTrack} from "../../../lib/digitalstage/types/MediasoupAudioTrack";
import {styled} from "baseui";
import React, {MutableRefObject, useEffect, useRef, useState} from "react";
import useHover from "../../../lib/useHover";
import VolumeSlider from "../../theme/VolumeSlider";
import {StageMember} from "../../../lib/digitalstage/useDigitalStage";

const HiddenAudioPlayer = styled("audio", {})

const SliderOverlay = styled("div", {
    position: "absolute",
    left: "0",
    bottom: "0",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    zIndex: 10
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
    transitionProperty: "opacity"
}));

const MediasoupAudioSlider = (props: {
    globalVolume: number;
    audioTrack: MediasoupAudioTrack;
}) => {
    const audioRef = useRef<HTMLAudioElement>();
    const [volume, setVolume] = useState<number>(props.audioTrack.gainNode.gain.value * 100);

    useEffect(() => {
        audioRef.current.srcObject = props.audioTrack.mediaStream;
    }, [audioRef]);

    useEffect(() => {
        const realVolume = (props.globalVolume / 100) * (volume / 100);
        console.log(realVolume);
        props.audioTrack.gainNode.gain.setValueAtTime(realVolume, props.audioTrack.gainNode.context.currentTime);
    }, [volume, props.globalVolume]);

    return (
        <SliderWrapper>
            <HiddenAudioPlayer ref={audioRef}/>
            <VolumeSlider min={0} max={100} step={10} value={volume}
                          onChange={(value) => setVolume(value)}/>
        </SliderWrapper>
    );
}

export default (props: {
    member: StageMember
}) => {
    const [globalVolume, setGlobalVolume] = useState<number>(props.member.audio.globalVolume * 100);
    const hoverRef: MutableRefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const hovered = useHover<HTMLDivElement>(hoverRef);

    //TODO: For later, when Chromium fixed this bug: https://bugs.chromium.org/p/chromium/issues/detail?id=933677
    /*
    useEffect(()=> {
        props.member.globalGain.gain.setValueAtTime(globalVolume, props.member.globalGain.context.currentTime);
    }, [globalVolume]);*/

    useEffect(() => {
        props.member.audio.globalVolume = globalVolume / 100;
    }, [globalVolume]);

    return (
        <>
            <SliderOverlay ref={hoverRef}>

                <SliderPopout $hovered={hovered}>
                    {props.member.audio.audioTracks.map((audioTrack: MediasoupAudioTrack) => (
                        <MediasoupAudioSlider key={audioTrack.id} globalVolume={globalVolume} audioTrack={audioTrack}/>
                    ))}
                </SliderPopout>
                {props.member.audio.audioTracks.length > 0 && (
                    <SliderWrapper>
                        <VolumeSlider min={0} max={100} step={5} value={globalVolume}
                                      onChange={(value) => setGlobalVolume(value)}/>
                    </SliderWrapper>
                )}
            </SliderOverlay>
        </>
    );
};
