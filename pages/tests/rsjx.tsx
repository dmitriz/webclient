import React, {useEffect, useRef, useState} from "react";
import {IAudioProducer, useStage} from "../../lib/digitalstage/useStage";
import VolumeSlider from "../../components/theme/VolumeSlider";
import VideoTrackPlayer from "../../components/stage/video/VideoTrackPlayer";
import {useAudioContext} from "../../lib/useAudioContext";
import {styled} from "baseui";
import {IGainNode} from "standardized-audio-context/src/interfaces/gain-node";
import {IAudioContext} from "standardized-audio-context";

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
    const {members, devices, localDevice} = useStage();

    return (
        <div>
            <ul>
                {members && members.map((m) => (
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
                            <li>{m.soundjacks.length} Soundjacks</li>
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
            {localDevice && (
                <ul>
                    <h1>LOCAL DEVICE</h1>
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
            <ul>
                <h1>ALL DEVICE</h1>
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
        </div>
    );
}
