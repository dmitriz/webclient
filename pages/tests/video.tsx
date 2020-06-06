import {useEffect, useState} from "react";
import VideoTrackPlayer from "../../components/stage/video/VideoTrackPlayer";

export default () => {
    const [tracks, setTracks] = useState<MediaStreamTrack[]>([]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        }).then((stream) => {
            stream.getVideoTracks().forEach((track: MediaStreamTrack) => setTracks(prevState => [...prevState, track]));
        })
    }, [])

    return <div>
        {tracks.map((track) => <VideoTrackPlayer track={track}/>)}
    </div>
}
