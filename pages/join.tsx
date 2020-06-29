import Layout from "../components/Layout";
import useDigitalStage from "../lib/useDigitalStage";
import React, {useState} from "react";
import {useRouter} from "next/router";
import CenteredCard from "../components/theme/CenteredCard";
import {DisplayMedium, ParagraphMedium} from "baseui/typography";
import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {KIND, Notification} from "baseui/notification";
import {Button} from "baseui/button";

export default () => {
    const {user, join, stage, loading, error} = useDigitalStage();
    const [stageId, setStageId] = useState<string>("-M9p2_4r-DNWAbhj74Jj");
    const [password, setPassword] = useState<string>('');
    const router = useRouter();

    if (!loading && !user) {
        router.push("/login");
    }

    if (!loading && stage) {
        router.push("/");
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
                        {error.message}
                    </Notification>
                )}
                {join && (
                    <Button isLoading={loading} disabled={stageId.length === 0}
                            onClick={() => join(stageId, password)}>Join</Button>
                )}
            </CenteredCard>
        </Layout>
    );
}
