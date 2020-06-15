import React, {useEffect, useState} from "react";
import {styled} from "baseui";
import {Button as BaseButton, SHAPE, SIZE} from "baseui/button";
import {useDigitalStage} from "../../lib/digitalstage/useDigitalStage";
import {IDevice} from "digitalstage-client-base";

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
    const {devices, connected, setConnected, loading} = useDigitalStage();
    const [localDevice, setLocalDevice] = useState<IDevice>();

    useEffect(() => {
        if (devices) {
            const localDevice: IDevice = devices.find((device: IDevice) => device.isRemote !== false);
            setLocalDevice(localDevice);
        }
    }, [devices])

    return (
        <Panel>
            {localDevice ? (
                <>
                    <Button
                        onClick={() => localDevice.setSendVideo(!localDevice.sendVideo)}
                        size={buttonSize}
                        shape={buttonShape}
                        $active={localDevice.sendVideo}
                    >
                        <img src={localDevice.sendVideo ? "videocam-24px.svg" : "videocam_off-24px.svg"}/>
                    </Button>
                    <Button
                        onClick={() => localDevice.setSendAudio(!localDevice.sendAudio)}
                        size={buttonSize}
                        shape={buttonShape}
                        $active={localDevice.sendAudio}
                    >
                        <img src={localDevice.sendAudio ? "mic-24px.svg" : "mic_off-24px.svg"}/>
                    </Button>
                    <Button
                        onClick={() => localDevice.setReceiveVideo(!localDevice.receiveVideo)}
                        size={buttonSize}
                        shape={buttonShape}
                        $active={localDevice.receiveVideo}
                    >
                        <img src={localDevice.receiveVideo ? "live_tv-24px.svg" : "tv_off-24px.svg"}/>
                    </Button>
                    <Button
                        onClick={() => localDevice.setReceiveAudio(!localDevice.receiveAudio)}
                        size={buttonSize}
                        shape={buttonShape}
                        $active={localDevice.receiveAudio}
                    >
                        <img src={localDevice.receiveAudio ? "volume_up-24px.svg" : "volume_off-24px.svg"}/>
                    </Button>
                </>
            ) : (
                <Button isLoading={!localDevice || loading}
                        onClick={() => setConnected(true)} $active={loading}>
                    Connect
                </Button>
            )}
        </Panel>
    )
};
