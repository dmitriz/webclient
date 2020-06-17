import {Member} from "../Member";
import {IDevice} from "../index";

export interface DigitalStageExtension {
    extendMemberAdded(member: Member): Member;

    extendMemberChanged(member: Member): Member;

    extendMemberRemoved(member: Member): Member;

    extendDeviceAdded(device: IDevice): IDevice;

    extendDeviceChanged(device: IDevice): IDevice;

    extendDeviceRemoved(device: IDevice): IDevice;
}
