import {DigitalStageExtension} from "../base/types/DigitalStageExtension";
import {DigitalStageAPI, IDevice, RealtimeDatabaseDevice} from "../base";
import {Member} from "../base/Member";
import {AbstractProducer} from "../base/types/AbstractProducer";


export class MediasoupExtension extends RealtimeDatabaseDevice implements DigitalStageExtension {
    private readonly mApi: DigitalStageAPI;
    private mIsConnected: boolean = false;

    constructor(api: DigitalStageAPI) {
        super();
        this.mApi = api;
    }

    connect() {
        this.mApi.registerDevice();
    }

    disconnect() {
        this.mApi.unregisterDevice();
    }

    extendDeviceAdded(device: IDevice): IDevice {
        return device;
    }

    extendDeviceChanged(device: IDevice): IDevice {
        return device;
    }

    extendDeviceRemoved(device: IDevice): IDevice {
        return device;
    }

    extendMemberAdded(member: Member): Member {
        member.on("producer-added", this.handleProducerAdded)
        member.on("producer-changed", this.handleProducerChanged)
        member.on("producer-removed", this.handleProducerRemoved)

        return member;
    }

    private handleProducerAdded(producer: AbstractProducer) {
        if (this.mIsConnected) {
            this.connect();
        }

    }

    private handleProducerChanged(producer: AbstractProducer) {

    }

    private handleProducerRemoved(producer: AbstractProducer) {

    }

    extendMemberChanged(member: Member): Member {
        return member;
    }

    extendMemberRemoved(member: Member): Member {
        return member;
    }

}
