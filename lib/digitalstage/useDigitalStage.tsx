import {Debugger, IDevice} from "./base";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {useAuth} from "../useAuth";
import "firebase/database";
import {Member} from "./base/Member";
import {DigitalStageWithMediasoup} from "./mediasoup/DigitalStageWithMediasoup";
import {MediasoupMember} from "./mediasoup/types/MediasoupMember";
import {MediasoupDevice} from "./mediasoup";

interface DigitalStageProps {
    id: string;

    create(name: string, password: string);

    join(stageId: string, password: string);

    leave();

    loading: boolean;

    localDevice?: MediasoupDevice,

    devices?: IDevice[],

    name: string,

    password: string,

    error?: string;

    members: Member[];

    setConnected(connected: boolean): void;
}

const DigitalStageContext = createContext<DigitalStageProps>(undefined);
export const useDigitalStage = () => useContext(DigitalStageContext);

export const DigitalStageProvider = (props: {
    children: React.ReactNode
}) => {
    const {user} = useAuth();
    const [stage, setStage] = useState<DigitalStageWithMediasoup>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>(undefined);

    const [id, setId] = useState<string>(undefined);
    const [name, setName] = useState<string>(undefined);
    const [password, setPassword] = useState<string>(undefined);
    const [device, setDevice] = useState<MediasoupDevice>(undefined);
    const [devices, setDevices] = useState<IDevice[]>([]);
    const [members, setMembers] = useState<MediasoupMember[]>([]);

    useEffect(() => {
        if (user) {
            setLoading(true);
            Debugger.debug("Initializing Stage", "useDigitalStage");
            const stage: DigitalStageWithMediasoup = new DigitalStageWithMediasoup(user);

            stage.on("stage-id-changed", id => setId(id));
            stage.on("stage-name-changed", name => setName(name));
            stage.on("stage-password-changed", password => setPassword(password));
            stage.on("device-added", device => {
                setDevices(prevState => [...prevState, device]);
            });
            stage.on("device-removed", device => setDevices(prevState => prevState.filter(d => d.id !== device.id)));
            stage.on("member-added", member => setMembers(prevState => [...prevState, member]));
            stage.on("member-removed", member => setMembers(prevState => prevState.filter(m => m.uid !== member.uid)));
            stage.connect();
            setStage(stage);
            setDevice(stage.device);
            setLoading(false);
        } else {
            if (stage) {
                stage.disconnect();
                Debugger.debug("Removing stage handlers", "useDigitalStage");
            }
            setDevice(undefined);
            setStage(undefined);
        }
    }, [user]);

    const create = useCallback((name: string, password: string) => {
        if (stage) {
            setLoading(true);
            return stage
                .api
                .createStage(name, password)
                .then(() => setError(undefined))
                .catch((err) => setError(err.message))
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [stage])

    const join = useCallback((stageId: string, password: string) => {
        if (stage) {
            setLoading(true);
            return stage
                .api.joinStage(stageId, password)
                .then(() => setError(undefined))
                .catch((err) => setError(err.message))
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [stage]);

    const leave = useCallback(() => {
        if (stage) {
            setLoading(true);
            return stage.api.leaveStage()
                .then(() => setError(undefined))
                .catch((err) => setError(err.message))
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [stage]);

    const setConnected = useCallback((connected: boolean) => {
        if (stage) {
            if (connected) {
                return stage.device.connect();
            } else {
                return stage.device.disconnect();
            }
        }
    }, [stage]);

    return (
        <DigitalStageContext.Provider value={{
            id: id,
            localDevice: device,
            devices: devices,
            members: members,
            name: name,
            password: password,
            create,
            join,
            loading,
            leave,
            error,
            setConnected: setConnected
        }}>
            {props.children}
        </DigitalStageContext.Provider>
    )
};
