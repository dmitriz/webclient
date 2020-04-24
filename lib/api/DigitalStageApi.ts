import firebase from "firebase";

export interface Stage {

}

export interface Participant {

}

export default class DigitalStageApi {

    constructor() {
        if (typeof window !== "undefined")
            window.addEventListener("beforeunload", (ev) => {
                ev.preventDefault();
                this.disconnect();
            });
    }

    connect = (hostname: string, port: number): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
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
