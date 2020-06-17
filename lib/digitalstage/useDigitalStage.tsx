import {Debugger, DigitalStageAPI, IDevice, RealtimeDatabaseAPI} from "./base";
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

    device?: MediasoupDevice,

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
    const [api, setApi] = useState<DigitalStageAPI>();
    const [stage, setStage] = useState<DigitalStageWithMediasoup>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>(undefined);

    const [id, setId] = useState<string>(undefined);
    const [name, setName] = useState<string>(undefined);
    const [password, setPassword] = useState<string>(undefined);
    const [devices, setDevices] = useState<IDevice[]>([]);
    const [members, setMembers] = useState<MediasoupMember[]>([]);

    useEffect(() => {
        if (user) {
            setLoading(true);
            Debugger.debug("Creating API", "useDigitalStage");
            const api: DigitalStageAPI = new RealtimeDatabaseAPI(user);
            setApi(api);
            Debugger.debug("Creating Stage", "useDigitalStage");
            const stage: DigitalStageWithMediasoup = new DigitalStageWithMediasoup(api);

            api.on("stage-id-changed", id => setId(id));
            api.on("stage-name-changed", name => setName(name));
            api.on("stage-password-changed", password => setPassword(password));
            stage.on("device-added", device => {
                setDevices(prevState => [...prevState, device]);
            });
            stage.on("device-removed", device => setDevices(prevState => prevState.filter(d => d.id !== device.id)));
            stage.on("member-added", member => setMembers(prevState => [...prevState, member]));
            stage.on("member-removed", member => setMembers(prevState => prevState.filter(m => m.uid !== member.uid)));

            setStage(stage);
            setLoading(false);
        } else {
            if (stage) {
                Debugger.debug("Removing stage handlers", "useDigitalStage");
                stage.removeHandlers();
            }
            setStage(undefined);
            if (api) {
                Debugger.debug("Removing API handlers", "useDigitalStage");
                api.removeHandlers();
            }
            setApi(undefined);
        }
    }, [user]);

    const create = useCallback((name: string, password: string) => {
        if (api) {
            setLoading(true);
            return api
                .createStage(name, password)
                .then(() => setError(undefined))
                .catch((err) => setError(err.message))
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [api])

    const join = useCallback((stageId: string, password: string) => {
        if (api) {
            setLoading(true);
            return api.joinStage(stageId, password)
                .then(() => setError(undefined))
                .catch((err) => setError(err.message))
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [api]);

    const leave = useCallback(() => {
        if (api) {
            setLoading(true);
            return api.leaveStage()
                .then(() => setError(undefined))
                .catch((err) => setError(err.message))
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [api]);

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
            device: stage ? stage.device : undefined,
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
