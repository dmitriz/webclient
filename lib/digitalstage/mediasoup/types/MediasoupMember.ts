import {Member} from "../../base/Member";
import {DigitalStageAPI} from "../../base";
import {Consumer} from "../types";
import {DatabaseStageMember} from "../../base/types";


export class MediasoupMember extends Member {
    protected mConsumers: Consumer[] = [];

    constructor(api: DigitalStageAPI, uid: string, initialData: DatabaseStageMember) {
        super(api, uid, initialData);
    }

    public addConsumer(consumer: Consumer) {
        this.mConsumers.push(consumer);
        this.emit("consumer-added", consumer);
        this.emit("changed", this);
    }

    public removeConsumer(consumer: Consumer) {
        this.mConsumers = this.mConsumers.filter(c => c.consumer.id !== consumer.consumer.id);
        this.emit("consumer-removed", consumer);
        this.emit("changed", this);
    }

    public get consumers(): Consumer[] {
        return this.mConsumers;
    }
}
