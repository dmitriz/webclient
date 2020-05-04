import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import Layout from "../components/theme/Layout";
import Loading from "../components/theme/Loading";
import {FormControl} from "baseui/form-control";
import {useCallback, useState} from "react";
import {Input} from "baseui/input";
import {Button, SIZE} from "baseui/button";
import StageConnector from "../lib/digitalstage/StageConnector";
import * as config from "./../env";

const HOST: string = config.SERVER_URL;
const PORT: number = parseInt(config.SERVER_PORT);

export default () => {
    const router = useRouter();
    const {user, loading} = useAuth();
    const [stageId, setStageId] = useState<string>("VmaFVwEGz9CO7odY0Vbw");
    const [password, setPassword] = useState<string>("hello");

    const join = useCallback(() => {
        const stageConnection = new StageConnector();
        console.log("Connecting to " + HOST + ":" + PORT);
        stageConnection.connect(user, HOST, PORT);
        /*
        stageConnection.joinStage(user, stageId, password)
            .then(() => console.log("joined"))
            .catch(error => console.error(error));*/
    }, [user, stageId, password]);

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
            <h1>Join stage</h1>
            <FormControl label={"Stage ID"}>
                <Input value={stageId} onChange={e => setStageId(e.currentTarget.value)}/>
            </FormControl>
            <FormControl label={"Passwort"}
                         caption={"Ask your director or creator of the stage for the password"}>
                <Input type="password" value={password} onChange={e => setPassword(e.currentTarget.value)}/>
            </FormControl>
            <Button onClick={join} size={SIZE.large}>
                Join
            </Button>
        </Layout>
    );
}
