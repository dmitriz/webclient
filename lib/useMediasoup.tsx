import {useConnection} from "./useConnection";
import {useEffect} from "react";

export default (props: {
    localStream: MediaStream
}) => {
    const {stage, socket} = useConnection();

    useEffect(() => {
        console.log("Mediasoup: Stage updated");
    }, [stage]);

    return {}
}
