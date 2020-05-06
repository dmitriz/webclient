import Layout from "./theme/Layout";
import {useCallback, useEffect, useState} from "react";
import {useStageController} from "../lib/digitalstage/useStage";
import {Button} from "baseui/button";
import Video from "./video/Video";
import {useAuth} from "../lib/useAuth";

export default (props: {}) => {
    const {user} = useAuth();
    const {stage, publishTrack, unpublishTrack} = useStageController({user});
    const [useP2P, setP2P] = useState<boolean>();
    const [localStream, setLocalStream] = useState<MediaStream>();

    useEffect(() => {
        if (localStream) {
            localStream.getTracks().forEach((track: MediaStreamTrack) => {
                publishTrack(track);
            })
        }
    }, [localStream]);

    const publish = useCallback(() => {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
            .then((mediaStream: MediaStream) => setLocalStream(mediaStream))
    }, []);

    return (
        <Layout>
            <Button onClick={() => publish()}>PUBLISH</Button>
            <h1>{stage.name}</h1>
            <div>
                {Object.keys(stage.participants).map((userId: string) => (
                    <div>
                        {stage.participants[userId].stream.getTracks().length > 0 && (
                            <Video id={userId} stream={stage.participants[userId].stream}/>
                        )}
                    </div>
                ))}
            </div>
            <p>
                {Object.keys(stage.participants).length} Participants
            </p>
        </Layout>
    )
}
