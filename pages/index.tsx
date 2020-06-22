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
import {DisplayMedium, ParagraphMedium} from "baseui/typography";
import {useStage} from "../lib/digitalstage/useStage";

export default () => {
    const {user, loading} = useAuth();
    const {join, stageId: id, error, loading: stageLoading} = useStage();
    const [stageId, setStageId] = useState<string>("-M9p2_4r-DNWAbhj74Jj");
    const [password, setPassword] = useState<string>('');
    const router = useRouter();

    if (loading) {
        return (
            <Loading><h1>Loading</h1></Loading>
        )
    }
    if (!user) {
        return router.push("/login");
    }

    if (id) {
        return (
            <Layout>
                <StageView/>
            </Layout>
        );
    }

    return (
        <Layout>
            <CenteredCard>
                <DisplayMedium>Join stage</DisplayMedium>
                <ParagraphMedium>
                    Copy and paste the Stage ID given from your coordinator.
                    As an alternative we already created a public stage, so just click on
                    Join to test Digital Stage :)
                </ParagraphMedium>
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
