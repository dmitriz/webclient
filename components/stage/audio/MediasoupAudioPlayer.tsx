import {MediasoupAudioTrack} from "../../../lib/digitalstage/types/MediasoupAudioTrack";
import {styled} from "baseui";
import React, {MutableRefObject, useEffect, useRef, useState} from "react";
import {Slider} from "baseui/slider";
import {StageMember} from "../../../lib/digitalstage/useStage";
import useHover from "../../../lib/useHover";

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
    zIndex: 9999
});

const SliderWrapper = styled("div", {
    paddingLeft: "5vw",
    paddingRight: "5vw",
});

const SliderPopout = styled("div", (props: {
    $hovered: boolean
}) => ({
    maxHeight: props.$hovered ? 3000 : 0
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
        const realVolume = (props.globalVolume * volume) / 100;
        props.audioTrack.gainNode.gain.setValueAtTime(realVolume, props.audioTrack.gainNode.context.currentTime);
    }, [volume, props.globalVolume]);

    return (
        <SliderWrapper>
            <HiddenAudioPlayer ref={audioRef}/>
            <Slider min={0} max={100} step={10} value={[volume]}
                    onChange={(e) => setVolume(e.value[0])}
                    overrides={{
                        InnerThumb: ({$value, $thumbIndex}) => (
                            <React.Fragment>{$value[$thumbIndex]}</React.Fragment>
                        ),
                        ThumbValue: () => null,
                        Thumb: {
                            style: () => ({
                                height: '28px',
                                width: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderTopLeftRadius: '28px',
                                borderTopRightRadius: '28px',
                                borderBottomRightRadius: '28px',
                                borderBottomLeftRadius: '28px',
                                borderLeftStyle: 'solid',
                                borderRightStyle: 'solid',
                                borderTopStyle: 'solid',
                                borderBottomStyle: 'solid',
                                borderLeftWidth: '3px',
                                borderTopWidth: '3px',
                                borderRightWidth: '3px',
                                borderBottomWidth: '3px',
                                borderLeftColor: `#ccc`,
                                borderTopColor: `#ccc`,
                                borderRightColor: `#ccc`,
                                borderBottomColor: `#ccc`,
                                backgroundColor: '#fff',
                            }),
                        },
                    }}/>
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
                        <Slider min={0} max={100} step={5} value={[globalVolume]}
                                overrides={{
                                    InnerThumb: ({$value, $thumbIndex}) => (
                                        <React.Fragment>{$value[$thumbIndex]}</React.Fragment>
                                    ),
                                    ThumbValue: () => null,
                                    Thumb: {
                                        style: () => ({
                                            height: '36px',
                                            width: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderTopLeftRadius: '36px',
                                            borderTopRightRadius: '36px',
                                            borderBottomRightRadius: '36px',
                                            borderBottomLeftRadius: '36px',
                                            borderLeftStyle: 'solid',
                                            borderRightStyle: 'solid',
                                            borderTopStyle: 'solid',
                                            borderBottomStyle: 'solid',
                                            borderLeftWidth: '3px',
                                            borderTopWidth: '3px',
                                            borderRightWidth: '3px',
                                            borderBottomWidth: '3px',
                                            borderLeftColor: `#ccc`,
                                            borderTopColor: `#ccc`,
                                            borderRightColor: `#ccc`,
                                            borderBottomColor: `#ccc`,
                                            backgroundColor: '#fff',
                                        }),
                                    },
                                }}
                                onChange={(e) => setGlobalVolume(e.value[0])}/>
                    </SliderWrapper>
                )}
            </SliderOverlay>
        </>
    );
};
