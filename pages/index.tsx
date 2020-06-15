import React, {useState} from "react";
import {Button} from "baseui/button";
import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {useAuth} from "../lib/useAuth";
import Layout from "../components/theme/Layout";
import Loading from "../components/theme/Loading";
import {useRouter} from "next/router";
import {KIND, Notification} from "baseui/notification";
import StageView from "../components/stage/StageView";
import CenteredCard from "../components/theme/CenteredCard";
import {useDigitalStage} from "../lib/digitalstage/useDigitalStage";

export default () => {
    const {user, loading} = useAuth();
    const {join, stage, error, loading: stageLoading} = useDigitalStage();
    const [stageId, setStageId] = useState<string>("-M9p2_4r-DNWAbhj74Jj");
    const [password, setPassword] = useState<string>('');
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
