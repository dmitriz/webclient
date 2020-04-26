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

export default () => {
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
        if (connected && stage && localStream) {
            localStream.getTracks().forEach((track: MediaStreamTrack) => publishTrack(track, "p2p"));
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
            <div>
                {!connected &&
                <Button onClick={() => connect(config.SERVER_URL, parseInt(config.SERVER_PORT))}>Connect</Button>}
                {connected &&
                <Button onClick={() => joinStage(user, "VmaFVwEGz9CO7odY0Vbw", "hello")}>Join</Button>}
                {!localStream && <Button onClick={shareMedia}>Share media</Button>}
            </div>
            <div>
                {localStream && <VideoPlayer stream={localStream}/>}
            </div>
            <h2>Participants</h2>
            <ul>
                {participants && participants.map((participant: Participant) => (<li>{participant.name}</li>))}
            </ul>
            {participants && (
                <CanvasPlayer width={400} height={300} videoTracks={participants.flatMap(p => p.tracks)}/>
            )}
        </Layout>
    );
}
