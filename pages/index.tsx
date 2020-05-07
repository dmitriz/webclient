import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import Layout from "../components/theme/Layout";
import Loading from "../components/theme/Loading";
import {FormControl} from "baseui/form-control";
import {useCallback, useEffect, useState} from "react";
import {Input} from "baseui/input";
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

const removeTrackFromStream = (stream: MediaStream, track: MediaStreamTrack): MediaStream => {
    stream.removeTrack(track);
    return stream;
};
const addTrackToStream = (stream: MediaStream, track: MediaStreamTrack): MediaStream => {
    stream.addTrack(track);
    console.log("Added track: ");
    console.log(track);
    return stream;
};

export default () => {
    const router = useRouter();
    const {user, loading} = useAuth();
    const [stageId, setStageId] = useState<string>("VmaFVwEGz9CO7odY0Vbw");
    const [password, setPassword] = useState<string>("hello");
    const {connected, stage, join} = useConnector({user});

    // Streaming
    const [webRTCStream, setWebRTCStream] = useState<MediaStream>();
    const [mediasoupStream, setMediasoupStream] = useState<MediaStream>();
    const {} = useWebRTC({localStream: webRTCStream});
    const {} = useMediasoup({localStream: mediasoupStream});

    // Streaming video/audio distribution
    const [localAudioStream, setLocalAudioStream] = useState<MediaStream>();
    const [localVideoStream, setLocalVideoStream] = useState<MediaStream>();
    const [videoTransferMethod, setVideoTransferMethod] = useState<Value>([VideoTransferOptions[0]]);
    const [audioTransferMethod, setAudioTransferMethod] = useState<Value>([AudioTransferOptions[0]]);

    useEffect(() => {
        setLocalAudioStream(new MediaStream());
        setLocalVideoStream(new MediaStream());
        setWebRTCStream(new MediaStream());
        setMediasoupStream(new MediaStream());
    }, []);

    useEffect(() => {
        if (localVideoStream)
            localVideoStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
                if (videoTransferMethod[0].id === "p2p") {
                    console.log("Set to webrtc");
                    setMediasoupStream(prev => removeTrackFromStream(prev, track));
                    setWebRTCStream(prev => {
                        prev.addTrack(track);
                        return prev;
                    });
                } else {
                    setMediasoupStream(prev => addTrackToStream(prev, track));
                    setWebRTCStream(prev => removeTrackFromStream(prev, track));
                }
            });
    }, [localVideoStream, videoTransferMethod]);

    useEffect(() => {
        console.log("update");
    }, [webRTCStream]);

    useEffect(() => {
        if (localAudioStream)
            localAudioStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
                if (audioTransferMethod[0].id === "p2p") {
                    console.log("Set to webrtc");
                    setMediasoupStream(prev => removeTrackFromStream(prev, track));
                    setWebRTCStream(prev => addTrackToStream(prev, track));
                } else if (audioTransferMethod[0].id === "mediasoup") {
                    setMediasoupStream(prev => addTrackToStream(prev, track));
                    setWebRTCStream(prev => removeTrackFromStream(prev, track));
                } else {
                    // Soundjack
                    setMediasoupStream(prev => removeTrackFromStream(prev, track));
                    setWebRTCStream(prev => removeTrackFromStream(prev, track));
                }
            });
    }, [localAudioStream, videoTransferMethod]);

    const joinStage = useCallback(() => {
        if (user && connected) {
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
                .then((mediaStream: MediaStream) => {
                    mediaStream.getAudioTracks().forEach((track: MediaStreamTrack) => localAudioStream.addTrack(track));
                    mediaStream.getVideoTracks().forEach((track: MediaStreamTrack) => localVideoStream.addTrack(track));

                    mediaStream.getVideoTracks().forEach((track: MediaStreamTrack) => webRTCStream.addTrack(track));

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
