import React, {useCallback, useEffect, useState} from "react";
import {useAuth} from "../../lib/useAuth";
import io from 'socket.io-client';
import VolumeSlider from "../../components/audio/VolumeSlider";
import {Button} from "baseui/button";

interface Stage {
    id: string;
    name: string;
    password: string;
}

interface Member {
    uid: string;
    name: string;
    online: boolean;
    volume: number;
}

interface Producer {
    id: string;
    uid: string;
    type: "soundjack" | "mediasoup";
    volume?: number;
}

interface MediasoupProducer extends Producer {
    kind: "audio" | "video";
}

interface MediasoupVideoProducer extends MediasoupProducer {
    kind: "video";
}

interface MediasoupAudioProducer extends MediasoupProducer {
    kind: "audio";
    volume: number;
}

interface SoundjackProducer extends Producer {
    ipv4: string;
    ipv6: string;
    port: number;
    volume: number;
}

interface Volume {
    uid: string;
    value: number;
}

export default () => {
    const {user} = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [socket, setSocket] = useState<SocketIOClient.Socket>();
    const [stage, setStage] = useState<Stage>(undefined);
    const [members, setMembers] = useState<Member[]>([]);
    const [audioProducers, setAudioProducers] = useState<{
        [uid: string]: MediasoupAudioProducer[]
    }>({});
    const [videoProducers, setVideoProducers] = useState<{
        [uid: string]: MediasoupVideoProducer[]
    }>({});
    const [soundjackProducers, setSoundjackProducers] = useState<{
        [uid: string]: SoundjackProducer[]
    }>({});

    useEffect(() => {
        if (user) {
            user.getIdToken()
                .then(token => {
                    console.log("Connecting");
                    const socket = io("http://localhost:4000", {
                        query: {
                            authorization: token
                        }
                    });
                    setSocket(socket);
                })
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            socket.on("stage-changed", (stage: Stage | null) => {
                if (stage) {
                    setStage(stage);
                } else {
                    setStage(undefined);
                }
            });

            socket.on("test", () => {
                console.log("GOT TEST");
            });

            socket.on("member-added", (member: Member) => {
                console.log("member-added");
                setMembers(prevState => [...prevState, member])
            });
            socket.on("member-changed", (member: Member) => {
                console.log("member-changed");
                setMembers(prevState => prevState.map(m => m.uid === member.uid ? {...m, ...member} : m))
            });
            socket.on("member-removed", (member: Member) => {
                console.log("member-removed");
                setMembers(prevState => prevState.filter(m => m.uid !== member.uid))
            });

            const updateVolume = (volume: Volume) => setMembers(prevState => prevState.map(m => {
                console.log("Volume changed");
                if (m.uid === volume.uid) {
                    return {
                        ...m,
                        volume: volume.value
                    }
                }
                return m;
            }));
            socket.on("volume-added", updateVolume);
            socket.on("volume-changed", updateVolume);

            socket.on("producer-added", (producer: Producer) => {
                console.log("producer added");
                if (producer.type === "soundjack") {
                    setSoundjackProducers(prevState => ({
                        ...prevState,
                        [producer.uid]: prevState[producer.uid] ? [...prevState[producer.uid], producer as SoundjackProducer] : [producer as SoundjackProducer]
                    }));
                } else if (producer.type === "mediasoup") {
                    const mediasoupProducer = producer as MediasoupProducer;
                    if (mediasoupProducer.kind === "audio") {
                        setAudioProducers(prevState => ({
                            ...prevState,
                            [producer.uid]: prevState[producer.uid] ? [...prevState[producer.uid], producer as MediasoupAudioProducer] : [producer as MediasoupAudioProducer]
                        }));
                    } else {
                        setVideoProducers(prevState => ({
                            ...prevState,
                            [producer.uid]: prevState[producer.uid] ? [...prevState[producer.uid], producer as MediasoupVideoProducer] : [producer as MediasoupVideoProducer]
                        }));
                    }
                } else {
                    console.error("Unknown producer type: " + producer.type);
                }
            });

            socket.on("producer-changed", (producer: Producer) => {
                console.log("producer changed");
                if (producer.type === "soundjack") {
                    setSoundjackProducers(prevState => ({
                        ...prevState,
                        [producer.uid]: prevState[producer.uid].map(p => p.id === producer.id ? {...p, ...producer} : p)
                    }));
                } else if (producer.type === "mediasoup") {
                    const mediasoupProducer = producer as MediasoupProducer;
                    if (mediasoupProducer.kind === "audio") {
                        setAudioProducers(prevState => ({
                            ...prevState,
                            [producer.uid]: prevState[producer.uid].map(p => p.id === producer.id ? {...p, ...producer} : p)
                        }));
                    } else {
                        setVideoProducers(prevState => ({
                            ...prevState,
                            [producer.uid]: prevState[producer.uid].map(p => p.id === producer.id ? {...p, ...producer} : p)
                        }));
                    }
                } else {
                    console.error("Unknown producer type: " + producer.type);
                }
            });

            socket.on("producer-removed", (producer: Producer) => {
                if (producer.type === "soundjack") {
                    setSoundjackProducers(prevState => ({
                        ...prevState,
                        [producer.uid]: prevState[producer.uid] ? prevState[producer.uid].filter(p => p.id !== producer.id) : []
                    }));
                } else if (producer.type === "mediasoup") {
                    const mediasoupProducer = producer as MediasoupProducer;
                    if (mediasoupProducer.kind === "audio") {
                        setAudioProducers(prevState => ({
                            ...prevState,
                            [producer.uid]: prevState[producer.uid] ? prevState[producer.uid].filter(p => p.id !== producer.id) : []
                        }));
                    } else {
                        setVideoProducers(prevState => ({
                            ...prevState,
                            [producer.uid]: prevState[producer.uid] ? prevState[producer.uid].filter(p => p.id !== producer.id) : []
                        }));
                    }
                } else {
                    console.error("Unknown producer type: " + producer.type);
                }
            });
            setLoading(false);
        }
    }, [socket]);

    const join = useCallback(() => {
        socket.emit("join", {
            id: "1234",
            password: "hello"
        });
    }, [socket]);

    const setMasterVolume = useCallback((uid: string, value: number) => {
        socket.emit("set-master-volume", {
            uid: uid,
            value: value
        });
    }, [socket]);

    const setProducerVolume = useCallback((id: string, value: number) => {
        socket.emit("set-producer-volume", {
            id: id,
            value: value
        });
    }, [socket]);

    return (
        <div>
            <Button disabled={loading} isLoading={loading} onClick={join}>JOIN</Button>
            {stage && (
                <div>
                    <h1>{stage.name}</h1>
                    <ul>
                        {members.map(member => (
                            <li>
                                <h5>{member.name}</h5>
                                <VolumeSlider value={member.volume} step={0.1} min={0} max={1}
                                              onChange={v => setMasterVolume(member.uid, v)}/>
                                <ul>
                                    {audioProducers[member.uid] && audioProducers[member.uid].map(producer => (
                                        <li>
                                            AudioProducer {producer.id}
                                            <VolumeSlider value={producer.volume} step={0.1} min={0} max={1}
                                                          onChange={v => setProducerVolume(producer.uid, v)}/>
                                        </li>
                                    ))}
                                </ul>
                                <ul>
                                    {videoProducers[member.uid] && videoProducers[member.uid].map(producer => (
                                        <li>
                                            VideoProducer {producer.id}
                                        </li>
                                    ))}
                                </ul>
                                <ul>
                                    {soundjackProducers[member.uid] && soundjackProducers[member.uid].map(producer => (
                                        <li>
                                            SoundjackProducer {producer.id}
                                            <VolumeSlider value={producer.volume} step={0.1} min={0} max={1}
                                                          onChange={v => setProducerVolume(producer.uid, v)}/>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

        </div>
    );
};
