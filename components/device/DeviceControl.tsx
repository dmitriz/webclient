import {IDevice} from "../../lib/useDigitalStage/base";
import {Button, KIND, SHAPE, SIZE} from "baseui/button";
import React from "react";
import {useDarkModeSwitch} from "../../lib/useDarkModeSwitch";

export default (props: {
    device: IDevice
    shape?: SHAPE[keyof SHAPE];
    size?: SIZE[keyof SIZE];
    kind?: KIND[keyof KIND];
}) => {
    const {darkMode} = useDarkModeSwitch();

    return (
        <>
            {props.device.canVideo && (
                <Button
                    shape={props.shape}
                    kind={props.kind}
                    size={props.size}
                    onClick={() => props.device.setSendVideo(!props.device.sendVideo)}
                >
                    {darkMode ? (
                        <img src={props.device.sendVideo ? "videocam-black-18dp.svg" : "videocam_off-black-18dp.svg"}/>
                    ) : (
                        <img src={props.device.sendVideo ? "videocam-white-18dp.svg" : "videocam_off-white-18dp.svg"}/>
                    )}
                </Button>
            )}

            {props.device.canAudio && (
                <Button
                    shape={props.shape}
                    kind={props.kind}
                    size={props.size}
                    onClick={() => props.device.setSendAudio(!props.device.sendAudio)}
                >
                    {darkMode ? (
                        <img src={props.device.sendAudio ? "mic-black-18dp.svg" : "mic_off-black-18dp.svg"}/>
                    ) : (
                        <img src={props.device.sendAudio ? "mic-white-18dp.svg" : "mic_off-white-18dp.svg"}/>
                    )}
                </Button>
            )}
            {props.device.canVideo && (
                <Button
                    shape={props.shape}
                    kind={props.kind}
                    size={props.size}
                    onClick={() => props.device.setReceiveVideo(!props.device.receiveVideo)}
                >
                    {darkMode ? (
                        <img src={props.device.receiveVideo ? "live_tv-black-18dp.svg" : "tv_off-black-18dp.svg"}/>
                    ) : (
                        <img src={props.device.receiveVideo ? "live_tv-white-18dp.svg" : "tv_off-white-18dp.svg"}/>
                    )}
                </Button>
            )}
            {props.device.canAudio && (
                <Button
                    shape={props.shape}
                    kind={props.kind}
                    size={props.size}
                    onClick={() => props.device.setReceiveAudio(!props.device.receiveAudio)}
                >
                    {darkMode ? (
                        <img
                            src={props.device.receiveAudio ? "volume_up-black-18dp.svg" : "volume_off-black-18dp.svg"}/>
                    ) : (
                        <img
                            src={props.device.receiveAudio ? "volume_up-white-18dp.svg" : "volume_off-white-18dp.svg"}/>
                    )}
                </Button>
            )}
        </>
    );
}
