import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {Button} from "baseui/button";
import React, {useState} from "react";
import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import Loading from "../components/theme/Loading";
import CenteredCard from "../components/theme/CenteredCard";
import {DisplayMedium} from "baseui/typography";
import {CopyToClipboard} from 'react-copy-to-clipboard';
import useDigitalStage from "../lib/useDigitalStage";
import Layout from "../components/Layout";

export default () => {
    const {user} = useAuth();
    const {create, loading, stage} = useDigitalStage();
    const [stageName, setStageName] = useState<string>("stage1");
    const [password, setPassword] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);
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
                <FormControl label={"Stage name"}>
                    <Input value={stageName} onChange={e => setStageName(e.currentTarget.value)}/>
                </FormControl>
                <FormControl label={"Passwort"}
                             caption={"Optional"}>
                    <Input type="password" value={password} onChange={e => setPassword(e.currentTarget.value)}/>
                </FormControl>
                {create && (
                    <Button isLoading={loading}
                            disabled={loading}
                            onClick={() => create(stageName, password)}>Create</Button>
                )}
            </CenteredCard>
        </Layout>
    );
};
