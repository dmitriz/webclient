import Connection, {Stage} from "../lib/communication/Connection";
import {useAuth} from "../lib/useAuth";
import {useRouter} from "next/router";
import Loading from "../components/ui/Loading";
import * as React from "react";
import {useCallback, useState} from "react";
import Layout from "../components/ui/Layout";
import {Button} from "baseui/button";
import * as config from "../env";

export default () => {
    const {user, loading} = useAuth();
    const router = useRouter();
    const [connection] = useState<Connection>(new Connection());


    // TEST METHOD (useCallback einfach erstmal ignorieren, hat seinen Grund)
    const connect = useCallback(() => {
        connection.connect(config.SERVER_URL, parseInt(config.SERVER_PORT))
            .then(() => {
                console.log("Connected to server");

                connection.joinStage(user, "VmaFVwEGz9CO7odY0Vbw", "hello")
                    .then((stage: Stage) => {
                        // Got stage and mediasoup will be set up
                        console.log("GOT STAGE");
                    });

            });
    }, [user]);


    // Rendering webpage depending to states:

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
            <Button onClick={connect}>Connect</Button>
        </Layout>
    );
}
