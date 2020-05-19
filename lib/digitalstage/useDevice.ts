import firebase from "firebase/app";
import "firebase/database";
import * as publicIp from "public-ip";
import {Dispatch, SetStateAction, useEffect, useState} from "react";
import {DatabaseDevice} from "./model";

export interface Device {
    id?: string;
    ref?: firebase.database.Reference;
    sendAudio: boolean;
    setSendAudio: Dispatch<SetStateAction<boolean>>;
    sendVideo: boolean;
    setSendVideo: Dispatch<SetStateAction<boolean>>;
    receiveAudio: boolean;
    setReceiveVideo: Dispatch<SetStateAction<boolean>>;
    receiveVideo: boolean;
    setReceiveAudio: Dispatch<SetStateAction<boolean>>;
}

export const useDevice = (user: firebase.User, options?: {
    canAudio?: boolean;
    canVideo?: boolean;
}) => {
    const [ref, setRef] = useState<firebase.database.Reference>();
    const [sendAudio, setSendAudio] = useState<boolean>(false);
    const [sendVideo, setSendVideo] = useState<boolean>(false);
    const [receiveAudio, setReceiveAudio] = useState<boolean>(false);
    const [receiveVideo, setReceiveVideo] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            // CREATE DEVICE
            const init = async () => {
                const ipv4: string = await publicIp.v4();
                const ipv6: string = await publicIp.v6();
                const device: DatabaseDevice = {
                    uid: user.uid,
                    ipv4: ipv4,
                    ipv6: ipv6,
                    canAudio: options ? options.canAudio : false,
                    canVideo: options ? options.canVideo : false,
                    sendAudio: sendAudio,
                    sendVideo: sendVideo,
                    receiveAudio: receiveAudio,
                    receiveVideo: receiveVideo
                };
                console.log(device);
                return firebase
                    .database()
                    .ref("devices")
                    .push(device)
                    .then((ref: firebase.database.Reference) => {
                        ref.onDisconnect().remove();
                        return ref;
                    })
                    .then((ref: firebase.database.Reference) => {
                        setRef(ref);
                    })
                    .catch((error) => console.error(error));
            }
            init();
            return () => {
                if (ref)
                    ref.remove();
            }
        }
    }, [user]);

    useEffect(() => {
        if (ref) {
            ref.on("value", (doc: firebase.database.DataSnapshot) => {
                console.log("remote change");
                // DEVICE HAS BEEN UPDATED REMOTELY
                const device: DatabaseDevice = doc.val() as DatabaseDevice;
                setReceiveAudio(device.receiveAudio);
                setReceiveVideo(device.receiveVideo);
                setSendAudio(device.sendAudio);
                setSendVideo(device.sendVideo);

            });
        }
    }, [ref]);

    useEffect(() => {
        console.log("local change");
        if (ref) {
            ref.update({
                sendAudio: sendAudio,
                sendVideo: sendVideo,
                receiveAudio: receiveAudio,
                receiveVideo: receiveVideo
            });
        }
    }, [ref, receiveAudio, receiveVideo, sendAudio, sendVideo]);

    return {
        id: ref ? ref.key : undefined,
        ref,
        sendAudio,
        setSendAudio,
        sendVideo,
        setSendVideo,
        receiveAudio,
        setReceiveVideo,
        receiveVideo,
        setReceiveAudio
    }
};
