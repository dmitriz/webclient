import React, {useEffect, useState} from "react";
import LocalDevicePanel from "./LocalDevicePanel";
import {styled, withStyle} from "baseui";
import MemberView from "./MemberView";
import Click from "../click/Click";
import {FlexGrid, FlexGridItem} from "baseui/flex-grid";
import {BlockProps} from "baseui/block";
import {AspectRatioBox, AspectRatioBoxBody} from "baseui/aspect-ratio-box";
import DevicesView from "../devices/DevicesView";
import {ANCHOR, Drawer} from 'baseui/drawer';
import {SHAPE, StyledBaseButton} from "baseui/button";
import {useDigitalStage} from "../../lib/digitalstage/useDigitalStage";
import {toaster, ToasterContainer} from "baseui/toast";

const Wrapper = styled("div", {
    position: "relative",
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh'
});

const ToggleDeviceButton = withStyle(StyledBaseButton, {
    position: "fixed",
    bottom: "50px",
    right: "50px",
    zIndex: 9999
});

const ClickPanel = styled("div", {
    position: "fixed",
    top: "100px",
    right: "50px",
    zIndex: 2
});

const itemProps: BlockProps = {};

export default () => {
    const {error, members} = useDigitalStage();
    const [showDevices, setShowDevices] = useState<boolean>(false);
    const [toastKey, setToastKey] = React.useState<React.ReactText | null>(null);

    useEffect(() => {
        if (error) {
            setToastKey(toaster.negative(error, {
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
            <Wrapper>
                <ClickPanel>
                    <Click/>
                </ClickPanel>
                <FlexGrid
                    flexGridColumnCount={[1, 2, 2, 4]}
                    flexGridColumnGap="scale800"
                    flexGridRowGap="scale800"
                >
                    {members.map((member) => (
                        <FlexGridItem key={member.uid} {...itemProps}>
                            <AspectRatioBox aspectRatio={16 / 9}>
                                <AspectRatioBoxBody display="flex"
                                                    alignItems="center"
                                                    justifyContent="center">
                                    <MemberView member={member}/>
                                </AspectRatioBoxBody>
                            </AspectRatioBox>
                        </FlexGridItem>
                    ))}
                </FlexGrid>

                <LocalDevicePanel/>

                <ToggleDeviceButton
                    onClick={() => setShowDevices(prevState => !prevState)}
                    size="large"
                    shape={SHAPE.round}
                >
                    <img src="settings-24px.svg"/>
                </ToggleDeviceButton>
            </Wrapper>

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
            <ToasterContainer>
            </ToasterContainer>
        </>
    )
}
