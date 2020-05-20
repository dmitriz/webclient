import {IDeviceAPI} from "../IDeviceAPI";
import firebase from "firebase/app";
import "firebase/auth";

interface SoudjackNode {
    uid: string;        // Globally unique
    stageId: string;    // Globally unique
    deviceId: string;   // Globally unique
    ipv4: string;
    ipv6: string;
    port: number;
}

export default class LocalSoundjackDevice extends IDeviceAPI {
    private unlistenRemoteSoudjacks: () => void;
    protected stageId: string = null;
    protected readonly port: number = 50000;
    protected isAvailable: boolean;
    protected readonly webSocket: WebSocket;

    constructor(user: firebase.User) {
        super(user, {
            canAudio: true,
            canVideo: false
        });
        this.webSocket = new WebSocket("localhost:" + this.port);
        this.webSocket.onopen = () => {
            this.initialize();
        };
    }

    private initialize() {
        //TODO: Implement websocket intercommunication

        this.isAvailable = true;
        if (this.stageId) {
            this.enableStageListeners();
        }
    }

    private handleRemoteSoundjackNode = (querySnapshot: firebase.firestore.QuerySnapshot) => {
        return querySnapshot.docChanges().forEach((change: firebase.firestore.DocumentChange<SoudjackNode>) => {
            const soundjackNode: SoudjackNode = change.doc.data();
            if (change.type === "added") {
                this.connectTo(soundjackNode)
            }
            if (change.type === "removed") {
                this.disconnectFrom(soundjackNode)
            }
        })
    };

    private connectTo(soundjackNode: SoudjackNode) {
        if (!this.isAvailable)
            return;
        console.log("TODO: Implement soundjack connection to " + soundjackNode.ipv4 + ":" + soundjackNode.port);
    }

    private disconnectFrom(soundjackNode: SoudjackNode) {
        if (!this.isAvailable)
            return;
        console.log("TODO: Implement soundjack disconnection from " + soundjackNode.ipv4 + ":" + soundjackNode.port);
    }

    private enableStageListeners = () => {
        firebase.firestore()
            .collection("soundjacks")
            .add({
                ipv4: this.ipv4,
                ipv6: this.ipv6,
                port: this.port,
                stageId: this.stageId,
                deviceId: this.getDeviceId()
            } as SoudjackNode)
            .then((ref: firebase.firestore.DocumentReference) => {
                console.log("Published soundjack " + ref.id);
                this.emit("soundjack-published", ref.id);
            })
        this.unlistenRemoteSoudjacks = firebase.firestore()
            .collection("users/" + this.user.uid + "/soundjacks")
            .onSnapshot(snapshot => this.handleRemoteSoundjackNode);
    }
    private disableStageListeners = () => {
        this.unlistenRemoteSoudjacks();
        firebase.firestore()
            .collection("producers")
            .where("deviceId", "==", this.getDeviceId())
            .get()
            .then((snapshots: firebase.firestore.QuerySnapshot) => snapshots.forEach((snapshot) => snapshot.ref.delete()));
    }

    public setStageId(stageId: string) {
        if (this.stageId === stageId)
            return;
        if (!this.isAvailable) {
            return;
        }
        this.stageId = stageId;
        if (this.stageId) {
            this.enableStageListeners();
        } else {
            this.disableStageListeners();
        }
    }


}
