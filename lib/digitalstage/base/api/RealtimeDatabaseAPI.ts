import {
    DeviceEvent,
    DigitalStageAPI,
    MemberEvent,
    ProducerEvent,
    SoundjackEvent,
    StageCreatedEvent,
    StageIdEvent,
    StageJoinedEvent,
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
import fetch from "isomorphic-unfetch";
import {Debugger} from "./../index";


export class RealtimeDatabaseAPI extends DigitalStageAPI {
    private readonly mUser: firebase.User;
    private readonly mUserRef: firebase.database.Reference;
    private mStageRef: firebase.database.Reference | undefined;
    private mConnected: boolean = false;

    constructor(user: firebase.User) {
        super();
        this.mUser = user;
        this.mUserRef = firebase.database().ref("users/" + this.mUser.uid);
    }

    public get connected() {
        return this.mConnected;
    }

    public connect() {
        this.addHandlers();
        this.mConnected = true;
        this.emit("connection-state-changed", true);
    }

    public disconnect() {
        this.removeHandlers();
        this.mConnected = false;
        this.emit("connection-state-changed", false);
    }

    public getUid(): string {
        return this.mUser.uid;
    }

    protected removeHandlers() {
        this.removeStageHandlers();
        if (this.mUserRef) {
            this.mUserRef.child("stageId").off();
            this.mUserRef.child("devices").off();
            this.mUserRef.child("producers").off();
            this.mUserRef.child("soundjacks").off();
            this.mUserRef.child("volumes").off();
        }
    }

    protected addHandlers() {
        this.mUserRef
            .child("stageId")
            .on("value", async snapshot => {
                const stageId: string | null = snapshot.val();
                if (stageId) {
                    Debugger.debug("stageId changed to: " + stageId, this);
                    this.mStageRef = firebase.database().ref("stages/" + stageId);
                    this.addStageHandlers();
                    this.emit("stage-id-changed", stageId as StageIdEvent);
                } else {
                    Debugger.debug("stageId changed to null, clean up stage handlers ", this);
                    this.removeStageHandlers();
                    this.mStageRef = undefined;
                    this.emit("stage-id-changed", undefined as StageIdEvent);
                }
            }, this.handleFirebaseError)
        this.mUserRef
            .child("devices")
            .on("child_added", snapshot => {
                if (snapshot.key) {
                    const dbDevice: DatabaseDevice = snapshot.val();
                    const deviceId: string = snapshot.key;
                    Debugger.debug("Device added: " + deviceId, this);
                    this.emit("device-added", {id: deviceId, device: dbDevice} as DeviceEvent);
                }
            }, this.handleFirebaseError)
        this.mUserRef
            .child("devices")
            .on("child_changed", snapshot => {
                if (snapshot.key) {
                    const deviceId: string = snapshot.key;
                    Debugger.debug("Device changed: " + deviceId, this);
                    this.emit("device-changed", {
                        id: snapshot.key,
                        device: snapshot.val()
                    } as DeviceEvent);
                }
            }, this.handleFirebaseError)
        this.mUserRef
            .child("devices")
            .on("child_removed", snapshot => {
                if (snapshot.key) {
                    const deviceId: string = snapshot.key;
                    Debugger.debug("Device removed: " + deviceId, this);
                    this.emit("device-removed", {
                        id: snapshot.key,
                        device: snapshot.val()
                    } as DeviceEvent);
                }
            }, this.handleFirebaseError)
        this.mUserRef
            .child("producers")
            .on("child_added", snapshot => {
                Debugger.debug("Producer added: " + snapshot.key, this);
                const producer: DatabaseUserRemoteProducer = snapshot.val();
                this.emit("producer-added", {id: snapshot.key, producer: producer} as ProducerEvent);
            }, this.handleFirebaseError)
        this.mUserRef
            .child("producers")
            .on("child_changed", snapshot => {
                Debugger.debug("Producer changed: " + snapshot.key, this);
                const producer: DatabaseUserRemoteProducer = snapshot.val();
                this.emit("producer-changed", {id: snapshot.key, producer: producer} as ProducerEvent);
            }, this.handleFirebaseError)
        this.mUserRef
            .child("producers")
            .on("child_removed", snapshot => {
                Debugger.debug("Producer removed: " + snapshot.key, this);
                const producer: DatabaseUserRemoteProducer = snapshot.val();
                this.emit("producer-removed", {id: snapshot.key, producer: producer} as ProducerEvent);
            }, this.handleFirebaseError)
        this.mUserRef
            .child("soundjacks")
            .on("child_added", snapshot => {
                Debugger.debug("Soundjack added: " + snapshot.key, this);
                const soundjack: DatabaseUserRemoteSoundjack = snapshot.val();
                this.emit("soundjack-added", {id: snapshot.key, soundjack: soundjack} as SoundjackEvent);
            }, this.handleFirebaseError)
        this.mUserRef
            .child("soundjacks")
            .on("child_changed", snapshot => {
                Debugger.debug("Soundjack changed: " + snapshot.key, this);
                const soundjack: DatabaseUserRemoteSoundjack = snapshot.val();
                this.emit("soundjack-changed", {id: snapshot.key, soundjack: soundjack} as SoundjackEvent);
            }, this.handleFirebaseError)
        this.mUserRef
            .child("soundjacks")
            .on("child_removed", snapshot => {
                Debugger.debug("Soundjack removed: " + snapshot.key, this);
                const soundjack: DatabaseUserRemoteSoundjack = snapshot.val();
                this.emit("soundjack-removed", {id: snapshot.key, soundjack: soundjack} as SoundjackEvent);
            }, this.handleFirebaseError)
        this.mUserRef
            .child("volumes")
            .on("child_added", snapshot => {
                Debugger.debug("Volume added: " + snapshot.key, this);
                const volume: number = snapshot.val().volume;
                this.emit("volume-added", {uid: snapshot.key, volume: volume} as VolumeEvent);
            }, this.handleFirebaseError)
        this.mUserRef
            .child("volumes")
            .on("child_changed", snapshot => {
                Debugger.debug("Volume changed: " + snapshot.key, this);
                const volume: number = snapshot.val().volume;
                this.emit("volume-changed", {uid: snapshot.key, volume: volume} as VolumeEvent);
            }, this.handleFirebaseError)
        this.mUserRef
            .child("volumes")
            .on("child_removed", snapshot => {
                Debugger.debug("Volume removed: " + snapshot.key, this);
                const volume: number = snapshot.val().volume;
                this.emit("volume-removed", {uid: snapshot.key, volume: volume} as VolumeEvent);
            }, this.handleFirebaseError)
    }

    private addStageHandlers() {
        Debugger.debug("initStageMemberHandler() with " + (this.mStageRef ? "valid" : "undefined") + " stageref", this);
        if (this.mStageRef && this.mStageRef.key) {
            this.mStageRef
                .child("members")
                .on("child_added", snapshot => {
                    Debugger.debug("Member added: " + snapshot.key, this);
                    const member: DatabaseStageMember = snapshot.val();
                    this.emit("member-added", {uid: snapshot.key, member: member} as MemberEvent);
                }, this.handleFirebaseError)
            this.mStageRef
                .child("members")
                .on("child_changed", snapshot => {
                    Debugger.debug("Member changed: " + snapshot.key, this);
                    const member: DatabaseStageMember = snapshot.val();
                    this.emit("member-changed", {uid: snapshot.key, member: member} as MemberEvent);
                }, this.handleFirebaseError)
            this.mStageRef
                .child("members")
                .on("child_removed", snapshot => {
                    Debugger.debug("Member removed: " + snapshot.key, this);
                    const member: DatabaseStageMember = snapshot.val();
                    this.emit("member-removed", {uid: snapshot.key, member: member} as MemberEvent);
                    if (snapshot.key === this.getUid()) {
                        this.removeStageHandlers();
                    }
                }, this.handleFirebaseError)
            this.mStageRef
                .child("name")
                .on("value", snapshot => {
                    this.emit("stage-name-changed", snapshot.val());
                });
            this.mStageRef
                .child("password")
                .on("value", snapshot => {
                    this.emit("stage-password-changed", snapshot.val());
                });
            this.mStageRef
                .child("click")
                .on("value", snapshot => {
                    const data: {
                        startTime: number;
                        playing: boolean;
                    } = snapshot.val();
                    Debugger.debug("Click available: " + data.startTime, this);
                    this.emit("click", data);
                });
        }
    }

    private removeStageHandlers() {
        if (this.mStageRef) {
            this.mStageRef
                .child("members")
                .off();
            this.mStageRef
                .child("name")
                .off();
            this.mStageRef
                .child("password")
                .off();
            this.mStageRef
                .child("click")
                .off();
        }
    }

    private handleFirebaseError(error: Error) {
        Debugger.handleError(error, this);
    }


    createStage(name: string, password?: string): Promise<DatabaseStage> {
        if (!this.mConnected) {
            return Promise.reject("Not connected, please call connect() first");
        }
        return this.mUser
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
                this.emit("created", stage as StageCreatedEvent);
                this.emit("joined", stage as StageJoinedEvent);
                return stage;
            })
    }

    joinStage(stageId: string, password?: string): Promise<DatabaseStage> {
        if (!this.mConnected) {
            return Promise.reject("Not connected, please call connect() first");
        }
        return this.mUser
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
                this.emit("joined", stage as StageJoinedEvent);
                return stage;
            })
    }

    leaveStage(): Promise<boolean> {
        return this.mUser
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
                this.emit("left", this.mStageRef.key);
                return result;
            })
    }

    registerDevice(device: IDevice): Promise<string> {
        return this.mUserRef
            .child("devices")
            .push({
                uid: this.getUid(),
                name: device.name,
                caption: device.caption,
                canAudio: device.canAudio,
                canVideo: device.canVideo,
                sendAudio: device.sendAudio,
                sendVideo: device.sendVideo,
                receiveVideo: device.receiveVideo,
                receiveAudio: device.receiveAudio,
                error: device.error ? device.error : null,
                audioDevices: device.audioDevices,
                inputAudioDevice: device.inputAudioDevice ? device.inputAudioDevice : null,
                outputAudioDevice: device.outputAudioDevice ? device.outputAudioDevice : null
            } as DatabaseDevice)
            .then(async (reference: firebase.database.Reference) => {
                await reference.onDisconnect().remove();
                if (reference.key) {
                    this.emit("device-registered", {id: reference.key});
                    Debugger.debug("Device registered: " + reference.key, this);
                    return reference.key;
                }
                throw new Error("No reference returned");
            });
    }

    unregisterDevice(deviceId: string): Promise<any> {
        return this.mUserRef
            .child("devices/" + deviceId)
            .remove()
            .then(() => {
                Debugger.debug("Device unregistered: " + deviceId, this);
                this.emit("device-unregistered", deviceId)
            })
    }

    updateDevice(deviceId: string, device: Partial<DatabaseDevice>): Promise<any> {
        return this.mUserRef
            .child("devices/" + deviceId)
            .update(device);
    }

    setRemoteMasterVolume(uid: string, volume: number): Promise<any> {
        return this.mUserRef
            .child("volumes/" + uid)
            .update({
                volume: volume
            });
    }

    setRemoteProducerVolume(id: string, volume: number): Promise<any> {
        return this.mUserRef
            .child("producers/" + id)
            .update({
                volume: volume
            });
    }

    setRemoteSoundjackVolume(id: string, volume: number): Promise<any> {
        return this.mUserRef
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

    startClick(startTime: number): Promise<any> {
        if (this.mStageRef) {
            return this.mStageRef
                .child("click")
                .update({
                    startTime: startTime,
                    playing: true
                });
        }
        return Promise.resolve();
    }

    stopClick(): Promise<any> {
        if (this.mStageRef) {
            return this.mStageRef
                .child("click")
                .update({
                    playing: false
                });
        }
        return Promise.resolve();
    }

}
