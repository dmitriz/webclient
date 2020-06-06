import {useCallback, useEffect, useState} from "react";
import {AudioContext, IAudioBufferSourceNode, IAudioContext} from "standardized-audio-context";
import webAudioTouchUnlock from "../webAudioTouchUnlock";
import {useAudioContext} from "../useAudioContext";

// Some global settings
const freq = 600;
const firstFreq = 800;
const CLICK_LENGTH = 0.05;    // in seconds


export interface TimeSignature {
    beats: number,
    measure: number
}

export const generateClick = (context: IAudioContext, bpm: number, timeSignature: TimeSignature): AudioBuffer => {
    const noteTimeEachQuarter = (60 / bpm);
    const noteTimeEachBeat = noteTimeEachQuarter / (timeSignature.measure / 4);
    const clickBuffer = context.createBuffer(1, context.sampleRate * noteTimeEachBeat * timeSignature.beats, context.sampleRate);
    const channelData = clickBuffer.getChannelData(0);
    const noteTimeInBuffer = clickBuffer.length / timeSignature.beats;
    const clickLength = context.sampleRate * CLICK_LENGTH;

    for (let beat = 0; beat < timeSignature.beats; beat++) {
        const offset: number = Math.ceil(noteTimeInBuffer * beat);
        for (let i = 0; i < clickLength; i++) {
            if (beat === 0) {
                // First beat
                channelData[i + offset] = Math.sin(i * 2 * Math.PI * firstFreq / context.sampleRate);
            } else {
                channelData[i + offset] = Math.sin(i * 2 * Math.PI * freq / context.sampleRate);
            }
        }
    }
    return clickBuffer;
};

const calculateNextStartTime = (startTime: number, offset: number = 0, bpm: number, timeSignature: TimeSignature): number => {
    const timeBarMs = ((60 / bpm) / (timeSignature.measure / 4)) * timeSignature.beats * 1000;
    const now = Date.now() + offset;  // Add one second delay
    if (startTime < now) {
        // Start time is in past
        return (timeBarMs - ((now - startTime) % timeBarMs)) / 1000;
    }
    // Start time is in future
    return (startTime - now) / 1000;
};

export default (props: {
    bpm: number,
    timeSignature: TimeSignature
    startTime?: number,
    offset?: number,
    target?: AudioNode,
}) => {
    const {audioContext, createAudioContext} = useAudioContext();
    const [playing, setPlaying] = useState<boolean>(false);
    const [buffer, setBuffer] = useState<IAudioBufferSourceNode<IAudioContext>>();
    const [enabled, setEnabled] = useState<boolean>(false);

    const enableClick = useCallback(async() => {
        let audioCtx = audioContext;
        if( !audioCtx ) {
            audioCtx = await createAudioContext();
        }
        const source: IAudioBufferSourceNode<IAudioContext> = audioCtx.createBufferSource();
        source.connect(audioCtx.destination);
        source.loop = true;
        source.buffer = generateClick(audioCtx, 120, {
            beats: 4,
            measure: 4
        });
        setBuffer(source);
        setEnabled(true);
    },[]);

    const startInternal = useCallback(() => {
        if( audioContext ) {
            const nextStartTime = audioContext.currentTime + calculateNextStartTime(props.startTime, props.offset, props.bpm, props.timeSignature);
            buffer.start(nextStartTime);
        }
    }, [props.startTime, props.bpm, props.timeSignature, props.offset, audioContext]);

    useEffect(() => {
        if (playing) {
            if (audioContext) {
                startInternal();
            }
        } else {
            if (buffer && buffer.buffer != null) {
                buffer.stop();
            }
            // And recreate buffer
            if (audioContext) {
                const source: IAudioBufferSourceNode<IAudioContext> = audioContext.createBufferSource();
                source.connect(audioContext.destination);
                source.loop = true;
                source.buffer = generateClick(audioContext, 120, {
                    beats: 4,
                    measure: 4
                });
                setBuffer(source);
            }
        }
    }, [playing]);

    return {
        enabled,
        enableClick,
        start: () => !playing && setPlaying(true),
        restart: () => setPlaying(true),
        stop: () => setPlaying(false),
        playing,
        setPlaying
    }
}
