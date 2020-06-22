import React from "react";
import {styled} from "baseui";
import {SHAPE, SIZE} from "baseui/button";
import {OverlayButton} from "../theme/OverlayButton";
import {useStage} from "../../lib/digitalstage/useStage";

const Panel = styled("div", props => ({
    position: "fixed",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: "50px",
    left: "50px",
    height: "auto",
    display: 'none',
    zIndex: 8000,
    [props.$theme.mediaQuery.medium]: {
        display: "flex"
    }
}));

const buttonSize = SIZE.large;
const buttonShape = SHAPE.default;

export default () => {
    const {localDevice} = useStage();

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
