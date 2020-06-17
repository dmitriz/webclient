import {DigitalStageAPI, IDevice, RemoteDevice} from "./index";
import {Member} from "./Member";
import {DeviceEvent, MemberEvent, StageIdEvent, StageNameEvent, StagePasswordEvent} from "./api/DigitalStageAPI";
import {EventEmitter} from "events";

export type RealtimeDatabaseStageEvents =
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


export class DigitalStage extends EventEmitter {
    protected readonly mApi: DigitalStageAPI;
    protected mStageId: string | undefined;
    protected mStageName: string | undefined;
    protected mStagePassword: string | undefined;
    protected mMembers: Member[] = [];
    protected mDevices: IDevice[] = [];

    constructor(api: DigitalStageAPI) {
        super();
        this.mApi = api;
        this.addHandlers();
    }

    public get id(): string {
        return this.mStageId;
    }

    public get name(): string {
        return this.mStageName;
    }

    public get password(): string {
        return this.mStagePassword;
    }

    public get members(): Member[] {
        return this.mMembers;
    }


    public get devices(): IDevice[] {
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

    private addHandlers() {
        this.mApi.on("stage-id-changed", this.handleStageIdChanged);
        this.mApi.on("stage-name-changed", this.handleStageNameChanged);
        this.mApi.on("stage-password-changed", this.handleStagePasswordChanged);
        this.mApi.on("member-added", this.handleMemberAdded);
        this.mApi.on("member-removed", this.handleMemberRemoved);
        this.mApi.on("device-added", this.handleDeviceAdded);
        this.mApi.on("device-removed", this.handleDeviceRemoved);
    }

    public removeHandlers() {
        this.mApi.off("stage-id-changed", this.handleStageIdChanged);
        this.mApi.off("stage-name-changed", this.handleStageNameChanged);
        this.mApi.off("stage-password-changed", this.handleStagePasswordChanged);
        this.mApi.off("member-added", this.handleMemberAdded);
        this.mApi.off("member-removed", this.handleMemberRemoved);
        this.mApi.off("device-added", this.handleDeviceAdded);
        this.mApi.off("device-removed", this.handleDeviceRemoved);
    }

    private handleDeviceAdded = (event: DeviceEvent) => {
        if (!this.devices.find(device => device.id !== event.id)) {
            const device: IDevice = new RemoteDevice(this.mApi, event.id, event.device);
            device.on("device-changed", this.handleDeviceChanged);
            this.emit("device-added", device);
        }
    }

    private handleDeviceChanged = (device: IDevice) => {
        this.emit("device-changed", device);
    }

    private handleDeviceRemoved = (event: DeviceEvent) => {
        const device: IDevice = this.devices.find(device => device.id !== event.id);
        if (device) {
            device.off("device-changed", this.handleDeviceChanged);
            this.emit("device-removed", device);
        }
    }

    private handleStageIdChanged = (event: StageIdEvent) => {
        if (event) {
            this.mStageId = event;
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

    private handleMemberAdded = (event: MemberEvent) => {
        const member: Member = new Member(this.mApi, event.uid, event.member);
        member.on("changed", this.handleMemberChanged);
        this.mMembers.push(member);
        this.emit("member-added", member);
    }

    private handleMemberChanged = (member: Member) => {
        this.emit("member-changed", member);
    }

    private handleMemberRemoved = (event: MemberEvent) => {
        const member: Member = this.mMembers.find(m => m.uid === event.uid);
        if (member) {
            member.off("changed", this.handleMemberChanged);
            this.mMembers = this.mMembers.filter(m => m.uid === member.uid);
            this.emit("member-removed", member);
        }
    }

}
