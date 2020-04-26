import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {Button} from "baseui/button";
import React, {useEffect, useState} from "react";
import {useRouter} from "next/router";
import useConnection from "../lib/communication/useConnection";
import {useAuth} from "../lib/useAuth";
import {fixWebRTC} from "../util/fixWebRTC";
import * as config from "../env";
import Loading from "../components/ui/Loading";
import Layout from "../components/ui/Layout";
import CanvasPlayer from "../components/video/CanvasPlayer";
import {Participant} from "../lib/communication/Connection";

export default () => {
    const {user, loading} = useAuth();
    const {connect, connected, createStage, joinStage, stage, participants, publishTrack} = useConnection();
    const [stageName, setStageName] = useState<string>("stage1");
    const router = useRouter();
    const [notificationVisible, setNotificationVisible] = useState<boolean>();
    const [password, setPassword] = useState<string>("");


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
        router.push("/stage/login");
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
                <Button onClick={() => createStage(user, stageName, password)}>Create</Button>
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
            <CanvasPlayer
                videoTracks={participants.flatMap((participants: Participant) => participants.tracks.filter((track: MediaStreamTrack) => track.kind === "video"))}/>
                
        </Layout>
    );

};
