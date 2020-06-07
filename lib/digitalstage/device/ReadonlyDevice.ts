import AbstractDevice from "./AbstractDevice";
import firebase from "firebase/app";
import "firebase/database";

export default class LocalDevice extends AbstractDevice {
    constructor(user: firebase.User, deviceRef: firebase.database.Reference) {
        super(user, deviceRef);
        this.registerValueChangeListener();
    }
}
