import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import Layout from "../components/theme/Layout";
import Loading from "../components/theme/Loading";
import {FormControl} from "baseui/form-control";
import {useEffect, useState} from "react";
import {Input} from "baseui/input";
import {Button, SIZE} from "baseui/button";
import {KIND, Notification} from "baseui/notification";
import StageView from "../components/StageView";
import {useStage} from "../lib/digitalstage/repositories/StageConnector";

export default () => {
    const router = useRouter();
    const {user, loading} = useAuth();
    const {connect, stage, join, error} = useStage();
    const [stageId, setStageId] = useState<string>("VmaFVwEGz9CO7odY0Vbw");
    const [password, setPassword] = useState<string>("hello");

    useEffect(() => {
        if (user) {
            connect(user);
        }
    }, [user]);

    if (loading) {
        return (
            <Loading><h1>Loading</h1></Loading>
        )
    }

    if (!user) {
        router.push("/login");
    }

    if (stage) {
        return <StageView/>
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
            {error && (
                <Notification kind={KIND.negative}>
                    {error.message}
                </Notification>
            )}
            <Button onClick={() => join(stageId, password)} size={SIZE.large}>
                Join
            </Button>
        </Layout>
    );
}
