import {DigitalStage} from "../base/DigitalStage";
import {DigitalStageAPI} from "../base";
import {MediasoupDevice} from "./MediasoupDevice";
import {Consumer} from "./types/Consumer";
import {MediasoupMember} from "./types/MediasoupMember";


export class DigitalStageWithMediasoup extends DigitalStage {
    protected readonly mDevice: MediasoupDevice;
    protected mMembers: MediasoupMember[] = [];

    constructor(api: DigitalStageAPI) {
        super(api);
        this.mDevice = new MediasoupDevice(api);
        this.addMediasoupHandlers();
        this.addLocalDevice(this.mDevice)
            .then(() => this.mDevice.connect());
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


    public removeHandlers() {
        this.device.disconnect();
        this.removeMediasoupHandlers();
        super.removeHandlers();
    }
}
