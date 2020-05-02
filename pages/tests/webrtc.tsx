import React, {useCallback, useState} from "react";
import {Button} from "baseui/button";
import firebase from "firebase/app";
import "firebase/auth";
import {useStage} from "../../lib/api/StageConnector";

import * as config from "../../env";
import {Select, Value} from "baseui/select";


export default () => {
    const [account, setAccount] = React.useState<Value>([]);
    const [user, setUser] = useState<firebase.User>();
    const {stage, joinStage, publishTrack} = useStage(config.SERVER_URL, parseInt(config.SERVER_PORT));

    const connect = useCallback(() => {
        // Sign in manually
        firebase.auth().signInWithEmailAndPassword(
            "" + account[0].id, "testtesttest"
        ).catch((error) => console.error(error));
        firebase.auth().onAuthStateChanged((user: firebase.User | null) => {
            if (user) {
                setUser(user);
            }
        });
    }, [account]);

    const join = useCallback(() => {
        if (user) {
            joinStage(user, "VmaFVwEGz9CO7odY0Vbw", "hello").then(() => console.log("Joined!"));
        }
    }, [user]);


    if (!user) {
        return (
            <>
                <Select
                    onChange={({value}) => setAccount(value)}
                    value={account}
                    options={[
                        {id: 'test@test.de', label: 'Tester #1'},
                        {id: 'test2@test.de', label: 'Tester #3'},
                        {id: 'test3@test.de', label: 'Tester #2'},
                    ]}/>
                <Button disabled={account.length === 0} onClick={connect}>Connect</Button>
            </>
        )
    }

    if (!stage) {
        return (
            <div>
                <Button disabled={!user} isLoading={!user} onClick={join}>Join</Button>

            </div>
        )
    }

    return (
        <div>
            <h1>{stage.name}</h1>
            <Button onClick={() => {
                navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                }).then((stream: MediaStream) => {
                    stream.getTracks().forEach((track: MediaStreamTrack) => {
                        publishTrack(track);
                    })
                })
            }}>
                Stream
            </Button>
        </div>
    )
}
