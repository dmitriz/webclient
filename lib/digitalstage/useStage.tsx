import {useAuth} from "../useAuth";
import {useEffect, useReducer, useState} from "react";
import {DigitalStageAPI, IDevice, RealtimeDatabaseAPI, RemoteDevice} from "./base";
import {DeviceEvent, MemberEvent, ProducerEvent, SoundjackEvent, VolumeEvent} from "./base/api/DigitalStageAPI";
import {MediasoupDevice} from "./mediasoup";
import {Consumer} from "./mediasoup/types";
import {WebDebugger} from "./WebDebugger";
import {ACTION_TYPES, initialState, reducer} from "./stage.reducer";

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


const debug = new WebDebugger();

export const useStage = () => {
    const {user} = useAuth();
    const [api, setApi] = useState<DigitalStageAPI>(undefined);
    const [localDevice, setLocalDevice] = useState<MediasoupDevice>(undefined);
    const [devices, setDevices] = useState<IDevice[]>([]);
    const [error, setError] = useState<Error>(undefined);
    const [initialized, setInitialized] = useState<boolean>(false);

    const [state, dispatch] = useReducer(
        reducer,
        initialState,
        undefined
    );

    const handleError = (error: Error) => {
        setError(error);
    }

    useEffect(() => {
        // Clean up on unmount
        return () => {
            debug.debug("Clean up on unmount", "useStage");
            if (api) {
                api.disconnect();
                api.removeAllListeners();
            }
            if (localDevice)
                return localDevice.disconnect();
        }
    }, [])

    useEffect(() => {
        if (user) {
            const api = new RealtimeDatabaseAPI(user);
            api.setDebug(debug);
            setApi(api);
            const localDevice = new MediasoupDevice(api);
            localDevice.setDebug(debug);
            setLocalDevice(localDevice);
        } else {
            if (api) {
                api.disconnect();
                api.removeAllListeners();
                setApi(undefined);
                localDevice.disconnect()
                    .then(() => setLocalDevice(undefined))
                    .catch(handleError);
            }
        }
    }, [user]);

    useEffect(() => {
        if (api && localDevice && !initialized) {
            debug.debug("Initial listeners", this);
            api.on("member-added", (event: MemberEvent) => dispatch({
                type: ACTION_TYPES.ADD_MEMBER,
                api: api,
                event: event
            }));
            api.on("member-changed", (event: MemberEvent) => dispatch({
                type: ACTION_TYPES.CHANGE_MEMBER,
                api: api,
                event: event
            }));
            api.on("member-removed", (event: MemberEvent) => dispatch({
                type: ACTION_TYPES.REMOVE_MEMBER,
                api: api,
                event: event
            }));
            api.on("producer-added", (event: ProducerEvent) => dispatch({
                type: ACTION_TYPES.ADD_PRODUCER,
                api: api,
                event: event
            }));
            api.on("producer-changed", (event: ProducerEvent) => dispatch({
                type: ACTION_TYPES.CHANGE_PRODUCER,
                api: api,
                event: event
            }));
            api.on("producer-removed", (event: ProducerEvent) => dispatch({
                type: ACTION_TYPES.REMOVE_PRODUCER,
                api: api,
                event: event
            }));

            api.on("soundjack-added", (event: SoundjackEvent) => dispatch({
                type: ACTION_TYPES.ADD_SOUNDJACK,
                api: api,
                event: event
            }));

            api.on("soundjack-changed", (event: SoundjackEvent) => dispatch({
                type: ACTION_TYPES.CHANGE_SOUNDJACK,
                api: api,
                event: event
            }));

            api.on("soundjack-removed", (event: SoundjackEvent) => dispatch({
                type: ACTION_TYPES.REMOVE_SOUNDJACK,
                api: api,
                event: event
            }));

            api.on("volume-changed", (event: VolumeEvent) => dispatch({
                type: ACTION_TYPES.CHANGE_VOLUME,
                api: api,
                event: event
            }))

            api.on("device-added", (event: DeviceEvent) => setDevices(
                prevState => {
                    const device = localDevice && localDevice.id === event.id ? localDevice : new RemoteDevice(api, event.id, event.device);
                    device.on("device-changed", () => setDevices(prevState => prevState));
                    return [...prevState, device];
                }
            ))

            api.on("device-changed", () => setDevices(
                prevState => [...prevState]
            ))

            api.on("device-removed", (event: DeviceEvent) => setDevices(
                prevState => prevState.filter(device => {
                    if (device.id === event.id) {
                        device.removeAllListeners();
                        return true;
                    }
                    return false;
                })
            ))

            localDevice.on("device-changed", device => setLocalDevice(device));

            localDevice.on("consumer-added", (consumer: Consumer) => dispatch({
                type: ACTION_TYPES.ADD_CONSUMER,
                api: api,
                consumer: consumer
            }))

            localDevice.on("consumer-removed", (consumer: Consumer) => dispatch({
                type: ACTION_TYPES.REMOVE_CONSUMER,
                api: api,
                consumer: consumer
            }));


            api.registerDevice(localDevice)
                .then(deviceId => localDevice.setDeviceId(deviceId))
                .then(() => api.connect())
                .then(() => localDevice.connect())
                .then(() => localDevice.setReceiveAudio(true))
                .catch(handleError);
            setInitialized(true);
        }
    }, [api, localDevice])

    useEffect(() => {
        console.log("STATE IS NOW:");
        console.log(state);
    }, [state]);

    return {
        members: state.members,
        error,
        localDevice,
        devices
    }
};
