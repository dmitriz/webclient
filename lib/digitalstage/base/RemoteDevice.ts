import {DigitalStageAPI} from "./api/DigitalStageAPI";
import {DatabaseDevice} from "./types";
import {RealtimeDatabaseDevice} from "./RealtimeDatabaseDevice";

export class RemoteDevice extends RealtimeDatabaseDevice {
    public constructor(api: DigitalStageAPI, deviceId: string, initialOptions: DatabaseDevice) {
        super(api, true);
        this.setDeviceId(deviceId);
        this.mLatestSnapshot = initialOptions;
    }
}
