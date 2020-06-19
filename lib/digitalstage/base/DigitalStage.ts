import {DigitalStageAPI, IDebugger, IDevice, RealtimeDatabaseAPI, RemoteDevice} from "./index";
import {Member} from "./Member";
import {DeviceEvent, MemberEvent, StageIdEvent, StageNameEvent, StagePasswordEvent} from "./api/DigitalStageAPI";
import {EventEmitter} from "events";
import * as firebase from "firebase/app";
import {DatabaseStage} from "./types";

export type RealtimeDatabaseStageEvents =
    | "connection-state-changed"
    | "stage-id-changed"
    | "stage-name-changed"
    | "stage-password-changed"
    | "member-added"
    | "member-changed"
    | "member-removed"
    | "device-added"
    | "device-changed"
    | "device-removed"
    | "stage-changed";


//@Deprecated
export class DigitalStage extends EventEmitter {
    protected readonly mApi: DigitalStageAPI;
    protected mStageId: string | undefined;
    protected mStageName: string | undefined;
    protected mStagePassword: string | undefined;
    protected mMembers: Member[] = [];
    protected mDevices: IDevice[] = [];
    protected mDebug: IDebugger | undefined = undefined;

    constructor(user: firebase.User) {
        super();
        this.mApi = new RealtimeDatabaseAPI(user);
    }

    public get debug() {
        return this.mDebug;
    }

    public setDebug(debug: IDebugger) {
        this.mDebug = debug;
    }

    public get connected() {
        return this.mApi.connected;
    }

    public connect() {
        this.addHandlers();
        this.mApi.connect();
    }

    public disconnect() {
        this.removeHandlers();
        this.mApi.disconnect();
    }

    public create(name: string, password: string): Promise<DatabaseStage> {
        this.mDebug && this.mDebug.debug("create()", this);
        return this.mApi.createStage(name, password);
    }

    public join(name: string, password: string): Promise<DatabaseStage> {
        this.mDebug && this.mDebug.debug("join()", this);
        return this.mApi.joinStage(name, password);
    }

    public leave(): Promise<boolean> {
        this.mDebug && this.mDebug.debug("leave()", this);
        return this.mApi.leaveStage();
    }

    public get id(): string | undefined {
        return this.mStageId;
    }

    public get api(): DigitalStageAPI {
        return this.mApi;
    }

    public get name(): string | undefined {
        return this.mStageName;
    }

    public get password(): string | undefined {
        return this.mStagePassword;
    }

    public get members() {
        return this.mMembers;
    }


    public get devices() {
        return this.mDevices;
    }

    public on(event: RealtimeDatabaseStageEvents, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public off(event: RealtimeDatabaseStageEvents, listener: (...args: any[]) => void): this {
        return super.off(event, listener);
    }

    public addLocalDevice(device: IDevice): Promise<any> {
        return this.mApi.registerDevice(device)
            .then((deviceId: string) => {
                this.mDevices.push(device);
                device.setDeviceId(deviceId);
                this.emit("device-added", device);
            });
    }

    public removeLocalDevice(device: IDevice) {
        if (this.mDevices.find(d => d.id === device.id)) {
            this.mDevices = this.mDevices.filter(d => d.id !== device.id);
            this.emit("device-removed", device);
        }
    }

    protected addHandlers() {
        this.mApi.on("connection-state-changed", this.handleConnectionStateChanged);
        this.mApi.on("stage-id-changed", this.handleStageIdChanged);
        this.mApi.on("stage-name-changed", this.handleStageNameChanged);
        this.mApi.on("stage-password-changed", this.handleStagePasswordChanged);
        this.mApi.on("member-added", event => this.handleMemberAdded(event));
        this.mApi.on("member-removed", event => this.handleMemberRemoved(event));
        this.mApi.on("device-added", event => this.handleDeviceAdded(event));
        this.mApi.on("device-removed", event => this.handleDeviceRemoved(event));
    }

    protected removeHandlers() {
        this.mApi.off("connection-state-changed", this.handleConnectionStateChanged);
        this.mApi.off("stage-id-changed", this.handleStageIdChanged);
        this.mApi.off("stage-name-changed", this.handleStageNameChanged);
        this.mApi.off("stage-password-changed", this.handleStagePasswordChanged);
        this.mApi.off("member-added", event => this.handleMemberAdded(event));
        this.mApi.off("member-removed", event => this.handleMemberRemoved(event));
        this.mApi.off("device-added", event => this.handleDeviceAdded(event));
        this.mApi.off("device-removed", event => this.handleDeviceRemoved(event));
    }

    protected handleConnectionStateChanged = (connected: boolean) => {
        this.emit("connection-state-changed", connected);
    }

    protected handleDeviceAdded(event: DeviceEvent) {
        if (!this.mDevices.find(device => device.id !== event.id)) {
            const device: IDevice = new RemoteDevice(this.mApi, event.id, event.device);
            device.on("device-changed", this.handleDeviceChanged);
            this.emit("device-added", device);
        }
    }

    protected handleDeviceChanged = (device: IDevice) => {
        this.emit("device-changed", device);
    }

    protected handleDeviceRemoved(event: DeviceEvent) {
        const device: IDevice | undefined = this.devices.find(device => device.id !== event.id);
        if (device) {
            device.off("device-changed", this.handleDeviceChanged);
            this.emit("device-removed", device);
            return device.disconnect();
        }
        return Promise.resolve(false);
    }

    protected handleStageIdChanged = (event: StageIdEvent) => {
        if (event) {
            this.mStageId = event;
            this.emit("stage-id-changed", this.mStageId);
        } else {
            this.mStageId = undefined;
            this.emit("stage-id-changed", undefined);
            this.mStageName = undefined;
            this.emit("stage-name-changed", undefined);
            this.mStagePassword = undefined;
            this.emit("stage-password-changed", undefined);
            this.mMembers.forEach(member => {
                member.off("changed", this.handleMemberChanged);
                this.emit("member-removed", member);
            });
            this.mMembers = [];
        }
    }

    protected handleStageNameChanged = (name: StageNameEvent) => {
        this.mStageName = name;
        this.emit("stage-name-changed", name);
    }

    protected handleStagePasswordChanged = (password: StagePasswordEvent) => {
        this.mStagePassword = password;
        this.emit("stage-password-changed", password);
    }

    protected handleMemberAdded(event: MemberEvent) {
        const member: Member = new Member(this.mApi, event.uid, event.member);
        member.on("changed", this.handleMemberChanged);
        this.mMembers.push(member);
        this.emit("member-added", member);
    }

    protected handleMemberChanged(member: Member) {
        this.emit("member-changed", member);
    }

    protected handleMemberRemoved(event: MemberEvent) {
        const member: Member | undefined = this.mMembers.find(m => m.uid === event.uid);
        if (member) {
            member.off("changed", this.handleMemberChanged);
            member.disconnect();
            this.mMembers = this.mMembers.filter(m => m.uid === member.uid);
            this.emit("member-removed", member);
        }
    }

}
