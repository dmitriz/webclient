import React, {useEffect, useRef} from "react";
import {styled} from "baseui";
import {Slider} from "baseui/slider";

const Wrapper = styled("div", {
    position: 'relative',
    border: '1px solid white',
});
const OverlayControls = styled("div", {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 'auto',
    zIndex: 10
});

export default (props: {
    stream: MediaStream,
    gainNode?: GainNode,
    muted?: boolean,
    className?: string,
    id: string
}) => {
    const [value, setValue] = React.useState([props.gainNode ? props.gainNode.gain.value : 1]);
    const videoRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        if (props.stream) {
            videoRef.current.srcObject = props.stream;
        }
        return () => {
            videoRef.current.srcObject = null;
        };
    }, [props.stream]);

    useEffect(() => {
        if (props.gainNode)
            props.gainNode.gain.setValueAtTime(value[0], props.gainNode.context.currentTime)
    }, [value]);

    return (
        <Wrapper>
            <video className={props.className} id={props.id} ref={videoRef} muted={props.muted} autoPlay={true}
                   playsInline={true}/>
            {props.gainNode && (
                <OverlayControls>
                    <Slider
                        value={value}
                        onChange={({value}) => value && setValue(value)}
                        max={1}
                        step={0.01}
                    />
                </OverlayControls>
            )}
        </Wrapper>
    );
}
