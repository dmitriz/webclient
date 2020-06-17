import {styled} from "baseui";
import React, {MutableRefObject, useCallback, useEffect, useRef, useState} from "react";
import useHover from "../../../lib/useHover";
import VolumeSlider from "../../theme/VolumeSlider";
import {MediasoupMember} from "../../../lib/digitalstage/mediasoup/types/MediasoupMember";
import {MediasoupAudioProducer} from "../../../lib/digitalstage/mediasoup/types/MediasoupAudioProducer";

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

const MediasoupAudioSlider = (props: {
    globalVolume: number;
    producer: MediasoupAudioProducer;
}) => {
    const audioRef = useRef<HTMLAudioElement>();
    const [volume, setVolume] = useState<number>(props.producer.gainNode.gain.value * 100);

    useEffect(() => {
        if (props.producer.mediaStream)
            audioRef.current.srcObject = props.producer.mediaStream;
    }, [audioRef, props.producer.mediaStream]);

    useEffect(() => {
        const realVolume = (props.globalVolume / 100) * (volume / 100);
        console.log(realVolume);
        if (props.producer.track) {
            props.producer.gainNode.gain.setValueAtTime(realVolume, props.producer.gainNode.context.currentTime);
        }
    }, [volume, props.globalVolume, props.producer.track]);

    return (
        <SliderWrapper>
            <HiddenAudioPlayer ref={audioRef}/>
            <VolumeSlider min={0} max={100} step={10} value={volume}
                          onChange={(value) => setVolume(value)}/>
        </SliderWrapper>
    );
}

export default (props: {
    member: MediasoupMember
}) => {
    const [globalVolume, setVolumeInternal] = useState<number>(props.member.volume * 100);
    const hoverRef: MutableRefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const hovered = useHover<HTMLDivElement>(hoverRef);

    //TODO: For later, when Chromium fixed this bug: https://bugs.chromium.org/p/chromium/issues/detail?id=933677
    /*
    useEffect(()=> {
        props.member.globalGain.gain.setValueAtTime(globalVolume, props.member.globalGain.context.currentTime);
    }, [globalVolume]);*/

    const setVolume = useCallback((volume: number) => {
        console.log("setVolume(" + volume + ")");
        return props.member.setVolume(volume / 100);
    }, [props.member]);

    return (
        <>
            <SliderOverlay ref={hoverRef}>

                <SliderPopout $hovered={hovered}>
                    {props.member.getAudioProducers().map((producer: MediasoupAudioProducer) => (
                        <MediasoupAudioSlider key={producer.id} globalVolume={props.member.volume}
                                              producer={producer}/>
                    ))}
                </SliderPopout>
                {props.member.getAudioProducers().length > 0 && (
                    <SliderWrapper>
                        <VolumeSlider min={0} max={100} step={5} value={props.member.volume}
                                      onChange={(value) => setVolume(value)}/>
                    </SliderWrapper>
                )}
            </SliderOverlay>
        </>
    );
};
