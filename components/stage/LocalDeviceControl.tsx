import useDigitalStage from "../../lib/useDigitalStage";
import React from "react";
import {Button} from "baseui/button";
import {useStyletron} from "baseui";
import {useDarkModeSwitch} from "../../lib/useDarkModeSwitch";

export default (props: {
    className?: string;
}) => {
    const {localDevice} = useDigitalStage();
    const {darkMode} = useDarkModeSwitch();
    const [css] = useStyletron();

    if (!localDevice)
        return null;

    return (
        <div className={props.className}>
            <div className={css({
                color: "white",
                "svg": {
                    fill: "currentColor"
                }
            })}>
                <Button
                    onClick={() => localDevice.setSendVideo(!localDevice.sendVideo)}
                >
                    {darkMode ? (
                        <img src={localDevice.sendVideo ? "videocam-black-18dp.svg" : "videocam_off-black-18dp.svg"}/>
                    ) : (
                        <img src={localDevice.sendVideo ? "videocam-white-18dp.svg" : "videocam_off-white-18dp.svg"}/>
                    )}
                </Button>

                <Button
                    onClick={() => localDevice.setSendAudio(!localDevice.sendAudio)}
                >
                    {darkMode ? (
                            <img src={localDevice.sendAudio ? "mic-black-18dp.svg" : "mic_off-black-18dp.svg"}/>
                    ) : (
                        <img src={localDevice.sendAudio ? "mic-white-18dp.svg" : "mic_off-white-18dp.svg"}/>
                    )}
                </Button>

                <Button
                    onClick={() => localDevice.setReceiveVideo(!localDevice.receiveVideo)}
                >
                    {darkMode ? (
                        <img src={localDevice.receiveVideo ? "live_tv-black-18dp.svg" : "tv_off-black-18dp.svg"}/>
                    ) : (
                        <img src={localDevice.receiveVideo ? "live_tv-white-18dp.svg" : "tv_off-white-18dp.svg"}/>
                    )}
                </Button>

                <Button
                    onClick={() => localDevice.setReceiveAudio(!localDevice.receiveAudio)}
                >
                    {darkMode ? (
                        <img src={localDevice.receiveAudio ? "volume_up-black-18dp.svg" : "volume_off-black-18dp.svg"}/>
                    ) : (
                        <img src={localDevice.receiveAudio ? "volume_up-white-18dp.svg" : "volume_off-white-18dp.svg"}/>
                    )}
                </Button>
            </div>
        </div>
    )
}
