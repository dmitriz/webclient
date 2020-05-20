import {Checkbox, STYLE_TYPE} from "baseui/checkbox";
import React from "react";
import {useStage} from "../lib/digitalstage/useStage2";
import {styled} from "baseui";

const Panel = styled("div", {
    position: "absolute",
    zIndex: 9999,
    bottom: 50,
    width: "100%",
    height: "auto"
});
export default () => {
    const {localMediasoupDevice, localSoundjackDevice} = useStage();

    return (
        <Panel>
            <Checkbox
                checked={localMediasoupDevice.sendVideo}
                checkmarkType={STYLE_TYPE.toggle_round}
                onChange={e => localMediasoupDevice.setSendVideo(e.currentTarget.checked)}
            >
                Video
            </Checkbox>
            <Checkbox
                checked={localMediasoupDevice.sendAudio}
                checkmarkType={STYLE_TYPE.toggle_round}
                onChange={e => localMediasoupDevice.setSendAudio(e.currentTarget.checked)}
            >
                Audio
            </Checkbox>
            <Checkbox
                checked={localMediasoupDevice.receiveVideo}
                checkmarkType={STYLE_TYPE.toggle_round}
                onChange={e => localMediasoupDevice.setReceiveVideo(e.currentTarget.checked)}
            >
                Receive Videos
            </Checkbox>
            <Checkbox
                checked={localMediasoupDevice.receiveAudio}
                checkmarkType={STYLE_TYPE.toggle_round}
                onChange={e => localMediasoupDevice.setReceiveAudio(e.currentTarget.checked)}
            >
                Receive Audio
            </Checkbox>
        </Panel>
    )
};
