import {IDeviceAPI} from "../IDeviceAPI";
import firebase from "firebase/app";
import "firebase/firestore";

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
    protected readonly port: number = 1234;
    protected isAvailable: boolean;
    protected webSocket: WebSocket;

    constructor(user: firebase.User) {
        super(user, {
            canAudio: true,
            canVideo: false
        });
        this.connect();
    }

    private connect() {
        const contactSoundjack = () => {
            console.log("Polling soundjack...");
            this.webSocket = new WebSocket("ws://localhost:" + this.port);
            this.webSocket.onerror = () => {
                console.log("Soundjack not available");
            }
            this.webSocket.onopen = () => {
                this.initialize();
            };
        }
        const isAvailable = () => this.isAvailable;
        const polling = setInterval(function () {
            if (isAvailable()) {
                clearInterval(polling);
            }
            contactSoundjack();
        }, 3000);
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
                ipv4: IDeviceAPI.ipv4 ? IDeviceAPI.ipv4 : null,
                ipv6: IDeviceAPI.ipv4 ? IDeviceAPI.ipv4 : null,
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
