import {useEffect, useState} from "react";
import firebase from "firebase/app";
import "firebase/database";
import {useAuth} from "../useAuth";
import ReadonlyDevice from "./device/ReadonlyDevice";

export default function useDevices() {
    const {user} = useAuth();
    const [devices, setDevices] = useState<ReadonlyDevice[]>([]);

    const handleDeviceAdded = (snapshot: firebase.database.DataSnapshot) => {
        const device: ReadonlyDevice = new ReadonlyDevice(user, snapshot.ref);
        device.on("change", (device: ReadonlyDevice) => setDevices(prevState => prevState.map((d: ReadonlyDevice) => d.id === device.id ? device : d)));
        setDevices(prevState => [...prevState, device]);
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
