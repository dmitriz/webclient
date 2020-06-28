import React, {useEffect} from "react";
import useDigitalStage from "../lib/useDigitalStage";
import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import Loading from "../components/theme/Loading";
import MemberGrid from "../components/stage/MemberGrid";

export default () => {
    const {user, loading: userLoading} = useAuth();
    const router = useRouter();
    const {stage, loading} = useDigitalStage();

    useEffect(() => {
        if (!userLoading && !user) {
            router.push("/login");
        }
    }, [user, userLoading])

    if (loading) {
        return <Loading><h1>Loading</h1></Loading>
    }

    if (!stage) {
        return (
            <div>
                Stage not found
            </div>
        )
    }

    return (
        <MemberGrid members={stage && stage.members}/>
    );
}
