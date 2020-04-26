import {useAuth} from "../lib/useAuth";
import {useRouter} from "next/router";
import Loading from "../components/ui/Loading";
import * as React from "react";
import {useCallback, useEffect, useState} from "react";
import Layout from "../components/ui/Layout";
import {Button} from "baseui/button";
import * as config from "../env";
import {fixWebRTC} from "../util/fixWebRTC";
import VideoPlayer from "../components/video/VideoPlayer";
import useConnection from "../lib/communication/useConnection";
import {Participant} from "../lib/communication/Connection";
import CanvasPlayer from "../components/video/CanvasPlayer";
import {useDarkModeSwitch} from "../lib/useDarkModeSwitch";
import {styled} from "baseui";
import VideoTrackPlayer from "../components/video/VideoTrackPlayer";

const CornerVideo = styled(VideoPlayer, {
    position: 'fixed',
    bottom: '1vmin',
    right: '1vmin',
    maxWidth: '300px',
    maxHeight: '200px',
    height: '30vmin',
    width: '30vmin',
    objectPosition: 'bottom',
    zIndex: 999
});
const Background = styled('div', (props: {
        $darkMode: boolean
    }) => ({
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        backgroundColor: props.$darkMode ? 'black' : 'white'
    }))
;

const TextWrapper = styled('div', (props: {
    $darkMode: boolean
}) => ({
    color: props.$darkMode ? "white" : "black"
}));

export default () => {
    const {darkMode, setDarkMode} = useDarkModeSwitch();
    const {user, loading} = useAuth();
    const router = useRouter();
    const [localStream, setLocalStream] = useState<MediaStream>();
    const {connect, connected, createStage, joinStage, stage, participants, publishTrack} = useConnection();

    const shareMedia = useCallback(() => {
        fixWebRTC();
        navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream: MediaStream) => {
                setLocalStream(stream);
            });
    }, []);

    useEffect(() => {
        if (connected) {
            setDarkMode(true);
        } else {
            setDarkMode(false);
        }
    }, [connected]);

    useEffect(() => {
        if (connected && stage && localStream) {
            localStream.getTracks().forEach((track: MediaStreamTrack) => publishTrack(track, "mediasoup"));
        }
    }, [localStream, connected, stage]);


    // Rendering webpage depending to states:

    if (loading) {
        return (
            <Loading><h1>Loading</h1></Loading>
        )
    }

    if (!user) {
        router.push("/login");
    }

    return (
        <Layout>
            <Background $darkMode={darkMode}/>
            <div>
                {!connected &&
                <Button onClick={() => connect(config.SERVER_URL, parseInt(config.SERVER_PORT))}>Connect</Button>}
                {connected && !stage &&
                <Button onClick={() => joinStage(user, "VmaFVwEGz9CO7odY0Vbw", "hello")}>Join</Button>}
                {!localStream && <Button onClick={shareMedia}>Share media</Button>}
            </div>
            {participants && participants.length > 0 && (
                <TextWrapper $darkMode={darkMode}>
                    <h2>Participants</h2>
                    <ul>
                        {participants.map((participant: Participant) => (<li>{participant.name}</li>))}
                    </ul>
                    <CanvasPlayer
                        videoTracks={participants.flatMap((participants: Participant) => participants.tracks.filter((track: MediaStreamTrack) => track.kind === "video"))}/>
                </TextWrapper>
            )}
            {localStream && <CornerVideo stream={localStream}/>}
        </Layout>
    );
}
