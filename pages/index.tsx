import * as React from "react";
import Layout from "../components/ui/Layout";
import {useAuth} from "../lib/useAuth";
import Loading from "../components/ui/Loading";
import {useRouter} from "next/router";
import {useState} from "react";
import useConnection from "../lib/communication/useConnection";
import {useEffect} from "react";
import * as config from "../env";
import {useCallback} from "react";
import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {Button, SIZE} from "baseui/button";
import StageView from "../components/StageView";

export default () => {
    const router = useRouter();
    const [stageId, setStageId] = useState<string>("VmaFVwEGz9CO7odY0Vbw");
    const [password, setPassword] = useState<string>("hello");
    const {user, loading} = useAuth();
    const [localStream, setLocalStream] = useState<MediaStream>();
    const {connect, connected, createStage, joinStage, stage, participants, publishTrack} = useConnection();

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

    if (!stage)
        return (
            <Layout>
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
            </Layout>
        );

    return (
        <Layout>
            <StageView stage={stage} participants={participants}/>
        </Layout>
    )
}
