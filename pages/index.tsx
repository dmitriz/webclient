import React from "react";
import useDigitalStage from "../lib/useDigitalStage";
import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import Loading from "../components/theme/Loading";
import MemberGrid from "../components/stage/MemberGrid";
import Layout from "../components/Layout";

export default () => {
    const {user} = useAuth();
    const router = useRouter();
    const {stage, loading} = useDigitalStage();

    if (loading) {
        return <Loading><h1>Loading</h1></Loading>
    }

    if (!user) {
        router.push("/login");
    }

    if (!stage) {
        router.push("/join");
    }

    return (
        <Layout>
            {stage && (
                <MemberGrid members={stage.members}/>
            )}
        </Layout>
    );
}
