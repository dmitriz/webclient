import React, {useState} from "react";
import {Button} from "baseui/button";
import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import Container from "../components/ui/Container";
import {useAuth} from "../lib/useAuth";
import Layout from "../components/ui/Layout";
import {useStage} from "../lib/digitalstage/useStage";
import Loading from "../components/ui/Loading";
import {useRouter} from "next/router";
import MembersView from "../components/MembersView";
import {styled} from "baseui";
import {Checkbox, STYLE_TYPE} from "baseui/checkbox";
import {KIND, Notification} from "baseui/notification";

const Panel = styled("div", {
    position: "absolute",
    zIndex: 9999,
    bottom: 50,
    width: "100%",
    height: "auto"
});

export default () => {
    const {user, loading} = useAuth();
    const {join, stage, memberObjects, mediasoupDevice, error} = useStage();
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
            <div>
                {stage.name && (
                    <h1>{stage.name}</h1>
                )}
                <MembersView members={memberObjects}/>
                <Panel>
                    <Checkbox
                        checked={mediasoupDevice.sendVideo}
                        checkmarkType={STYLE_TYPE.toggle_round}
                        onChange={e => mediasoupDevice.setSendVideo(e.currentTarget.checked)}
                    >
                        Video
                    </Checkbox>
                    <Checkbox
                        checked={mediasoupDevice.sendAudio}
                        checkmarkType={STYLE_TYPE.toggle_round}
                        onChange={e => mediasoupDevice.setSendAudio(e.currentTarget.checked)}
                    >
                        Audio
                    </Checkbox>
                    <Checkbox
                        checked={mediasoupDevice.receiveVideo}
                        checkmarkType={STYLE_TYPE.toggle_round}
                        onChange={e => mediasoupDevice.setReceiveVideo(e.currentTarget.checked)}
                    >
                        Receive Videos
                    </Checkbox>
                    <Checkbox
                        checked={mediasoupDevice.receiveAudio}
                        checkmarkType={STYLE_TYPE.toggle_round}
                        onChange={e => mediasoupDevice.setReceiveAudio(e.currentTarget.checked)}
                    >
                        Receive Audio
                    </Checkbox>
                </Panel>
            </div>
        );
    }

    return (
        <Layout>
            <Container>
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
                <Button disabled={stageId.length === 0} onClick={() => join(stageId, "")}>Join</Button>
            </Container>
        </Layout>
    )
}
