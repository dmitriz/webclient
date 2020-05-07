import React, {useCallback, useEffect, useState} from "react";
import {Button} from "baseui/button";
import Video from "./video/Video";
import {useAuth} from "../lib/useAuth";
import {useStage} from "../lib/digitalstage/repositories/StageConnector";
import {ALIGN, HeaderNavigation, StyledNavigationList} from "baseui/header-navigation";
import {styled} from "baseui";
import {Checkbox, STYLE_TYPE} from "baseui/checkbox";

const StageNav = styled("div", {});

export default () => {
    const {user} = useAuth();
    const {stage, publishTrack} = useStage();
    const [useSoundjack, setUseSoundjack] = useState<boolean>(false);

    useEffect(() => {
        console.log("STAGE UPDATED");
    }, [stage]);

    const publish = useCallback(() => {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
            .then((mediaStream: MediaStream) => mediaStream.getTracks().forEach((track: MediaStreamTrack) => publishTrack(track, "mediasoup")));
    }, []);

    console.log(stage);

    return (
        <>
            <StageNav>
                <HeaderNavigation>
                    <StyledNavigationList $align={ALIGN.left}>
                        <Button>

                        </Button>
                        <Checkbox
                            checked={useSoundjack}
                            onChange={e => {
                                setUseSoundjack(e.currentTarget.checked)
                            }}
                            checkmarkType={STYLE_TYPE.toggle_round}
                        >
                            Soundjack
                        </Checkbox>
                    </StyledNavigationList>
                </HeaderNavigation>
            </StageNav>
            <Button onClick={() => publish()}>PUBLISH</Button>
            <h1>{stage.name}</h1>
            <h2>{user.displayName}</h2>
            <div>
                {Object.keys(stage.participants).map((userId: string) => (
                    <div key={userId}>
                        <h3>{stage.participants[userId].displayName}</h3>
                        {Object.keys(stage.participants[userId].videoTracks).map((trackId: string) => (
                            <Video id={userId} track={stage.participants[userId].videoTracks[trackId]}/>
                        ))}
                    </div>
                ))}
            </div>
            <p>
                {Object.keys(stage.participants).length} Participants
            </p>
        </>
    )
}
