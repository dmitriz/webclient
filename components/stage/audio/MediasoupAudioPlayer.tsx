import {styled} from "baseui";
import React, {MutableRefObject, useEffect, useRef, useState} from "react";
import useHover from "../../../lib/useHover";
import VolumeSlider from "../../theme/VolumeSlider";
import {IAudioProducer, IMember, ISoundjack} from "../../../lib/digitalstage/useStage";
import {useAudioContext} from "../../../lib/useAudioContext";
import {IGainNode} from "standardized-audio-context/src/interfaces/gain-node";
import {IAudioContext} from "standardized-audio-context";
import {IMediaStreamAudioSourceNode} from "standardized-audio-context/src/interfaces/media-stream-audio-source-node";

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
    producer: IAudioProducer;
}) => {
    const audioRef = useRef<HTMLAudioElement>();
    const {audioContext} = useAudioContext();
    const [streamSource, setStreamSource] = useState<IMediaStreamAudioSourceNode<IAudioContext>>(undefined);
    const [gainNode, setGainNode] = useState<IGainNode<IAudioContext>>(undefined);
    const [volume, setVolume] = useState<number>(props.producer.volume * 100);

    useEffect(() => {
        if (audioContext) {
            if (props.producer.consumer) {
                const streamSource = audioContext.createMediaStreamSource(new MediaStream([props.producer.consumer.track]));
                const gainNode = audioContext.createGain();
                streamSource.connect(gainNode);
                gainNode.connect(audioContext.destination);
                setGainNode(gainNode);
                setStreamSource(streamSource);
            } else {
                if (streamSource) {
                    streamSource.disconnect();
                }
                if (gainNode) {
                    gainNode.disconnect();
                }
                setGainNode(undefined);
                setStreamSource(undefined);
            }
        }
    }, [props.producer.consumer, audioContext])

    useEffect(() => {
        if (audioRef && streamSource) {
            audioRef.current.srcObject = streamSource.mediaStream;
        } else {
            audioRef.current.srcObject = undefined;
        }
    }, [audioRef, streamSource]);

    useEffect(() => {
        // Update gain node
        if (audioContext && gainNode) {
            console.log(props.globalVolume);
            console.log(props.producer.volume);
            const realVolume = props.globalVolume * props.producer.volume;
            console.log(realVolume);
            gainNode.gain.setValueAtTime(realVolume, audioContext.currentTime);
        }
    }, [props.producer.volume, props.globalVolume, gainNode, audioContext]);

    return (
        <SliderWrapper>
            <HiddenAudioPlayer ref={audioRef}/>
            <VolumeSlider min={0} max={1} step={0.1} value={props.producer.volume}
                          onChange={v => props.producer.setVolume(v)}/>
        </SliderWrapper>
    );
}

export default (props: {
    member: IMember
}) => {
    const hoverRef: MutableRefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const hovered = useHover<HTMLDivElement>(hoverRef);

    //TODO: For later, when Chromium fixed this bug: https://bugs.chromium.org/p/chromium/issues/detail?id=933677
    /*
    useEffect(()=> {
        props.member.globalGain.gain.setValueAtTime(globalVolume, props.member.globalGain.context.currentTime);
    }, [globalVolume]);*/

    console.log("GLOBAL VOLUME: " + props.member.volume);

    return (
        <>
            <SliderOverlay ref={hoverRef}>
                <SliderPopout $hovered={hovered}>
                    {props.member.soundjacks.map((soundjack: ISoundjack) => (
                        <VolumeSlider min={0} max={1} step={0.1} value={soundjack.volume}
                                      onChange={v => soundjack.setVolume(v)}/>
                    ))}
                    {props.member.audioProducers.map((producer: IAudioProducer) => (
                        <MediasoupAudioSlider key={producer.id} globalVolume={props.member.volume}
                                              producer={producer}/>
                    ))}
                </SliderPopout>
                {props.member.audioProducers.length > 0 || props.member.soundjacks.length > 0 && (
                    <SliderWrapper>
                        <VolumeSlider min={0} max={1} step={0.1} value={props.member.volume}
                                      onChange={v => props.member.setVolume(v)}/>
                    </SliderWrapper>
                )}
            </SliderOverlay>
        </>
    );
};
