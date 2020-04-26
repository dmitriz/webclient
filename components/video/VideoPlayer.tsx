import React, {useEffect, useRef} from "react";
import {styled} from "baseui";

const Video = styled('video', {
    backgroundColor: 'black'
});

export default (props: {
    stream: MediaStream;
    className?: string;
}) => {
    const videoRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        videoRef.current.srcObject = props.stream;
    }, [props.stream]);

    return (
        <Video className={props.className} ref={videoRef} autoPlay={true} muted={true} playsInline={true}/>
    )
};

