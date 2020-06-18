import {DigitalStage} from "../base/DigitalStage";
import {MediasoupDevice} from "./MediasoupDevice";
import {Consumer} from "./types/Consumer";
import {MediasoupMember} from "./types/MediasoupMember";
import * as firebase from "firebase/app";
import {DeviceEvent, MemberEvent} from "../base/api/DigitalStageAPI";


export class DigitalStageWithMediasoup extends DigitalStage {
    protected mDevice: MediasoupDevice;
    protected mMembers: MediasoupMember[] = [];

    constructor(user: firebase.User) {
        super(user);
    }

    public connect(): Promise<boolean> {
        super.connect();
        this.mDevice = new MediasoupDevice(this.mApi);
        this.addMediasoupHandlers();
        return this.addLocalDevice(this.mDevice)
            .then(() => this.mDevice.connect());
    }

    public disconnect(): Promise<any> {
        return this.mDevice.disconnect()
            .then(() => this.removeLocalDevice(this.mDevice))
            .finally(() => {
                this.removeHandlers();
                super.disconnect();
            });
    }


    protected handleDeviceAdded(event: DeviceEvent) {
        if (event.id !== this.mDevice.id)
            super.handleDeviceAdded(event)
    };

    public get members() {
        return this.mMembers;
    }

    public get device() {
        return this.mDevice;
    }

    private addMediasoupHandlers() {
        this.mDevice.on("consumer-added", this.handleConsumerAdded);
        this.mDevice.on("consumer-removed", this.handleConsumerRemoved);
    }

    protected handleMemberAdded(event: MemberEvent) {
        const member: MediasoupMember = new MediasoupMember(this.mApi, event.uid, event.member);
        member.on("changed", this.handleMemberChanged);
        this.mMembers.push(member);
        this.emit("member-added", member);
    }

    private handleConsumerAdded = (consumer: Consumer) => {
        const member: MediasoupMember = this.mMembers.find(member => member.uid === consumer.globalProducer.uid);
        if (member) {
            member.addConsumer(consumer);
        }
    }

    private handleConsumerRemoved = (consumer: Consumer) => {
        const member: MediasoupMember = this.mMembers.find(member => member.uid === consumer.globalProducer.uid);
        if (member) {
            member.removeConsumer(consumer);
        }
    }

    private removeMediasoupHandlers() {
        this.mDevice.off("consumer-added", this.handleConsumerAdded);
        this.mDevice.off("consumer-removed", this.handleConsumerRemoved);
    }


    protected removeHandlers() {
        this.device.disconnect();
        this.removeMediasoupHandlers();
        super.removeHandlers();
    }
}
