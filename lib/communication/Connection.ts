import MediasoupController from "./mediasoup/MediasoupController";
import P2PController from "./p2p/P2PController";
import SoundjackController from "./soundjack/SoundjackController";
import firebase from "firebase";

export interface Stage {

}

export interface Participant {

}

export default class Connection {
    private mediasoupController: MediasoupController;
    private p2pController: P2PController;
    private soundjackController: SoundjackController;

    constructor() {
        if (typeof window !== "undefined")
            window.addEventListener("beforeunload", (ev) => {
                ev.preventDefault();
                this.disconnect();
            });
    }

    connect = (hostname: string, port: number): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            this.mediasoupController.connect();
            this.p2pController.connect();
            resolve(false);
        });
    };

    disconnect = () => {

    };

    createStage = (user: firebase.User, name: string, password?: string, type: 'theater' | 'music' | 'conference' = 'theater'): Promise<Stage> => {
        return new Promise<Stage>((resolve, reject) => {
            reject("Not implemented");
        });
    };

    joinStage = (user: firebase.User, stageId: string, password?: string): Promise<Stage> => {
        return new Promise<Stage>((resolve, reject) => {
            reject("Not implemented");
        });
    }
}
