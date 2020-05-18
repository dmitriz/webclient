import firebase from "firebase/app";
import "firebase/database";
import * as publicIp from "public-ip";
import {useEffect, useState} from "react";

interface Device {
    ipv4: string;
    ipv6: string;

    canAudio: boolean;
    canVideo: boolean;

    sendAudio: boolean;
    sendVideo: boolean;
    receiveAudio: boolean;
    receiveVideo: boolean;
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
                return firebase
                    .database()
                    .ref()
                    .child("devices")
                    .push({
                        uid: user.uid,
                        ipv4: ipv4,
                        ipv6: ipv6,
                        canAudio: options ? options.canAudio : false,
                        canVideo: options ? options.canVideo : false,
                        sendAudio: sendAudio,
                        sendVideo: sendVideo,
                        receiveAudio: receiveAudio,
                        receiveVideo: receiveVideo
                    } as Device)
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
        }
    }, [user]);

    useEffect(() => {
        if (ref) {
            ref.on("value", (doc: firebase.database.DataSnapshot) => {
                console.log("remote change");
                // DEVICE HAS BEEN UPDATED REMOTELY
                const device: Device = doc.val() as Device;
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
            ref.set({
                sendAudio: sendAudio,
                sendVideo: sendVideo,
                receiveAudio: receiveAudio,
                receiveVideo: receiveVideo
            });
        }
    }, [ref, receiveAudio, receiveVideo, sendAudio, sendVideo]);

    return {
        id: ref ? ref.key : undefined,
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
