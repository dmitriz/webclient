import {styled} from "baseui";
import React, {useEffect, useRef, useState} from "react";
import {IGainNode} from "standardized-audio-context/src/interfaces/gain-node";
import {IAudioContext} from "standardized-audio-context";
import {useAudioContext} from "../../lib/useAudioContext";

const HiddenAudioPlayer = styled("audio", {})

export const AudioPlayer = (props: {
    track?: MediaStreamTrack,
    trackVolume: number;
    masterVolume: number;
}) => {
    const audioRef = useRef<HTMLAudioElement>();
    const {audioContext} = useAudioContext();
    const [gainNode, setGainNode] = useState<IGainNode<IAudioContext>>(undefined);

    useEffect(() => {
        if (props.track && audioContext) {
            const source = audioContext.createMediaStreamTrackSource(props.track);
            const gainNode = audioContext.createGain();
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            setGainNode(gainNode);
            audioRef.current.srcObject = new MediaStream([props.track]);
        }
    }, [props.track, audioContext])

    useEffect(() => {
        if (gainNode && audioContext) {
            gainNode.gain.setValueAtTime(props.masterVolume * props.trackVolume, audioContext.currentTime);
        }
    }, [gainNode, audioContext, props.trackVolume, props.masterVolume])

    return (
        <HiddenAudioPlayer ref={audioRef}/>
    )
}
