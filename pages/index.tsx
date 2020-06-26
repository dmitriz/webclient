import React, {useEffect, useRef, useState} from "react";
import {styled} from "baseui";
import {IGainNode} from "standardized-audio-context/src/interfaces/gain-node";
import {IAudioContext} from "standardized-audio-context";
import {useAudioContext} from "../lib/useAudioContext";
import useDigitalStage, {IAudioProducer} from "../lib/useDigitalStage";
import VideoTrackPlayer from "../components/video/VideoTrackPlayer";
import VolumeSlider from "../components/audio/VolumeSlider";
import {Button} from "baseui/button";
import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";

const HiddenAudioPlayer = styled("audio", {})
const AudioPlayer = (props: {
    track?: MediaStreamTrack,
    trackVolume: number;
    masterVolume: number;
}) => {
    const audioRef = useRef<HTMLAudioElement>();
    const {audioContext} = useAudioContext();
    const [gainNode, setGainNode] = useState<IGainNode<IAudioContext>>(undefined);

    useEffect(() => {
        if (props.track && audioContext) {
            const source = audioContext.createMediaStreamTrackSource(props.track);
            const gainNode = audioContext.createGain();
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            setGainNode(gainNode);
            audioRef.current.srcObject = new MediaStream([props.track]);
        }
    }, [props.track, audioContext])

    useEffect(() => {
        if (gainNode && audioContext) {
            gainNode.gain.setValueAtTime(props.masterVolume * props.trackVolume, audioContext.currentTime);
        }
    }, [gainNode, audioContext, props.trackVolume, props.masterVolume])

    return (
        <HiddenAudioPlayer ref={audioRef}/>
    )
}

export default () => {
    const {user, loading: userLoading} = useAuth();
    const router = useRouter();
    const {stage, devices, localDevice, connected, connect, disconnect, loading} = useDigitalStage();

    useEffect(() => {
        if( !user && !userLoading ) {
            router.push("/login");
        }
    }, [user, userLoading])


    useEffect(() => {
        if( connected && !stage ) {
            router.push("/join");
        }
    }, [stage, connected]);

    return (
        <div>
            {loading && <h1>Loading</h1>}
            {connect && disconnect && (
                <p>
                    <Button onClick={() => {
                        if (connected) {
                            disconnect()
                        } else {
                            connect()
                        }
                    }}>{connected ? "Disconnect" : "Connect"}</Button>
                </p>
            )}
            {stage ? (

                <ul>
                    {stage.members && stage.members.map((m) => (
                        <li key={m.uid}>
                            <h5>Name: {m.name} ({m.online ? "online" : "offline"})</h5>
                            <ul>
                                <li>
                                    {m.videoProducers.length} Video Producers
                                    {m.videoProducers.length > 0 && (
                                        <ul>
                                            {m.videoProducers.map(vp => (
                                                <li key={vp.id}>
                                                    <ul>
                                                        <li>
                                                            ID: {vp.id}
                                                        </li>
                                                        {vp.consumer && (
                                                            <li>
                                                                <VideoTrackPlayer track={vp.consumer.track}/>
                                                            </li>
                                                        )}
                                                    </ul>

                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                                <li>
                                    {m.audioProducers.length} Audio Producers
                                    {m.audioProducers.length > 0 && (
                                        <ul>
                                            {m.audioProducers.map((ap: IAudioProducer) => (
                                                <li key={ap.id}>
                                                    <ul>
                                                        <li>
                                                            ID: {ap.id} Volume: {ap.volume}
                                                        </li>
                                                        <li>
                                                            <VolumeSlider
                                                                min={0}
                                                                max={1}
                                                                step={0.1}
                                                                value={ap.volume}
                                                                onChange={e => ap.setVolume(e)}/>
                                                        </li>
                                                        {ap.consumer && (
                                                            <li>
                                                                <AudioPlayer masterVolume={m.volume}
                                                                             trackVolume={ap.volume}
                                                                             track={ap.consumer.track}
                                                                />
                                                            </li>
                                                        )}
                                                    </ul>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                                <li>
                                    {m.soundjacks.length} Soundjacks
                                    {m.soundjacks.length > 0 && (
                                        <ul>
                                            {m.soundjacks.map(soundjack => (
                                                <li key={soundjack.id}>
                                                    <VolumeSlider
                                                        min={0}
                                                        max={1}
                                                        step={0.1}
                                                        value={soundjack.volume}
                                                        onChange={e => soundjack.setVolume(e)}/>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            </ul>
                            <VolumeSlider
                                min={0}
                                max={1}
                                step={0.1}
                                value={m.volume}
                                onChange={e => m.setVolume(e)}/>
                        </li>
                    ))}
                </ul>
            ) : "No stage available"}

            {localDevice && (
                <>
                    <h1>LOCAL DEVICE</h1>
                    <span>{localDevice.id}</span>
                    {localDevice.connected && (
                        <ul>
                            <li>
                                Send Audio <input type="checkbox" checked={localDevice.sendAudio}
                                                  onChange={e => localDevice.setSendAudio(e.currentTarget.checked)}/>
                            </li>
                            <li>
                                Send Video <input type="checkbox" checked={localDevice.sendVideo}
                                                  onChange={e => localDevice.setSendVideo(e.currentTarget.checked)}/>
                            </li>
                            <li>
                                Receive Audio <input type="checkbox" checked={localDevice.receiveAudio}
                                                     onChange={e => localDevice.setReceiveAudio(e.currentTarget.checked)}/>
                            </li>
                            <li>
                                Receive Video <input type="checkbox" checked={localDevice.receiveVideo}
                                                     onChange={e => localDevice.setReceiveVideo(e.currentTarget.checked)}/>
                            </li>
                        </ul>
                    )}
                </>
            )}

            <>
                <h1>ALL DEVICE</h1>
                <ul>
                    {devices.map(device => (
                        <li key={device.id}>
                            <h3>{device.id}: {device.caption}</h3>
                            <h4>{device.isRemote ? "Remote" : "Local"}</h4>
                            <ul>
                                <li>
                                    Send Audio <input type="checkbox" checked={device.sendAudio}
                                                      onChange={e => device.setSendAudio(e.currentTarget.checked)}/>
                                </li>
                                <li>
                                    Send Video <input type="checkbox" checked={device.sendVideo}
                                                      onChange={e => device.setSendVideo(e.currentTarget.checked)}/>
                                </li>
                                <li>
                                    Receive Audio <input type="checkbox" checked={device.receiveAudio}
                                                         onChange={e => device.setReceiveAudio(e.currentTarget.checked)}/>
                                </li>
                                <li>
                                    Receive Video <input type="checkbox" checked={device.receiveVideo}
                                                         onChange={e => device.setReceiveVideo(e.currentTarget.checked)}/>
                                </li>
                            </ul>
                        </li>
                    ))}
                </ul>
            </>
        </div>
    );
}
