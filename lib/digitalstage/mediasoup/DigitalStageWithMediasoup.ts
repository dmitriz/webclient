import {DigitalStage} from "../base/DigitalStage";
import {MediasoupDevice} from "./MediasoupDevice";
import {Consumer} from "./types/Consumer";
import {MediasoupMember} from "./types/MediasoupMember";
import * as firebase from "firebase/app";


export class DigitalStageWithMediasoup extends DigitalStage {
    protected mDevice: MediasoupDevice;
    protected mMembers: MediasoupMember[] = [];

    constructor(user: firebase.User) {
        super(user);
    }

    public connect() {
        super.connect();
        this.mDevice = new MediasoupDevice(this.mApi);
        this.addMediasoupHandlers();
        this.addLocalDevice(this.mDevice)
            .then(() => this.mDevice.connect());
    }

    public disconnect() {
        this.removeHandlers();
        super.disconnect();
    }

    public get device() {
        return this.mDevice;
    }

    private addMediasoupHandlers() {
        this.mDevice.on("consumer-added", this.handleConsumerAdded);
        this.mDevice.on("consumer-removed", this.handleConsumerRemoved);
    }

    private handleConsumerAdded(consumer: Consumer) {
        const member: MediasoupMember = this.mMembers.find(member => member.uid === consumer.globalProducer.uid);
        if (member) {
            member.addConsumer(consumer);
        }
    }

    private handleConsumerRemoved(consumer: Consumer) {
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
