import React from "react";
import {useStage} from "../lib/digitalstage/useStage";
import {styled} from "baseui";
import {Button as BaseButton, SHAPE, SIZE} from "baseui/button";

const Panel = styled("div", {
    position: "absolute",
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    bottom: "50px",
    width: "100%",
    height: "auto"
});

const Button = styled(BaseButton, (props: {
    $active: boolean
}) => ({
    marginLeft: "24px",
    marginRight: "24px",
    boxShadow: props.$active ? "0px 0px 20px 10px rgba(40,142,250,1)" : undefined,
    transform: "box-shadow .3s",
    ":hover": {
        boxShadow: props.$active ? "0px 0px 20px 10px rgba(40,142,250,1)" : "0px 0px 10px 10px red"
    }
}));

export default () => {
    const stage = useStage();

    return (
        <Panel>
            <Button
                onClick={() => stage.setSendVideo(!stage.sendVideo)}
                size={SIZE.large}
                shape={SHAPE.round}
                $active={stage.sendVideo}
            >
                <img src={stage.sendVideo ? "videocam-24px.svg" : "videocam_off-24px.svg"}/>
            </Button>
            <Button
                onClick={() => stage.setSendAudio(!stage.sendAudio)}
                size={SIZE.large}
                shape={SHAPE.round}
                $active={stage.sendAudio}
            >
                <img src={stage.sendAudio ? "mic-24px.svg" : "mic_off-24px.svg"}/>
            </Button>
            <Button
                onClick={() => stage.setReceiveVideo(!stage.receiveVideo)}
                size={SIZE.large}
                shape={SHAPE.round}
                $active={stage.receiveVideo}
            >
                <img src={stage.receiveVideo ? "live_tv-24px.svg" : "tv_off-24px.svg"}/>
            </Button>
            <Button
                onClick={() => stage.setReceiveAudio(!stage.receiveAudio)}
                size={SIZE.large}
                shape={SHAPE.round}
                $active={stage.receiveAudio}
            >
                <img src={stage.receiveAudio ? "volume_up-24px.svg" : "volume_off-24px.svg"}/>
            </Button>
        </Panel>
    )
};
