import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import Layout from "../components/theme/Layout";
import Loading from "../components/theme/Loading";
import {FormControl} from "baseui/form-control";
import {useCallback, useEffect, useState} from "react";
import {Input} from "baseui/input";
import omit from 'lodash.omit';
import {Button, SIZE} from "baseui/button";
import useConnector from "../lib/useConnector";
import useWebRTC from "../lib/useWebRTC";
import useMediasoup from "../lib/useMediasoup";
import {Participant} from "../lib/model";
import Video from "../components/video/Video";
import {Select, Value} from "baseui/select";

const VideoTransferOptions: Value = [
    {label: "WebRTC P2P", id: "p2p"},
    {label: "Mediasoup", id: "mediasoup"}
];
const AudioTransferOptions: Value = [
    {label: "WebRTC P2P", id: "p2p"},
    {label: "Mediasoup", id: "mediasoup"},
    {label: "Soundjack", id: "soundjack"}
];

export default () => {
    const router = useRouter();
    const {user, loading} = useAuth();
    const [stageId, setStageId] = useState<string>("VmaFVwEGz9CO7odY0Vbw");
    const [password, setPassword] = useState<string>("hello");
    const {connected, stage, join} = useConnector({user});

    // Streaming
    const [webRTCTracks, setWebRTCTracks] = useState<{
        [trackId: string]: MediaStreamTrack
    }>();
    const [mediasoupTracks, setMediasoupTracks] = useState<{
        [trackId: string]: MediaStreamTrack
    }>();
    const {} = useWebRTC({tracks: webRTCTracks});
    const {} = useMediasoup({tracks: mediasoupTracks});

    // Streaming video/audio distribution
    const [localAudioTracks, setLocalAudioTracks] = useState<{
        [trackId: string]: MediaStreamTrack
    }>();
    const [localVideoStream, setLocalVideoStream] = useState<{
        [trackId: string]: MediaStreamTrack
    }>();
    const [videoTransferMethod, setVideoTransferMethod] = useState<Value>([VideoTransferOptions[0]]);
    const [audioTransferMethod, setAudioTransferMethod] = useState<Value>([AudioTransferOptions[0]]);

    useEffect(() => {
        if (localVideoStream)
            Object.values(localVideoStream).forEach((track: MediaStreamTrack) => {
                if (videoTransferMethod[0].id === "p2p") {
                    console.log("Set to webrtc");
                    setMediasoupTracks(prev => omit(prev, track.id));
                    setWebRTCTracks(prev => ({...prev, [track.id]: track}));
                } else {
                    setWebRTCTracks(prev => omit(prev, track.id));
                    setMediasoupTracks(prev => ({...prev, [track.id]: track}));
                }
            });
    }, [localVideoStream, videoTransferMethod]);

    useEffect(() => {
        console.log("update");
    }, [webRTCTracks]);

    useEffect(() => {
        if (localAudioTracks)
            Object.values(localAudioTracks).forEach((track: MediaStreamTrack) => {
                if (videoTransferMethod[0].id === "p2p") {
                    console.log("Set to webrtc");
                    setMediasoupTracks(prev => omit(prev, track.id));
                    setWebRTCTracks(prev => ({...prev, [track.id]: track}));
                } else {
                    setWebRTCTracks(prev => omit(prev, track.id));
                    setMediasoupTracks(prev => ({...prev, [track.id]: track}));
                }
            });
    }, [localAudioTracks, videoTransferMethod]);

    const joinStage = useCallback(() => {
        if (user && connected) {
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
                .then((mediaStream: MediaStream) => {
                    mediaStream.getAudioTracks().forEach((track: MediaStreamTrack) => setLocalAudioTracks(prev => ({
                        ...prev,
                        [track.id]: track
                    })));
                    mediaStream.getVideoTracks().forEach((track: MediaStreamTrack) => setLocalVideoStream(prev => ({
                        ...prev,
                        [track.id]: track
                    })));

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
            <Select
                options={VideoTransferOptions}
                value={videoTransferMethod}
                onChange={params => setVideoTransferMethod(params.value)}
            />
            <Select
                options={AudioTransferOptions}
                value={audioTransferMethod}
                onChange={params => setAudioTransferMethod(params.value)}
            />
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
