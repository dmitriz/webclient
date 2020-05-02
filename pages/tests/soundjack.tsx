import React, {useCallback, useEffect, useState} from "react";
import SoundjackController, {SoundjackSettings, SoundjackStream} from "../../lib/api/soundjack/SoundjackController";
import {Button} from "baseui/button";
import AudioDeviceSelector from "../../components/audio/AudioDeviceSelector";
import {FormControl} from "baseui/form-control";
import omit from 'lodash.omit';
import {Slider} from "baseui/slider";

export default () => {
    const [soundjack] = useState<SoundjackController>(new SoundjackController());
    const [connected, setConnected] = useState<boolean>(false);
    const [audioDevices, setAudioDevices] = useState<{ [id: string]: string }>({});
    const [settings, setSettings] = useState<SoundjackSettings>();
    const [streams, setStreams] = useState<{ [id: string]: SoundjackStream }>({});

    useEffect(() => {
        if (soundjack) {
            soundjack.addEventHandler({
                onConnected: () => {
                    console.log("onConnected");
                    console.log("Connected");
                    setConnected(true);
                },
                onDisconnected: () => {
                    console.log("onDisconnected");
                    setConnected(false)
                },
                onSettingsUpdated: (settings: SoundjackSettings) => {
                    console.log("onSettingsUpdated");
                    setSettings(prevState => ({
                        ...prevState,
                        ...settings
                    }));
                },
                onConnectionInfoUpdated: connection => {
                    console.log("onConnectionInfoUpdated");
                    console.log(connection);
                },
                onStreamAdded: (id, stream) => {
                    console.log("onStreamAdded");
                    console.log("New stream: ");
                    console.log(stream);
                    setStreams(prevState => ({...prevState, [id]: stream}));
                },
                onStreamChanged: (id, stream) => {
                    console.log("onStreamChanged");
                    setStreams(prevState => ({...prevState, [id]: stream}));
                },
                onStreamRemoved: (id, stream) => {
                    console.log("onStreamRemoved");
                    setStreams(prevState => omit(prevState, id));
                },
                onAudioDeviceAdded: ((id: string, name: string) => {
                    console.log("onAudioDeviceAdded");
                    setAudioDevices(prevState => ({...prevState, [id]: name}));
                })
            });
            soundjack.connect();
        }
    }, [soundjack]);

    const setInputDevice = useCallback((id: number) => {
        soundjack.setInputDevice(id);
    }, [soundjack]);
    const setOutputDevice = useCallback((id: number) => {
        soundjack.setOutputDevice(id);
    }, [soundjack]);
    const setFrameSize = useCallback((frameSize: number) => {
        soundjack.setFrameSize(frameSize);
    }, [soundjack]);
    const setBufferSize = useCallback((bufferSize: number) => {
        soundjack.setBufferSize(bufferSize);
    }, [soundjack]);
    const startStream = useCallback((targetIp: string, targetPort: number) => {
        soundjack.startStream(targetIp, targetPort);
    }, [soundjack]);
    const stopStream = useCallback((id: string) => {
        soundjack.stopStream(id);
    }, [soundjack]);


    if (!soundjack) {
        return <div>Loading</div>;
    }

    if (!connected) {
        return <Button onClick={() => soundjack.connect("127.0.0.1", 50000)}>Connect</Button>
    }

    console.log(settings);

    return (
        <div>
            <FormControl
                label="Input device">
                <AudioDeviceSelector
                    valid={settings && settings.valid}
                    onChange={audioDevice => setInputDevice(audioDevice)}
                    audioDevice={settings && settings.inputAudioDevice}
                    availableAudioDevices={audioDevices}/>
            </FormControl>
            <FormControl
                label="Output device">
                <AudioDeviceSelector
                    valid={settings && settings.valid}
                    onChange={audioDevice => setOutputDevice(audioDevice)}
                    audioDevice={settings && settings.outputAudioDevice}
                    availableAudioDevices={audioDevices}/>
            </FormControl>
            {settings && (
                <>

                    <FormControl
                        label="Samplebuffer">
                        <Slider disabled={!settings.outputAudioDevice || !settings.inputAudioDevice}
                                value={[settings.frameSize]} onChange={(e) => setFrameSize(e.value[0])}
                                max={512}
                                min={64}
                                step={64}/>
                    </FormControl>
                    <FormControl
                        label="Networkbuffer">
                        <Slider value={[settings.bufferSize]} onChange={(e) => setBufferSize(e.value[0])}
                                max={512}
                                min={128}
                                step={64}/>
                    </FormControl>
                    <Button disabled={!settings.valid} onClick={() => startStream("127.0.0.1", 50000)}>Start</Button>
                </>
            )}
            <ul>
                {Object.keys(streams).map((id: string) => (
                    <li>{id} {streams[id].latency} <Button onClick={() => stopStream(id)}
                                                           disabled={streams[id].status === "disconnecting"}
                                                           isLoading={streams[id].status === "disconnecting"}>STOP</Button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
