import {DatabaseGlobalProducer} from "./DatabaseGlobalProducer";
import {DigitalStageAPI} from "..";
import {ProducerEvent} from "../api/DigitalStageAPI";
import {EventEmitter} from "events";

export abstract class AbstractProducer extends EventEmitter {
    protected readonly mApi: DigitalStageAPI;
    protected readonly mId: string;
    protected mLatestSnapshot: DatabaseGlobalProducer;

    protected constructor(api: DigitalStageAPI, id: string, initialData: DatabaseGlobalProducer) {
        super();
        this.mApi = api;
        this.mId = id;
        this.mLatestSnapshot = initialData;
        this.mApi.on("producer-changed", this.handleUpdate);
    }

    public get id() {
        return this.id;
    }

    public disconnect() {
        this.mApi.off("producer-changed", this.handleUpdate);
    }

    protected handleUpdate(event: ProducerEvent) {
        if (this.mId === event.id) {
            this.mLatestSnapshot = event.producer;
        }
    }

    public get deviceId() {
        return this.mLatestSnapshot.deviceId;
    }

    public get routerId() {
        return this.mLatestSnapshot.routerId;
    }

    public get producerId() {
        return this.mLatestSnapshot.producerId;
    }

    public abstract kind: "audio" | "video";
}
