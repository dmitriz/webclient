import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {Button} from "baseui/button";
import React, {useState} from "react";
import {useRouter} from "next/router";
import {useAuth} from "../lib/useAuth";
import {useStage, useStageControl} from "../lib/digitalstage/useStage";
import Layout from "../components/theme/Layout";
import {Participant} from "../lib/digitalstage/model";
import Loading from "../components/theme/Loading";

export default () => {
    const {user, loading} = useAuth();
    const {stage, join, create} = useStageControl({user});
    const [stageName, setStageName] = useState<string>("stage1");
    const router = useRouter();
    const [password, setPassword] = useState<string>("");

    if (loading) {
        return (
            <Loading><h1>Loading</h1></Loading>
        )
    }
    if (!user) {
        router.push("/stage/login");
    }

    if (stage) {
        return (
            <Layout>
                <h1>Stage</h1>
                <p>
                    Share this id:
                </p>
                <p>
                    <li>
                        ID: {stage.id}
                    </li>
                    {stage.password && (
                        <li>Password: {stage.password}</li>
                    )}
                </p>
                <ul>
                    {Object.values(stage.participants).map((participant: Participant) => (
                        <li>
                            {participant.ipv4}
                        </li>
                    ))}
                </ul>
            </Layout>
        )
    }

    return (
        <Layout>
            <h1>Create stage</h1>
            <FormControl label={"Stage name"}>
                <Input value={stageName} onChange={e => setStageName(e.currentTarget.value)}/>
            </FormControl>
            <FormControl label={"Passwort"}
                         caption={"Optional"}>
                <Input type="password" value={password} onChange={e => setPassword(e.currentTarget.value)}/>
            </FormControl>
            <Button onClick={() => create(stageName, password)}>Create</Button>
        </Layout>
    );
};
