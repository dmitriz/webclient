import React, {useEffect} from "react";
import useDigitalStage from "../lib/useDigitalStage";
import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import Loading from "../components/theme/Loading";
import MemberGrid from "../components/stage/MemberGrid";

export default () => {
    const {user, loading: userLoading} = useAuth();
    const router = useRouter();
    const {stage, devices, localDevice, connected, connect, disconnect, loading, error} = useDigitalStage();

    useEffect(() => {
        if (connect)
            connect()
    }, [connect])

    useEffect(() => {
        if (!userLoading && !user) {
            router.push("/login");
        }
    }, [user, userLoading])


    useEffect(() => {
        if (connected && !stage) {
            router.push("/join");
        }
    }, [stage, connected]);


    if (loading) {
        return <Loading><h1>Loading</h1></Loading>
    }

    if (stage) {
        router.push("/stage/" + stage.id)
    }

    return (
        <MemberGrid members={stage && stage.members}/>
    );
}
