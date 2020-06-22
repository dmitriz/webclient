import React, {useEffect, useState} from "react";
import {styled} from "baseui";
import Navigation from "./Navigation";
import LocalDevicePanel from "../stage/LocalDevicePanel";
import {ANCHOR, Drawer} from "baseui/drawer";
import DevicesView from "../devices/DevicesView";
import {toaster, ToasterContainer} from "baseui/toast";
import {useStage} from "../../lib/digitalstage/useStage";
import {Button} from "baseui/button";
import {useDarkModeSwitch} from "../../lib/useDarkModeSwitch";

const NavBar = styled(Navigation, {
    position: "relative",
    width: "100vw",
    zIndex: 9999
});

const ToggleDeviceButton = styled(Button, {
    position: "fixed",
    bottom: "50px",
    right: "50px",
    zIndex: 9999
});

export default (props: {
    children: React.ReactNode
}) => {
    const {loading, error, devices, stageId} = useStage();
    const [showDevices, setShowDevices] = useState<boolean>(false);
    const [toastKey, setToastKey] = React.useState<React.ReactText | null>(null);
    const {darkMode} = useDarkModeSwitch();

    useEffect(() => {
        if (error && error.message) {
            setToastKey(toaster.negative(error.message, {
                onClose: closeToast
            }));
        }
    }, [error])

    const closeToast = () => {
        if (toastKey) {
            toaster.clear(toastKey);
            setToastKey(null);
        }
    };

    return (
        <>
            <NavBar/>
            {props.children}
            {devices.length > 0 && (
                <>
                    <Drawer
                        autoFocus
                        size="full"
                        onClose={() => setShowDevices(false)}
                        isOpen={showDevices}
                        anchor={ANCHOR.bottom}
                        overrides={{
                            Root: {
                                style: {
                                    zIndex: 9999
                                }
                            }
                        }}
                    >
                        <DevicesView/>
                    </Drawer>
                    <ToggleDeviceButton
                        onClick={() => setShowDevices(prevState => !prevState)}
                        size="large"
                        disabled={loading}
                        isLoading={loading}
                        kind={darkMode ? "primary" : "secondary"}
                    >
                        <img src="settings-24px.svg"/>
                    </ToggleDeviceButton>
                </>
            )}
            <ToasterContainer>
            </ToasterContainer>
            {stageId && <LocalDevicePanel/>}
        </>
    );
}
