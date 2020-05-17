import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import {Device} from "./databaseModels";
import MediasoupConnector from "./MediasoupConnector";
import SoundjackConnector from "./SoundjackConnector";


export class DeviceConnector {
    private deviceRef: firebase.firestore.DocumentReference;
    private user: firebase.UserInfo;

    constructor(user: firebase.UserInfo) {
        this.user = user;
    }

    connect = (options: {
        canAudio: boolean;
        canVideo: boolean;
    }): Promise<firebase.firestore.DocumentReference> => {
        return firebase.firestore().collection("devices").add({
            uid: this.user.uid,
            canAudio: options.canAudio,
            canVideo: options.canVideo,
            streamAudio: false,
            streamVideo: false,
            receiveVideo: false,
            receiveAudio: false
        } as Device)
            .then((ref: firebase.firestore.DocumentReference) => {
                ref.onSnapshot((snapshot => {
                    this.handleDeviceChange(snapshot.data() as Device);
                }));
                this.deviceRef = ref;
                return this.deviceRef;
            });
    }

    handleDeviceChange = (device: Device) => {
        if (device.receiveAudio) {
            MediasoupConnector.startReceivingAudio();
            SoundjackConnector.startReceivingAudio();
        } else {
            MediasoupConnector.stopReceivingAudio();
            SoundjackConnector.stopReceivingAudio();
        }
        if (device.receiveVideo) {
            MediasoupConnector.startReceivingVideo();
        } else {
            MediasoupConnector.stopReceivingVideo();
        }
        if (device.streamAudio) {
            if (device.streamAudio === "mediasoup") {
                SoundjackConnector.stopStreamingAudio();
                MediasoupConnector.startStreamingAudio();
            } else if (device.streamAudio === "soundjack") {
                MediasoupConnector.stopStreamingAudio();
                SoundjackConnector.startStreamingAudio();
            }
        } else {
            MediasoupConnector.stopStreamingAudio();
            SoundjackConnector.stopStreamingAudio();
        }
    }

    disconnect = (): Promise<void> => {
        // TODO: We still have to implement a better approach, see https://firebase.google.com/docs/firestore/solutions/presence#using_presence_in_realtime_database
        if (this.deviceRef) {
            return this.deviceRef.delete();
        }
    }


}