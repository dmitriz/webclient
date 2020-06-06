import React from "react";
import {useStage} from "../../lib/digitalstage/useStage";
import {styled, withStyle} from "baseui";
import {SHAPE, SIZE, Button as BaseButton} from "baseui/button";

const SoundjackLogo = styled("img", {
    width: "24px",
    height: "24px"
});

const Panel = styled("div", {
    position: "fixed",
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    bottom: "50px",
    left: "50px",
    height: "auto"
});

const buttonSize = SIZE.large;
const buttonShape = SHAPE.default;

const Button = styled(BaseButton, (props: {
    $active: boolean
}) => ({
    position: "relative",

    ":hover:before": {
        boxShadow: props.$active ? "0px 0px 60px 5px rgba(255,0,0,.8)" : "0px 0px 60px 5px rgba(40,142,250,.8)"
    },
    ":before": {
        content: "''",
        display: "block",
        position: "absolute",
        width: "100%",
        height: "100%",
        zIndex: -1,
        transitionTimingFunction: "cubic-bezier(0, 0, 1, 1)",
        transitionDuration: "200ms",
        transitionProperty: "box-shadow",
        boxShadow: props.$active ? "0px 0px 60px 5px rgba(40,142,250,.8)" : undefined
    }
}));

const SoundjackButton = styled(BaseButton, {
    backgroundImage: "url('/soundjack.png')",
    backgroundSize: "cover",
    width: "56px",
    height: "56px"
});


export default () => {
    const stage = useStage();

    return (
        <Panel>
            {stage.connected ? (
                <>
                    <Button
                        onClick={() => stage.setSendVideo(!stage.sendVideo)}
                        size={buttonSize}
                        shape={buttonShape}
                        $active={stage.sendVideo}
                    >
                        <img src={stage.sendVideo ? "videocam-24px.svg" : "videocam_off-24px.svg"}/>
                    </Button>
                    <Button
                        onClick={() => stage.setSendAudio(!stage.sendAudio)}
                        size={buttonSize}
                        shape={buttonShape}
                        $active={stage.sendAudio}
                    >
                        <img src={stage.sendAudio ? "mic-24px.svg" : "mic_off-24px.svg"}/>
                    </Button>
                    <Button
                        onClick={() => stage.setReceiveVideo(!stage.receiveVideo)}
                        size={buttonSize}
                        shape={buttonShape}
                        $active={stage.receiveVideo}
                    >
                        <img src={stage.receiveVideo ? "live_tv-24px.svg" : "tv_off-24px.svg"}/>
                    </Button>
                    <Button
                        onClick={() => stage.setReceiveAudio(!stage.receiveAudio)}
                        size={buttonSize}
                        shape={buttonShape}
                        $active={stage.receiveAudio}
                    >
                        <img src={stage.receiveAudio ? "volume_up-24px.svg" : "volume_off-24px.svg"}/>
                    </Button>
                </>
            ) : (
                <Button isLoading={!stage || stage.loading}
                        onClick={() => stage.setConnected(true)} $active={stage.loading}>
                    Connect
                </Button>
            )}
        </Panel>
    )
};
