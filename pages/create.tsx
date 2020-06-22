import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {Button} from "baseui/button";
import React, {useCallback, useState} from "react";
import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import Loading from "../components/theme/Loading";
import Layout from "../components/theme/Layout";
import CenteredCard from "../components/theme/CenteredCard";
import {DisplayMedium} from "baseui/typography";
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {DatabaseStage} from "../lib/digitalstage/base/types";
import {useStage} from "../lib/digitalstage/useStage";

export default () => {
    const {user, loading} = useAuth();
    const {create: createStage, loading: stageLoading} = useStage();
    const [stageName, setStageName] = useState<string>("stage1");
    const [password, setPassword] = useState<string>("");
    const [stage, setStage] = useState<DatabaseStage>();
    const [copied, setCopied] = useState<boolean>(false);
    const router = useRouter();

    const create = useCallback((name: string, password: string) => {
        createStage(name, password)
            .then((stage: DatabaseStage) => {
                console.log("YES");
                console.log("YES");
                setStage(stage)
            })
            .catch((error) => alert(error.message))
    }, [createStage]);

    if (loading) {
        return (
            <Loading><h1>Loading</h1></Loading>
        )
    }
    if (!user) {
        router.push("/login");
    }

    console.log(stage);

    if (stage) {
        const link: string = "https://live.digital-stage.de/?id=" + stage.id + "&password=" + stage.password;
        return (
            <Layout>
                <CenteredCard>
                    <DisplayMedium>Stage details</DisplayMedium>
                    <p>
                        Share this link:
                    </p>
                    <p>
                        <li>
                            <CopyToClipboard text={link}
                                             onCopy={() => setCopied(true)}>
                                <span>{link}</span>
                            </CopyToClipboard>
                            <CopyToClipboard text={link}
                                             onCopy={() => setCopied(true)}>
                                <Button>{copied ? "Copied!" : "Copy"}</Button>
                            </CopyToClipboard>
                        </li>
                    </p>
                    <p>
                        Or this ID and password:
                    </p>
                    <p>
                        <li>
                            ID: {stage.id}
                        </li>
                        {stage.password && (
                            <li>Password: {stage.password}</li>
                        )}
                    </p>
                    <Button onClick={() => router.push("/")}>Ok, let's start</Button>
                </CenteredCard>
            </Layout>
        )
    }

    return (
        <Layout>
            <CenteredCard>
                <DisplayMedium>Create stage</DisplayMedium>
                <form>
                    <FormControl label={"Stage name"}>
                        <Input value={stageName} onChange={e => setStageName(e.currentTarget.value)}/>
                    </FormControl>
                    <FormControl label={"Passwort"}
                                 caption={"Optional"}>
                        <Input type="password" value={password} onChange={e => setPassword(e.currentTarget.value)}/>
                    </FormControl>
                    <Button isLoading={stageLoading}
                            disabled={stageLoading}
                            onClick={() => create(stageName, password)}>Create</Button>
                </form>
            </CenteredCard>
        </Layout>
    );
};
