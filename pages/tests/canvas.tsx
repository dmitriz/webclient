import React, {useCallback, useEffect, useState} from "react";
import CanvasPlayer from "../../components/CanvasPlayer";
import {Button} from "baseui/button";

export default () => {
    const [tracks, setTracks] = useState<MediaStreamTrack[]>([]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        }).then((stream) => {
            stream.getVideoTracks().forEach((track: MediaStreamTrack) => setTracks(prevState => [...prevState, track]));
        })
    }, []);

    const duplicateTrack = useCallback(() => {
        setTracks(prevState => [...prevState, prevState[0].clone()])
    }, []);

    return <div>
        <Button onClick={duplicateTrack}>Duplicate track</Button>
        <CanvasPlayer width={600} height={400} videoTracks={tracks}/>
    </div>
}
