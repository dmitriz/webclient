import {
    DeviceEvent,
    DigitalStageAPI,
    MemberEvent,
    ProducerEvent,
    SoundjackEvent,
    StageEvent,
    StageIdEvent,
    VolumeEvent
} from "./DigitalStageAPI";
import {
    DatabaseDevice,
    DatabaseGlobalProducer,
    DatabaseGlobalSoundjack,
    DatabaseStage,
    DatabaseStageMember,
    DatabaseUserRemoteProducer,
    DatabaseUserRemoteSoundjack
} from "../types";
import * as firebase from "firebase/app";
import "firebase/database";
import {IDevice} from "../IDevice";
import {RemoteDevice} from "../RemoteDevice";
import omit from "lodash.omit";
import fetch from "isomorphic-unfetch";
import {Debugger} from "./../index";


export class RealtimeDatabaseAPI extends DigitalStageAPI {
    private readonly user: firebase.User;
    private readonly userRef: firebase.database.Reference;
    private stageRef: firebase.database.Reference | undefined;
    private stage: DatabaseStage | undefined;
    protected devices: {
        [deviceId: string]: IDevice
    } = {};

    constructor(user: firebase.User) {
        super();
        this.user = user;
        this.userRef = firebase.database().ref("users/" + this.user.uid);
        this.initRealtimeDatabaseHandler();
    }

    public getStage(): DatabaseStage | undefined {
        return this.stage;
    }

    public getUid(): string {
        return this.user.uid;
    }

    public getDevices(): IDevice[] {
        return Object.values(this.devices);
    }

    public getDevice(deviceId: string): IDevice | undefined {
        return this.devices[deviceId];
    }

    private handleRemoteChange = (device: IDevice) => {
        if (device.id) {
            this.devices[device.id] = device;
            this.emit("device-changed", device as DeviceEvent);
        }
    };

    private async fetchStage() {
        if (this.stageRef) {
            this.stageRef
                .child("name")
                .once("value")
                .then(nameSnapshot => nameSnapshot.val() as string)
                .then(name =>
                    this.stageRef
                        .child("password")
                        .once("value")
                        .then(passwordSnapshot => passwordSnapshot.val() as string)
                        .then(password => {
                            this.stage = {
                                id: this.stageRef.key,
                                name: name,
                                password: password
                            } as DatabaseStage;
                            this.emit("stage-changed", this.stage as StageEvent);
                        })
                ).catch(this.handleFirebaseError);
        } else {
            this.stage = undefined;
            this.emit("stage-changed", this.stage ? this.stage : undefined as StageEvent);
        }
    }

    private initRealtimeDatabaseHandler() {
        this.userRef
            .child("stageId")
            .on("value", async snapshot => {
                const stageId: string | null = snapshot.val();
                if (stageId) {
                    Debugger.debug("stageId changed to: " + stageId, this);
                    this.stageRef = firebase.database().ref("stages/" + stageId);
                    this.emit("stage-id-changed", stageId as StageIdEvent);
                    this.fetchStage();
                    this.initStageMemberHandler();
                } else {
                    Debugger.debug("stageId changed to null, clean up stage handlers ", this);
                    if (this.stageRef) {
                        this.stageRef
                            .child("members")
                            .off();
                        this.stageRef
                            .off();
                    }
                    this.emit("stage-id-changed", undefined as StageIdEvent);
                    this.stageRef = undefined;
                }
            }, this.handleFirebaseError)
        this.userRef
            .child("devices")
            .on("child_added", snapshot => {
                if (snapshot.key) {
                    const dbDevice: DatabaseDevice = snapshot.val();
                    const deviceId: string = snapshot.key;
                    Debugger.debug("Device added: " + deviceId, this);
                    if (!this.getDevice(deviceId)) {
                        const device: IDevice = new RemoteDevice(this, deviceId, dbDevice);
                        device.on("device-changed", this.handleRemoteChange);
                        this.devices[deviceId] = device;
                        this.emit("device-added", device as DeviceEvent);
                    }
                }
            }, this.handleFirebaseError)
        this.userRef
            .child("devices")
            .on("child_removed", snapshot => {
                if (snapshot.key) {
                    const deviceId: string = snapshot.key;
                    const device: IDevice = this.devices[deviceId];
                    Debugger.debug("Device removed: " + deviceId, this);
                    if (device) {
                        this.devices = omit(this.devices, deviceId);
                        this.emit("device-removed", device as DeviceEvent);
                    }
                }
            }, this.handleFirebaseError)
        this.userRef
            .child("producers")
            .on("child_added", snapshot => {
                Debugger.debug("Producer added: " + snapshot.key, this);
                const producer: DatabaseUserRemoteProducer = snapshot.val();
                this.emit("producer-added", {id: snapshot.key, producer: producer} as ProducerEvent);
            }, this.handleFirebaseError)
        this.userRef
            .child("producers")
            .on("child_changed", snapshot => {
                Debugger.debug("Producer changed: " + snapshot.key, this);
                const producer: DatabaseUserRemoteProducer = snapshot.val();
                this.emit("producer-changed", {id: snapshot.key, producer: producer} as ProducerEvent);
            }, this.handleFirebaseError)
        this.userRef
            .child("producers")
            .on("child_removed", snapshot => {
                Debugger.debug("Producer removed: " + snapshot.key, this);
                const producer: DatabaseUserRemoteProducer = snapshot.val();
                this.emit("producer-removed", {id: snapshot.key, producer: producer} as ProducerEvent);
            }, this.handleFirebaseError)
        this.userRef
            .child("soundjacks")
            .on("child_added", snapshot => {
                Debugger.debug("Soundjack added: " + snapshot.key, this);
                const soundjack: DatabaseUserRemoteSoundjack = snapshot.val();
                this.emit("soundjack-added", {id: snapshot.key, soundjack: soundjack} as SoundjackEvent);
            }, this.handleFirebaseError)
        this.userRef
            .child("soundjacks")
            .on("child_changed", snapshot => {
                Debugger.debug("Soundjack changed: " + snapshot.key, this);
                const soundjack: DatabaseUserRemoteSoundjack = snapshot.val();
                this.emit("soundjack-changed", {id: snapshot.key, soundjack: soundjack} as SoundjackEvent);
            }, this.handleFirebaseError)
        this.userRef
            .child("soundjacks")
            .on("child_removed", snapshot => {
                Debugger.debug("Soundjack removed: " + snapshot.key, this);
                const soundjack: DatabaseUserRemoteSoundjack = snapshot.val();
                this.emit("soundjack-removed", {id: snapshot.key, soundjack: soundjack} as SoundjackEvent);
            }, this.handleFirebaseError)
        this.userRef
            .child("volumes")
            .on("child_added", snapshot => {
                Debugger.debug("Volume added: " + snapshot.key, this);
                const volume: number = snapshot.val();
                this.emit("volume-added", {uid: snapshot.key, volume: volume} as VolumeEvent);
            }, this.handleFirebaseError)
        this.userRef
            .child("volumes")
            .on("child_changed", snapshot => {
                Debugger.debug("Volume changed: " + snapshot.key, this);
                const volume: number = snapshot.val();
                this.emit("volume-changed", {uid: snapshot.key, volume: volume} as VolumeEvent);
            }, this.handleFirebaseError)
        this.userRef
            .child("volumes")
            .on("child_removed", snapshot => {
                Debugger.debug("Volume removed: " + snapshot.key, this);
                const volume: number = snapshot.val();
                this.emit("volume-removed", {uid: snapshot.key, volume: volume} as VolumeEvent);
            }, this.handleFirebaseError)
    }

    private handleFirebaseError(error: Error) {
        Debugger.handleError(error, this);
    }

    private initStageMemberHandler() {
        Debugger.debug("initStageMemberHandler() with " + (this.stageRef ? "valid" : "undefined") + " stageref", this);
        if (this.stageRef && this.stageRef.key) {
            this.stageRef
                .child("members")
                .on("child_added", snapshot => {
                    Debugger.debug("Member added: " + snapshot.key, this);
                    const member: DatabaseStageMember = snapshot.val();
                    this.emit("member-added", {uid: snapshot.key, member: member} as MemberEvent);
                }, this.handleFirebaseError)
            this.stageRef
                .child("members")
                .on("child_changed", snapshot => {
                    Debugger.debug("Member changed: " + snapshot.key, this);
                    const member: DatabaseStageMember = snapshot.val();
                    this.emit("member-changed", {uid: snapshot.key, member: member} as MemberEvent);
                }, this.handleFirebaseError)
            this.stageRef
                .child("members")
                .on("child_removed", snapshot => {
                    Debugger.debug("Member removed: " + snapshot.key, this);
                    const member: DatabaseStageMember = snapshot.val();
                    this.emit("member-removed", {uid: snapshot.key, member: member} as MemberEvent);

                }, this.handleFirebaseError)
        }
    }


    createStage(name: string, password?: string): Promise<DatabaseStage> {
        return this.user
            .getIdToken()
            .then((token: string) => fetch("https://digital-stages.de/api/v2/stages/create", {
                    method: "POST",
                    headers: {
                        authorization: token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        password: password
                    })
                })
            )
            .then(response => response.json())
            .then(json => json as DatabaseStage)
            .then(stage => {
                Debugger.debug("Stage created and joined: " + stage.name, this);
                this.emit("created", stage as StageEvent);
                this.emit("joined", stage as StageEvent);
                return stage;
            })
    }

    joinStage(stageId: string, password?: string): Promise<DatabaseStage> {
        return this.user
            .getIdToken()
            .then((token: string) => fetch("https://digital-stages.de/api/v2/stages/join", {
                method: "POST",
                headers: {
                    "authorization": token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stageId: stageId,
                    password: password
                })
            }))
            .then(response => response.json())
            .then(json => json as DatabaseStage)
            .then(stage => {
                Debugger.debug("Stage joined: " + stage.name, this);
                this.emit("joined", stage as StageEvent);
                return stage;
            })
    }

    leaveStage(): Promise<boolean> {
        return this.user
            .getIdToken()
            .then((token: string) => fetch("https://digital-stages.de/api/v2/stages/leave", {
                method: "POST",
                headers: {
                    "authorization": token,
                    'Content-Type': 'application/json'
                }
            }))
            .then(response => response.json())
            .then(json => json as { success: boolean })
            .then(result => result.success)
            .then(result => {
                Debugger.debug("Stage left", this);
                this.emit("left", this.stage as StageEvent);
                return result;
            })
    }

    registerDevice(device: IDevice, initialDatabaseDevice: DatabaseDevice): Promise<string> {
        return this.userRef
            .child("devices")
            .push(initialDatabaseDevice)
            .then(async (reference: firebase.database.Reference) => {
                await reference.onDisconnect().remove();
                if (reference.key) {
                    this.devices[reference.key] = device;
                    Debugger.debug("Device registered: " + reference.key, this);
                    this.emit("device-registered", {id: reference.key});
                    return reference.key;
                }
                throw new Error("No reference returned");
            });
    }

    unregisterDevice(deviceId: string): Promise<any> {
        return this.userRef
            .child("devices/" + deviceId)
            .remove()
            .then(() => {
                Debugger.debug("Device unregistered: " + deviceId, this);
                this.emit("device-unregistered", deviceId)
            })
    }

    updateDevice(deviceId: string, device: Partial<DatabaseDevice>): Promise<any> {
        return this.userRef
            .child("devices/" + deviceId)
            .update(device);
    }

    setRemoteMasterVolume(uid: string, volume: number): Promise<any> {
        return this.userRef
            .child("volumes/" + uid)
            .update({
                volume: volume
            });
    }

    setRemoteProducerVolume(id: string, volume: number): Promise<any> {
        return this.userRef
            .child("producers/" + id)
            .update({
                volume: volume
            });
    }

    setRemoteSoundjackVolume(id: string, volume: number): Promise<any> {
        return this.userRef
            .child("soundjacks/" + id)
            .update({
                volume: volume
            });
    }

    publishProducer(producer: DatabaseGlobalProducer): Promise<string> {
        return firebase.database()
            .ref("/producers")
            .push(producer)
            .then((reference: firebase.database.Reference) => {
                if (reference.key) {
                    Debugger.debug("Producer published: " + reference.key, this);
                    this.emit("producer-published", {id: reference.key, producer});
                    return reference.key;
                }
                throw new Error("No key received for publicated producer");
            })
    }

    publishSoundjack(soundjack: DatabaseGlobalSoundjack): Promise<string> {
        return firebase.database()
            .ref("/soundjacks")
            .push(soundjack)
            .then((reference: firebase.database.Reference) => {
                if (reference.key) {
                    Debugger.debug("Soundjack published: " + reference.key, this);
                    this.emit("soundjack-published", {id: reference.key, soundjack});
                    return reference.key;
                }
                throw new Error("No key received for publicated soundjack");
            })
    }

    unpublishProducer(id: string): Promise<any> {
        return firebase.database()
            .ref("/producers/" + id)
            .remove()
            .then(() => {
                Debugger.debug("Producer unpublished: " + id, this);
                this.emit("producer-unpublished", id)
            })
    }

    unpublishSoundjack(id: string): Promise<any> {
        return firebase.database()
            .ref("/soundjacks/" + id)
            .remove()
            .then(() => {
                Debugger.debug("Soundjack unpublished: " + id, this);
                this.emit("soundjack-unpublished", id)
            })
    }

}
