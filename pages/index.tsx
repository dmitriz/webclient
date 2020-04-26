import * as React from "react";
import {useCallback, useEffect, useState} from "react";
import Layout from "../components/ui/Layout";
import {useAuth} from "../lib/useAuth";
import Loading from "../components/ui/Loading";
import {useRouter} from "next/router";
import useConnection from "../lib/communication/useConnection";
import * as config from "../env";
import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {Button, SIZE} from "baseui/button";
import StageView from "../components/StageView";
import {styled} from "baseui";
import VideoPlayer from "../components/video/VideoPlayer";
import {useDarkModeSwitch} from "../lib/useDarkModeSwitch";

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
}));
export default () => {
    const {darkMode, setDarkMode} = useDarkModeSwitch();
    const router = useRouter();
    const [stageId, setStageId] = useState<string>("VmaFVwEGz9CO7odY0Vbw");
    const [password, setPassword] = useState<string>("hello");
    const {user, loading} = useAuth();
    const [localStream, setLocalStream] = useState<MediaStream>();
    const {connect, joinStage, stage, participants, publishTrack} = useConnection();

    useEffect(() => {
        if (stage) {
            setDarkMode(true);
        } else {
            setDarkMode(false);
        }
    }, [stage]);

    useEffect(() => {
        connect(config.SERVER_URL, parseInt(config.SERVER_PORT));
    }, [connect]);

    const join = useCallback(() => {
        navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream: MediaStream) => {
                setLocalStream(stream);
                joinStage(user, stageId, password).then(() => {
                    stream.getTracks().forEach((track: MediaStreamTrack) => publishTrack(track, "mediasoup"));
                })
            });
    }, [user, stageId, password]);


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
            {stage ? (
                <>
                    <StageView stage={stage} participants={participants}/>
                    {localStream && <CornerVideo stream={localStream}/>}
                </>
            ) : (
                <>
                    <h1>Join stage</h1>
                    <FormControl label={"Stage ID"}>
                        <Input value={stageId} onChange={e => setStageId(e.currentTarget.value)}/>
                    </FormControl>
                    <FormControl label={"Passwort"}
                                 caption={"Ask your director or creator of the stage for the password"}>
                        <Input type="password" value={password} onChange={e => setPassword(e.currentTarget.value)}/>
                    </FormControl>
                    <Button onClick={join} size={SIZE.large}>
                        Join
                    </Button>
                </>
            )}
        </Layout>
    )
}
