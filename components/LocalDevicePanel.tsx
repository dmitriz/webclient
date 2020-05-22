import {Checkbox, STYLE_TYPE} from "baseui/checkbox";
import React from "react";
import {useStage} from "../lib/digitalstage/useStage";
import {styled} from "baseui";

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
export default () => {
    const stage = useStage();

    return (
        <Panel>
            <Checkbox
                checked={stage.sendVideo}
                checkmarkType={STYLE_TYPE.toggle_round}
                onChange={e => stage.setSendVideo(e.currentTarget.checked)}
            >
                Video
            </Checkbox>
            <Checkbox
                checked={stage.sendAudio}
                checkmarkType={STYLE_TYPE.toggle_round}
                onChange={e => stage.setSendAudio(e.currentTarget.checked)}
            >
                Audio
            </Checkbox>
            <Checkbox
                checked={stage.receiveVideo}
                checkmarkType={STYLE_TYPE.toggle_round}
                onChange={e => stage.setReceiveVideo(e.currentTarget.checked)}
            >
                Receive Videos
            </Checkbox>
            <Checkbox
                checked={stage.receiveAudio}
                checkmarkType={STYLE_TYPE.toggle_round}
                onChange={e => stage.setReceiveAudio(e.currentTarget.checked)}
            >
                Receive Audio
            </Checkbox>
        </Panel>
    )
};
