import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {Button} from "baseui/button";
import React, {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/router";
import useConnection from "../lib/communication/useConnection";
import {useAuth} from "../lib/useAuth";
import {fixWebRTC} from "../util/fixWebRTC";
import * as config from "../env";
import Loading from "../components/ui/Loading";
import Layout from "../components/ui/Layout";
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
    const {user, loading} = useAuth();
    const {connect, createStage, stage, participants, publishTrack} = useConnection();
    const [stageName, setStageName] = useState<string>("stage1");
    const router = useRouter();
    const [localStream, setLocalStream] = useState<MediaStream>();
    const [notificationVisible, setNotificationVisible] = useState<boolean>();
    const [password, setPassword] = useState<string>("");

    useEffect(() => {
        if (stage && notificationVisible) {
            setDarkMode(true);
        } else {
            setDarkMode(false);
        }
    }, [stage, notificationVisible]);

    const create = useCallback(() => {
        navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream: MediaStream) => {
                setLocalStream(stream);
                createStage(user, stageName, password).then(() => {
                    stream.getTracks().forEach((track: MediaStreamTrack) => publishTrack(track, "mediasoup"));
                })
            });
    }, [user, stageName, password]);

    useEffect(() => {
        if (user) {
            fixWebRTC();
            connect(config.SERVER_URL, parseInt(config.SERVER_PORT));
        }
    }, [connect, user]);

    if (loading) {
        return (
            <Loading><h1>Loading</h1></Loading>
        )
    }
    if (!user) {
        router.push("/login");
    }

    if (!stage) {
        return (
            <Layout>
                <h1>Create stage</h1>
                <FormControl label={"Stage name"}>
                    <Input value={stageName} onChange={e => setStageName(e.currentTarget.value)}/>
                </FormControl>
                <FormControl label={"Passwort"}
                             caption={"Optional"}>
                    <Input type="password" value={password} onChange={e => setPassword(e.currentTarget.value)}/>
                </FormControl>
                <Button onClick={create}>Create</Button>
            </Layout>
        );
    }

    if (notificationVisible) {
        return (
            <Layout>
                <h1>Stage</h1>
                <p>
                    Share this id:
                </p>
                <p>
                    <li>
                        ID: {stage.id}
                    </li>
                    {stage.password && (
                        <li>Password: {stage.password}</li>
                    )}
                </p>
                <Button onClick={() => setNotificationVisible(false)}>Enter stage</Button>
            </Layout>
        )
    }

    return (
        <Layout>
            <Background $darkMode={darkMode}/>
            <StageView stage={stage} participants={participants}/>
            {localStream && <CornerVideo stream={localStream}/>}
        </Layout>
    )
};
