import AbstractDevice from "./AbstractDevice";
import firebase from "firebase/app";
import "firebase/database";
import DatabaseDevice from "./deviceTypes/DatabaseDevice";

export default class LocalDevice extends AbstractDevice {

    constructor(user: firebase.User, name: string, options?: {
        caption?: string;
        canAudio: boolean;
        canVideo: boolean;
    }) {
        super(user, firebase.database().ref("devices").push());
        this.deviceRef.onDisconnect().remove();
        this.deviceRef.set({
            uid: user.uid,
            name: name,
            caption: options && options.caption ? options.caption : "",
            canAudio: options ? options.canAudio : false,
            canVideo: options ? options.canAudio : false,
            sendVideo: false,
            sendAudio: false,
            receiveAudio: false,
            receiveVideo: false
        } as DatabaseDevice)
            .then(() => {
                console.log("Go next")
                this.registerValueChangeListener()
            });
    }
}
