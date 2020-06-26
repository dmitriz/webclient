import React, {useCallback, useEffect, useState} from "react";
import {Button} from "baseui/button";
import {IVideoProducer} from "../../lib/digitalstage/useStage";
import CanvasPlayer from "../../components/video/CanvasPlayer";

export default () => {
    const [tracks, setTracks] = useState<IVideoProducer[]>([]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        }).then((stream) => {
            stream.getVideoTracks().forEach((track: MediaStreamTrack) => setTracks(prevState => [...prevState, {
                id: "1",
                consumer: {
                    id: "1",
                    track: track
                }
            }]));
        })
    }, []);

    const duplicateTrack = useCallback(() => {
        setTracks(prevState => [...prevState, {
            ...prevState[0],
            id: (parseInt(prevState[0].id) + 1) + ""
        }])
    }, []);

    return <div>
        <Button onClick={duplicateTrack}>Duplicate track</Button>
        <CanvasPlayer width={600} height={400} videoProducers={tracks}/>
    </div>
}
