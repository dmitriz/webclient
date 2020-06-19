import {IDebugger, IDevice} from "./base";
import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {useAuth, withAuth} from "../useAuth";
import "firebase/database";
import {DigitalStageWithMediasoup} from "./mediasoup/DigitalStageWithMediasoup";
import {MediasoupMember} from "./mediasoup/types/MediasoupMember";
import {MediasoupDevice} from "./mediasoup";
import * as firebase from "firebase/app";
import {WebDebugger} from "./WebDebugger";

interface DigitalStageProps {
    id?: string;

    create(name: string, password: string);

    join(stageId: string, password: string);

    leave();

    loading: boolean;

    localDevice?: MediasoupDevice,

    devices?: IDevice[],

    name?: string,

    password?: string,

    error?: string;

    members: MediasoupMember[];

    connected: boolean;
}

const debug: IDebugger = new WebDebugger();

const DigitalStageContext = createContext<DigitalStageProps>(undefined);
export const useDigitalStage = () => useContext(DigitalStageContext);

const InitialData: DigitalStageProps = {
    id: undefined,
    create: () => {
    },
    join: () => {
    },
    leave: () => {
    },
    members: [],
    devices: [],
    connected: false,
    loading: true
}

export class DigitalStageProviderWithoutUser extends React.Component<{
    user: firebase.User;
    children: React.ReactNode;
}, DigitalStageProps> {
    private api?: DigitalStageWithMediasoup;

    constructor(props) {
        super(props);
        this.state = InitialData;
        if (props.user) {
            //this.onUserChanged();
        }
    }

    onUserChanged() {
        debug.debug("onUserChanged", "useDigitalStage");
        if (this.props.user && !this.api) {
            this.api = new DigitalStageWithMediasoup(this.props.user);
            this.api.connect()
                .then(() => this.setState({
                    id: this.api.id,
                    create: (name: string, password: string) => this.api.create(name, password),
                    join: (id: string, password: string) => this.api.join(id, password),
                    leave: () => this.api.leave(),
                    members: this.api.members,
                    devices: this.api.devices,
                    localDevice: this.api.device,
                    connected: this.api.connected
                }));
        } else {
            if (this.api) {
                this.api.disconnect();
            }
            this.api = undefined;
            this.setState(InitialData);
        }
    }

    componentDidUpdate(prevProps: Readonly<{ user: firebase.User; children: React.ReactNode }>, prevState: Readonly<DigitalStageProps>, snapshot?: any) {
        if (prevProps.user !== this.props.user) {
            debug.debug("user changed", "useDigitalStage");
            //this.onUserChanged();
        }
    }

    componentDidMount() {
        this.setState({
            loading: false
        });
    }


    render() {
        return (
            <DigitalStageContext.Provider value={this.state}>
                {this.props.children}
            </DigitalStageContext.Provider>
        );
    }
}

export const DigitalStageProvider = withAuth(DigitalStageProviderWithoutUser);

export const DigitalStageProvider2 = (props: {
    children: React.ReactNode
}) => {
    const {user} = useAuth();
    const [connected, setConnected] = useState<boolean>();
    const [stage, setStage] = useState<DigitalStageWithMediasoup>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>(undefined);

    const [id, setId] = useState<string>(undefined);
    const [name, setName] = useState<string>(undefined);
    const [password, setPassword] = useState<string>(undefined);
    const [localDevice, setLocalDevice] = useState<MediasoupDevice>(undefined);
    const [devices, setDevices] = useState<IDevice[]>([]);
    const [members, setMembers] = useState<MediasoupMember[]>([]);

    const handleError = useCallback((error: Error) => {
        debug.handleError(error, "useDigitalStage");
        setError(error.message);
    }, []);

    useEffect(() => {
        if (user) {
            setLoading(true);
            debug.debug("Initializing Stage", "useDigitalStage");
            const stage: DigitalStageWithMediasoup = new DigitalStageWithMediasoup(user);

            stage.on("connection-state-changed", value => setConnected(value));
            stage.on("stage-id-changed", id => setId(id));
            stage.on("stage-name-changed", name => setName(name));
            stage.on("stage-password-changed", password => setPassword(password));
            stage.on("device-added", device =>
                setDevices(prevState => prevState.find((d) => d.id === device.id) ? prevState : [...prevState, device]
                ));
            stage.on("device-removed", device => setDevices(prevState => prevState.filter(d => d.id !== device.id)));
            stage.on("member-added", member => setMembers(prevState => [...prevState, member]));
            stage.on("member-removed", member => setMembers(prevState => prevState.filter(m => m.uid !== member.uid)));
            stage.connect()
                .catch(handleError);
            setLocalDevice(stage.device);
            setStage(stage);
            setLoading(false);
        } else {
            if (stage) {
                stage.disconnect()
                    .catch(handleError);
                stage.removeAllListeners();
                debug.debug("Removing stage handlers", "useDigitalStage");
            }
            setConnected(false);
            setStage(undefined);
        }
    }, [user]);

    const create = useCallback((name: string, password: string) => {
        if (stage) {
            setLoading(true);
            return stage
                .create(name, password)
                .then(() => setError(undefined))
                .catch(handleError)
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [stage])

    const join = useCallback((stageId: string, password: string) => {
        if (stage) {
            setLoading(true);
            return stage
                .join(stageId, password)
                .then(() => setError(undefined))
                .catch(handleError)
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [stage]);

    const leave = useCallback(() => {
        if (stage) {
            setLoading(true);
            return stage
                .leave()
                .then(() => setError(undefined))
                .catch(handleError)
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [stage]);

    return (
        <DigitalStageContext.Provider value={{
            id: id,
            localDevice: localDevice,
            devices: devices,
            members: members,
            name: name,
            password: password,
            create,
            join,
            loading,
            leave,
            error,
            connected
        }}>
            {props.children}
        </DigitalStageContext.Provider>
    )
};
