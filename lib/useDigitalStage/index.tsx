import {WebDebugger} from "./WebDebugger";
import {DigitalStageAPI, IDebugger, IDevice, RealtimeDatabaseAPI, RemoteDevice} from "./base";
import {MediasoupDevice} from "./mediasoup";
import React, {createContext, useContext} from "react";
import {withAuth} from "../useAuth";
import * as firebase from "firebase/app";
import {
    DeviceEvent,
    MemberEvent,
    ProducerEvent,
    SoundjackEvent,
    StageIdEvent,
    VolumeEvent
} from "./base/api/DigitalStageAPI";
import {Consumer} from "./mediasoup/types";


const debug = new WebDebugger();


export interface IVolumeControl {
    volume: number;

    setVolume(volume: number);
}

export interface IConsumer {
    id: string;
    track: MediaStreamTrack;
}

export interface IVideoProducer extends IProducer {
}

export interface IAudioProducer extends IProducer, IVolumeControl {
}

export interface ISoundjack extends IVolumeControl {
    id: string;
    ipv4: string;
    ipv6: string;
    latency?: number;
    bufferSize?: number;
}

export interface IProducer {
    id: string;
    consumer?: IConsumer;
}

export interface IMember extends IVolumeControl {
    uid: string;
    name: string;
    online?: boolean;
    audioProducers: IAudioProducer[],
    videoProducers: IVideoProducer[],
    soundjacks: ISoundjack[]
}

export interface IStage {
    id: string;
    name?: string;
    password?: string;
    members: IMember[];
}


export interface DigitalStageState {
    api?: DigitalStageAPI;

    user?: firebase.User;

    debug: IDebugger;
    loading: boolean;
    error?: Error;

    connect?: () => Promise<boolean>;
    disconnect?: () => Promise<boolean>;
    connected: boolean;

    // Stage handling
    stage?: IStage;
    create?: (name: string, password: string) => Promise<boolean>;
    join?: (stageId: string, password: string) => Promise<boolean>;
    leave?: () => Promise<boolean>;

    // State outside and inside of stage
    audioProducers: {
        [uid: string]: IAudioProducer[]
    };
    videoProducers: {
        [uid: string]: IVideoProducer[]
    };
    soundjacks: {
        [uid: string]: ISoundjack[]
    };
    volumes: {
        [uid: string]: number
    }

    devices: IDevice[];

    localDevice?: MediasoupDevice;

}

export interface DigitalStageProps {
    user?: firebase.User;
    loading: boolean;
    autoConnect?: boolean;
    children: React.ReactNodeArray
}

const DigitalStageContext = createContext<DigitalStageState>(undefined);

const useDigitalStage = () => useContext(DigitalStageContext);

const initialState: DigitalStageState = {
    loading: false,
    debug: debug,
    connected: false,
    audioProducers: {},
    videoProducers: {},
    soundjacks: {},
    volumes: {},
    devices: [],
}

class DigitalStageProviderBase extends React.Component<DigitalStageProps, DigitalStageState> {

    constructor(props) {
        super(props);
        this.state = {
            ...initialState,
            user: props.user,
            loading: props.loading
        };
    }

    componentDidUpdate(prevProps: Readonly<DigitalStageProps>, prevState: Readonly<DigitalStageState>, snapshot?: any) {
        if (prevProps.loading !== this.props.loading ||
            prevProps.user !== this.props.user) {
            this.setState({
                user: this.props.user
            });
        } else if (prevState.user !== this.state.user) {
            if (this.state.user) {
                this.setState({
                    connect: this.connect,
                    disconnect: this.disconnect,
                    loading: this.props.autoConnect
                });
                if (this.props.autoConnect) {
                    debug && debug.debug("Connecting (auto connect enabled)", this);
                    this.connect()
                        .catch(this.handleError);
                }
            } else {
                if (this.state.connected) {
                    this.disconnect()
                        .catch(this.handleError);
                }
                this.setState({
                    connect: undefined,
                    disconnect: undefined,
                    audioProducers: {},
                    videoProducers: {},
                    soundjacks: {},
                    loading: false
                })
            }
        }
    }

    private handleError(error: Error) {
        debug.handleError(error);
        this.setState({
            error: error,
            loading: false
        });
    }

    private create = (name: string, password: string): Promise<boolean> => {
        this.setState({
            loading: true
        });
        return this.state.api.createStage(name, password)
            .then(result => result !== undefined)
            .catch(error => {
                this.handleError(error);
                return false;
            });
    }

    private join = (id: string, password: string): Promise<boolean> => {
        this.setState({
            loading: true
        });
        return this.state.api.joinStage(id, password)
            .then(result => result !== undefined)
            .catch(error => {
                this.handleError(error);
                return false;
            });
    }

    private leave = (): Promise<boolean> => {
        this.setState({
            loading: true
        });
        return this.state.api.leaveStage()
            .catch(error => {
                this.handleError(error);
                return false;
            });
    }

    private addApiListeners(api: DigitalStageAPI) {
        api.on("stage-id-changed", (event: StageIdEvent) => this.setState(prevState => {
            debug && debug.debug("Got stage: " + event, this);
            return {
                ...prevState,
                loading: false,
                stage: event ? {
                    id: event,
                    members: []
                } : undefined
            }
        }));
        api.on("stage-name-changed", (event: StageIdEvent) => this.setState(prevState => ({
            ...prevState,
            stage: prevState.stage ? {
                ...prevState.stage,
                name: event
            } : undefined
        })));
        api.on("stage-password-changed", (event: StageIdEvent) => this.setState(prevState => ({
            ...prevState,
            stage: prevState.stage ? {
                ...prevState.stage,
                password: event
            } : undefined
        })));
        api.on("member-added", (event: MemberEvent) => this.setState(prevState => ({
            ...prevState,
            stage: prevState.stage && {
                ...prevState.stage,
                members: [...prevState.stage.members, {
                    uid: event.uid,
                    name: event.member.displayName,
                    online: event.member.online,
                    volume: prevState.volumes[event.uid] || 0,
                    setVolume: v => prevState.api.setRemoteMasterVolume(event.uid, v),
                    audioProducers: prevState.audioProducers[event.uid] || [],
                    videoProducers: prevState.videoProducers[event.uid] || [],
                    soundjacks: prevState.soundjacks[event.uid] || [],
                }]
            }
        })));
        api.on("member-changed", (event: MemberEvent) => this.setState(prevState => ({
            ...prevState,
            stage: prevState.stage && {
                ...prevState.stage,
                members: prevState.stage.members.map(member => {
                    if (member.uid === event.uid) {
                        member.name = event.member.displayName;
                        member.online = event.member.online;
                    }
                    return member;
                })
            }
        })));
        api.on("member-removed", (event: MemberEvent) => this.setState(prevState => ({
            ...prevState,
            stage: prevState.stage && {
                ...prevState.stage,
                members: prevState.stage.members.filter(member => member.uid !== event.uid)
            }
        })));
        api.on("producer-added", (event: ProducerEvent) => {
            if (event.producer.kind === "audio") {
                const producer: IAudioProducer = {
                    id: event.id,
                    volume: event.producer.volume | 1,
                    setVolume: v => this.state.api.setRemoteProducerVolume(event.id, v)
                };
                this.setState(prevState => ({
                        ...prevState,
                        audioProducers: {
                            ...prevState.audioProducers,
                            [event.producer.uid]: prevState.audioProducers[event.producer.uid] ? [...prevState.audioProducers[event.producer.uid], producer] : [producer]
                        },
                        stage: prevState.stage && {
                            ...prevState.stage,
                            members: prevState.stage.members.map(member => {
                                if (member.uid === event.producer.uid) {
                                    member.audioProducers.push(producer);
                                }
                                return member;
                            })
                        }
                    })
                );
            } else {
                const producer: IVideoProducer = {
                    id: event.id,
                };
                this.setState(prevState => ({
                    ...prevState,
                    videoProducers: {
                        ...prevState.videoProducers,
                        [event.producer.uid]: prevState.videoProducers[event.producer.uid] ? [...prevState.videoProducers[event.producer.uid], producer] : [producer]
                    },
                    stage: prevState.stage && {
                        ...prevState.stage,
                        members: prevState.stage.members.map(member => {
                            if (member.uid === event.producer.uid) {
                                member.videoProducers.push(producer);
                            }
                            return member;
                        })
                    }
                }));
            }
        });
        api.on("producer-changed", (event: ProducerEvent) => {
            if (event.producer.kind === "audio") {
                this.setState(prevState => ({
                    ...prevState,
                    audioProducers: {
                        ...prevState.audioProducers,
                        [event.producer.uid]: prevState.audioProducers[event.producer.uid] && prevState.audioProducers[event.producer.uid].map(producer => {
                            if (producer.id === event.id) {
                                producer.volume = event.producer.volume
                            }
                            return producer;
                        })
                    },
                    stage: prevState.stage && {
                        ...prevState.stage,
                        members: prevState.stage.members.map(member => {
                            if (member.uid === event.producer.uid) {
                                member.audioProducers = member.audioProducers.map(producer => {
                                    if (producer.id === event.id) {
                                        producer.volume = event.producer.volume
                                    }
                                    return producer;
                                });
                            }
                            return member;
                        })
                    }
                }));
            }
        });
        api.on("producer-removed", (event: ProducerEvent) => {
            if (event.producer.kind === "audio") {
                this.setState(prevState => ({
                    ...prevState,
                    audioProducers: {
                        ...prevState.audioProducers,
                        [event.producer.uid]: prevState.audioProducers[event.producer.uid] && prevState.audioProducers[event.producer.uid].filter(producer => producer.id !== event.id)
                    },
                    stage: prevState.stage && {
                        ...prevState.stage,
                        members: prevState.stage.members.map(member => {
                            if (member.uid === event.producer.uid) {
                                member.audioProducers = member.audioProducers.filter(p => p.id !== event.id)
                            }
                            return member;
                        })
                    }
                }));
            } else {
                this.setState(prevState => ({
                    ...prevState,
                    videoProducers: {
                        ...prevState.videoProducers,
                        [event.producer.uid]: prevState.videoProducers[event.producer.uid] && prevState.videoProducers[event.producer.uid].filter(producer => producer.id !== event.id)
                    },
                    stage: prevState.stage && {
                        ...prevState.stage,
                        members: prevState.stage.members.map(member => {
                            if (member.uid === event.producer.uid) {
                                member.videoProducers = member.videoProducers.filter(p => p.id !== event.id)
                            }
                            return member;
                        })
                    }
                }));
            }
        });
        api.on("soundjack-added", (event: SoundjackEvent) => {
            const soundjack: ISoundjack = {
                id: event.id,
                ipv4: event.soundjack.ipv4,
                ipv6: event.soundjack.ipv6,
                volume: event.soundjack.volume,
                latency: event.soundjack.latency,
                bufferSize: event.soundjack.bufferSize,
                setVolume: v => this.state.api.setRemoteSoundjackVolume(event.id, v)
            };
            this.setState(prevState => ({
                    ...prevState,
                    soundjacks: {
                        ...prevState.soundjacks,
                        [event.soundjack.uid]: prevState.soundjacks[event.soundjack.uid] ? [...prevState.soundjacks[event.soundjack.uid], soundjack] : [soundjack]
                    },
                    stage: prevState.stage && {
                        ...prevState.stage,
                        members: prevState.stage.members.map(member => {
                            if (member.uid === event.soundjack.uid) {
                                member.soundjacks.push(soundjack);
                            }
                            return member;
                        })
                    }
                })
            );
        });
        api.on("soundjack-changed", (event: SoundjackEvent) => {
            this.setState(prevState => ({
                ...prevState,
                soundjacks: {
                    ...prevState.soundjacks,
                    [event.soundjack.uid]: prevState.soundjacks[event.soundjack.uid] && prevState.soundjacks[event.soundjack.uid].map(producer => {
                        if (producer.id === event.id) {
                            producer.volume = event.soundjack.volume;
                            producer.latency = event.soundjack.latency;
                            producer.bufferSize = event.soundjack.bufferSize;
                        }
                        return producer;
                    })
                },
                stage: prevState.stage && {
                    ...prevState.stage,
                    members: prevState.stage.members.map(member => {
                        if (member.uid === event.soundjack.uid) {
                            member.soundjacks = member.soundjacks.map(producer => {
                                if (producer.id === event.id) {
                                    producer.volume = event.soundjack.volume;
                                    producer.latency = event.soundjack.latency;
                                    producer.bufferSize = event.soundjack.bufferSize;
                                }
                                return producer;
                            });
                        }
                        return member;
                    })
                }
            }));
        });
        api.on("soundjack-removed", (event: SoundjackEvent) => {
            this.setState(prevState => ({
                ...prevState,
                soundjacks: {
                    ...prevState.soundjacks,
                    [event.soundjack.uid]: prevState.soundjacks[event.soundjack.uid] && prevState.soundjacks[event.soundjack.uid].filter(producer => producer.id !== event.id)
                },
                stage: prevState.stage && {
                    ...prevState.stage,
                    members: prevState.stage.members.map(member => {
                        if (member.uid === event.soundjack.uid) {
                            member.soundjacks = member.soundjacks.filter(soundjack => soundjack.id !== event.id)
                        }
                        return member;
                    })
                }
            }));
        });
        const handleVolumeChange = (event: VolumeEvent) => this.setState(prevState => ({
            ...prevState,
            volumes: {
                ...prevState.volumes,
                [event.uid]: event.volume
            },
            stage: prevState.stage && {
                ...prevState.stage,
                members: prevState.stage.members.map(member => {
                    if (member.uid === event.uid)
                        member.volume = event.volume;
                    return member;
                })
            }
        }));
        api.on("volume-added", handleVolumeChange);
        api.on("volume-changed", handleVolumeChange);

        api.on("device-added", (event: DeviceEvent) => {
            if (event.id !== this.state.localDevice.id) {
                const device = new RemoteDevice(this.state.api, event.id, event.device);
                device.on("device-changed", () => this.setState(prevState => ({
                    devices: prevState.devices
                })));
                this.setState(prevState => ({
                    ...prevState,
                    devices: [...prevState.devices, device]
                }))
            }
        })
        api.on("device-removed", (event: DeviceEvent) => {
            this.setState(
                prevState => ({
                    devices: prevState.devices.filter(d => {
                        if (d.id === event.id) {
                            d.removeAllListeners();
                            return false;
                        }
                        return true;
                    })
                })
            )
        })
    }

    private removeApiListeners(api: DigitalStageAPI) {
        api.removeAllListeners();
    }


    private addLocalDeviceListeners(localDevice: MediasoupDevice) {
        localDevice.on("consumer-added", (consumer: Consumer) => {
            console.log("CONSUMER ADDED");
            if (consumer.globalProducer.kind === "audio") {
                this.setState(prevState => ({
                    ...prevState,
                    audioProducers: {
                        ...prevState.audioProducers,
                        [consumer.globalProducer.id]: {
                            ...prevState.audioProducers[consumer.globalProducer.id],
                            consumer: {
                                id: consumer.consumer.id,
                                track: consumer.consumer.track
                            }
                        }
                    },
                    stage: prevState.stage && {
                        ...prevState.stage,
                        members: prevState.stage.members.map(member => {
                            if (member.uid === consumer.globalProducer.uid) {
                                member.audioProducers = member.audioProducers.map(producer => {
                                    if (producer.id === consumer.globalProducer.id) {
                                        producer.consumer = {
                                            id: consumer.consumer.id,
                                            track: consumer.consumer.track
                                        }
                                    }
                                    return producer;
                                })
                            }
                            return member;
                        })
                    }
                }))
            } else {
                this.setState(prevState => ({
                    ...prevState,
                    videoProducers: {
                        ...prevState.videoProducers,
                        [consumer.globalProducer.id]: {
                            ...prevState.videoProducers[consumer.globalProducer.id],
                            consumer: {
                                id: consumer.consumer.id,
                                track: consumer.consumer.track
                            }
                        }
                    },
                    stage: prevState.stage && {
                        ...prevState.stage,
                        members: prevState.stage.members.map(member => {
                            if (member.uid === consumer.globalProducer.uid) {
                                member.videoProducers = member.videoProducers.map(producer => {
                                    if (producer.id === consumer.globalProducer.id) {
                                        producer.consumer = {
                                            id: consumer.consumer.id,
                                            track: consumer.consumer.track
                                        }
                                    }
                                    return producer;
                                })
                            }
                            return member;
                        })
                    }
                }))
            }
        })
        localDevice.on("consumer-removed", (consumer: Consumer) => {
            if (consumer.globalProducer.kind === "audio") {
                this.setState(prevState => ({
                    ...prevState,
                    audioProducers: {
                        ...prevState.audioProducers,
                        [consumer.globalProducer.id]: {
                            ...prevState.audioProducers[consumer.globalProducer.id],
                            consumer: undefined
                        }
                    }
                }))
            } else {
                this.setState(prevState => ({
                    ...prevState,
                    videoProducers: {
                        ...prevState.videoProducers,
                        [consumer.globalProducer.id]: {
                            ...prevState.videoProducers[consumer.globalProducer.id],
                            consumer: undefined
                        }
                    }
                }))
            }
        })
        localDevice.on("device-changed", device => this.setState({localDevice: device}));
    }

    private removeLocalDeviceListeners(localDevice: MediasoupDevice) {
        localDevice.removeAllListeners();
    }


    connect = (): Promise<boolean> => {
        if (!this.props.user)
            return Promise.reject(new Error("No user available"));
        if (this.state.connected) {
            return Promise.resolve(false);
        }
        this.setState({
            loading: true
        });
        const api: DigitalStageAPI = new RealtimeDatabaseAPI(this.props.user);
        this.addApiListeners(api);
        const localDevice: MediasoupDevice = new MediasoupDevice(api);
        this.addLocalDeviceListeners(localDevice);
        return api.registerDevice(localDevice)
            .then(deviceId => localDevice.setDeviceId(deviceId))
            .then(() => localDevice.connect())
            .then(() => localDevice.setReceiveAudio(true))
            .then(() => localDevice.setReceiveVideo(true))
            .then(() => api.connect())
            .then(() => debug && debug.debug("", this))
            .then(() => this.setState({
                connected: true,
                api: api,
                create: this.create,
                join: this.join,
                leave: this.leave,
                localDevice: localDevice
            }))
            .then(() => true);
    }

    disconnect = (): Promise<boolean> => {
        if (!this.state.connected) {
            return Promise.resolve(false);
        }
        this.setState({
            loading: true
        });
        return this.state.localDevice.disconnect()
            .then(() => this.removeLocalDeviceListeners(this.state.localDevice))
            .then(() => this.state.api.unregisterDevice(this.state.localDevice.id))
            .then(async () => await this.state.devices.forEach(d => d.disconnect()))
            .then(() => this.state.api.disconnect())
            .then(() => this.removeApiListeners(this.state.api))
            .then(() => this.setState({
                connected: false,
                create: undefined,
                join: undefined,
                leave: undefined,
                devices: [],
                stage: undefined,
                localDevice: undefined,
                audioProducers: {},
                videoProducers: {},
                soundjacks: {}
            }))
            .then(() => true)
            .catch(error => {
                this.handleError(error)
                return false
            })
            .finally(() => this.setState({
                loading: false,
                connected: false
            }));
    }

    render() {
        return (
            <DigitalStageContext.Provider value={this.state}>
                {this.props.children}
            </DigitalStageContext.Provider>
        )

    }

}

export const DigitalStageProvider = withAuth(DigitalStageProviderBase);

export default useDigitalStage;
