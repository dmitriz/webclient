import React, {useState} from "react";
import {Button} from "baseui/button";
import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {useAuth} from "../lib/useAuth";
import Layout from "../components/ui/Layout";
import {useStage} from "../lib/digitalstage/useStage";
import Loading from "../components/ui/Loading";
import {useRouter} from "next/router";
import {KIND, Notification} from "baseui/notification";
import StageView from "../components/StageView";
import CenteredCard from "../components/ui/CenteredCard";


export default () => {
    const {user, loading} = useAuth();
    const {join, stage, error, loading: stageLoading} = useStage();
    const [stageId, setStageId] = useState<string>("-M7eC0Swye-Ye-V7_o0J");
    const [password, setPassword] = useState<string>('hello');
    const router = useRouter();

    if (loading) {
        return (
            <Loading><h1>Loading</h1></Loading>
        )
    }
    if (!user) {
        router.push("/login");
    }

    if (stage) {
        return (
            <StageView/>
        );
    }

    return (
        <Layout>
            <CenteredCard>
                <FormControl label="Stage ID">
                    <Input value={stageId} onChange={(e) => setStageId(e.currentTarget.value)}/>
                </FormControl>
                <FormControl label="Password">
                    <Input type="password" value={password} onChange={(e) => setPassword(e.currentTarget.value)}/>
                </FormControl>
                {error && (
                    <Notification kind={KIND.negative}>
                        {error}
                    </Notification>
                )}
                <Button isLoading={stageLoading} disabled={stageId.length === 0}
                        onClick={() => join(stageId, "")}>Join</Button>
            </CenteredCard>
        </Layout>
    )
}
