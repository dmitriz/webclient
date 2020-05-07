import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import Layout from "../components/theme/Layout";
import Loading from "../components/theme/Loading";
import {FormControl} from "baseui/form-control";
import {useCallback, useState} from "react";
import {Input} from "baseui/input";
import {Button, SIZE} from "baseui/button";
import useConnector from "../lib2/useConnector";
import useWebRTC from "../lib2/useWebRTC";
import useMediasoup from "../lib2/useMediasoup";
import {Participant} from "../lib/digitalstage/model";
import Video from "../components/video/Video";

export default () => {
    const router = useRouter();
    const {user, loading} = useAuth();
    const [stageId, setStageId] = useState<string>("VmaFVwEGz9CO7odY0Vbw");
    const [password, setPassword] = useState<string>("hello");
    const [localStream, setLocalStream] = useState<MediaStream>();
    const {connected, stage, join, create} = useConnector({user});
    const {} = useWebRTC({localStream});
    const {} = useMediasoup({localStream});

    const joinStage = useCallback(() => {
        if (user && connected) {
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
                .then((mediaStream: MediaStream) => {
                    setLocalStream(mediaStream);
                    join(stageId, password)
                        .then(() => {
                            console.log("joined");
                        })
                });
        }
    }, [user, connected]);


    if (loading) {
        return (
            <Loading><h1>Loading</h1></Loading>
        )
    }

    if (!user) {
        router.push("/login");
    }

    if (stage) {
        console.log(stage)
    }


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
            <Button disabled={!connected} onClick={joinStage} size={SIZE.large}>
                Join
            </Button>
            {stage && (
                <div>
                    <h1>{stage.name}</h1>
                    {Object.values(stage.participants).map((participant: Participant) => (
                        <li key={participant.userId}>
                            <strong>{participant.displayName}</strong>
                            <p>{participant.stream.getTracks().length} Streams</p>
                            <Video id={participant.userId} stream={participant.stream}/>
                        </li>
                    ))}
                </div>
            )}
        </Layout>
    );
}
