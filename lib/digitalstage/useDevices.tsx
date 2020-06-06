import {useEffect, useState} from "react";
import firebase from "firebase/app";
import "firebase/database";
import {useAuth} from "../useAuth";
import Device from "./device/Device";

export default function useDevices() {
    const {user} = useAuth();
    const [devices, setDevices] = useState<Device[]>([]);

    const handleDeviceAdded = (snapshot: firebase.database.DataSnapshot) => {
        const device: Device = new Device(user, snapshot.ref);
        setDevices(prevState => [...prevState, device])
    }

    useEffect(() => {
        if (user) {
            // Get all devices
            const devicesRef = firebase.database()
                .ref("devices")
                .equalTo("uid", user.uid)
                .ref;

            devicesRef
                .on("child_added", handleDeviceAdded);
            return () => devicesRef.off("child_added", handleDeviceAdded);
        }
    }, [user])

    return devices;
}
