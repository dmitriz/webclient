import * as React from "react";
import Layout from "../components/ui/Layout";
import {useAuth} from "../lib/useAuth";
import Loading from "../components/ui/Loading";
import {useRouter} from "next/router";

export default () => {
    const router = useRouter();
    const {user, loading} = useAuth();

    if (loading) {
        return (
            <Loading><h1>Loading</h1></Loading>
        )
    }

    if (!user) {
        router.push("/login");
    }

    return (
        <Layout>
            <h1>Digital stage</h1>
        </Layout>
    );
}
