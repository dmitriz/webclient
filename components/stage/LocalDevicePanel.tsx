import React from "react";
import {styled} from "baseui";
import {Button as BaseButton, SHAPE, SIZE} from "baseui/button";
import {useDigitalStage} from "../../lib/digitalstage/useDigitalStage";
import {OverlayButton} from "../theme/OverlayButton";

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
    bottom: "50px",
    left: "50px",
    height: "auto"
});

const buttonSize = SIZE.large;
const buttonShape = SHAPE.default;

const SoundjackButton = styled(BaseButton, {
    backgroundImage: "url('/soundjack.png')",
    backgroundSize: "cover",
    width: "56px",
    height: "56px"
});


export default () => {
    const {localDevice} = useDigitalStage();

    return localDevice ? (
        <Panel>
            <OverlayButton
                onClick={() => localDevice.setSendVideo(!localDevice.sendVideo)}
                size={buttonSize}
                shape={buttonShape}
                $active={localDevice.sendVideo}
            >
                <img src={localDevice.sendVideo ? "videocam-24px.svg" : "videocam_off-24px.svg"}/>
            </OverlayButton>
            <OverlayButton
                onClick={() => localDevice.setSendAudio(!localDevice.sendAudio)}
                size={buttonSize}
                shape={buttonShape}
                $active={localDevice.sendAudio}
            >
                <img src={localDevice.sendAudio ? "mic-24px.svg" : "mic_off-24px.svg"}/>
            </OverlayButton>
            <OverlayButton
                onClick={() => localDevice.setReceiveVideo(!localDevice.receiveVideo)}
                size={buttonSize}
                shape={buttonShape}
                $active={localDevice.receiveVideo}
            >
                <img src={localDevice.receiveVideo ? "live_tv-24px.svg" : "tv_off-24px.svg"}/>
            </OverlayButton>
            <OverlayButton
                onClick={() => localDevice.setReceiveAudio(!localDevice.receiveAudio)}
                size={buttonSize}
                shape={buttonShape}
                $active={localDevice.receiveAudio}
            >
                <img src={localDevice.receiveAudio ? "volume_up-24px.svg" : "volume_off-24px.svg"}/>
            </OverlayButton>
        </Panel>
    ) : null;
};
