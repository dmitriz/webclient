import React, {useCallback, useState} from "react";
import {Button} from "baseui/button";
import useDigitalStage from "../../lib/useDigitalStage";
import {Drawer} from "baseui/drawer";
import {ListItem, ListItemLabel} from "baseui/list";
import {styled, useStyletron} from "baseui";
import {useDarkModeSwitch} from "../../lib/useDarkModeSwitch";
import DeviceControl from "./DeviceControl";
import {LabelLarge} from "baseui/typography";
import AudioDeviceControl from "./AudioDeviceControl";

const Icon = styled("img", {
    width: "18px",
    height: "18px"
})

export default (props: {
    className?: string;
}) => {
    const {darkMode} = useDarkModeSwitch();
    const {localDevice, devices} = useDigitalStage();
    const [isOpen, setOpen] = useState<boolean>(false);
    const [css, theme] = useStyletron();

    const getIcon = useCallback((name: string) => {
        if (name === "Browser") {
            if (darkMode) {
                return "web-white-18dp.svg";
            }
            return "web-black-18dp.svg";
        } else {
            return "soundjack.png";
        }
    }, [darkMode])

    return (
        <div className={props.className}>
            <Button onClick={() => setOpen(prevState => !prevState)}>
                <img src={darkMode ? "devices-black-18dp.svg" : "devices-black-18dp.svg"}/>
            </Button>
            <Drawer
                overrides={{
                    Root: {
                        style: {
                            zIndex: 2000
                        }
                    }
                }}
                onClose={() => setOpen(false)}
                isOpen={isOpen}>
                {localDevice && (
                    <>
                        <LabelLarge>Local</LabelLarge>
                        <ListItem
                            overrides={{
                                Root: {
                                    style: {
                                        paddingBottom: "1rem",
                                        [theme.mediaQuery.medium]: {
                                            paddingBottom: 0,
                                        }
                                    }
                                },
                                Content: {
                                    style: {
                                        height: "auto",
                                        flexWrap: "wrap",
                                        [theme.mediaQuery.medium]: {
                                            height: "72px",
                                            flexWrap: "nowrap"
                                        }
                                    }
                                },
                                EndEnhancerContainer: {
                                    style: {
                                        width: "100%",
                                        justifyContent: "flex-end",
                                        [theme.mediaQuery.medium]: {
                                            width: "auto"
                                        }
                                    }
                                }
                            }}
                            artwork={() => (
                                <Icon src={getIcon(localDevice.name)}/>
                            )}
                            endEnhancer={() => (
                                <>
                                    <DeviceControl
                                        device={localDevice}
                                        size="mini"
                                    />
                                    <AudioDeviceControl device={localDevice}></AudioDeviceControl>
                                </>
                            )}
                        >
                            <ListItemLabel>
                                {localDevice.caption}
                            </ListItemLabel>
                        </ListItem>
                    </>
                )}

                {devices.length > 0 && (
                    <>
                        <LabelLarge>Remote</LabelLarge>
                        {devices.map(device => (
                            <ListItem
                                overrides={{
                                    Root: {
                                        style: {
                                            paddingBottom: "1rem",
                                            [theme.mediaQuery.medium]: {
                                                paddingBottom: 0,
                                            }
                                        }
                                    },
                                    Content: {
                                        style: {
                                            height: "auto",
                                            flexWrap: "wrap",
                                            [theme.mediaQuery.medium]: {
                                                height: "72px",
                                                flexWrap: "nowrap"
                                            }
                                        }
                                    },
                                    EndEnhancerContainer: {
                                        style: {
                                            width: "100%",
                                            justifyContent: "flex-end",
                                            [theme.mediaQuery.medium]: {
                                                width: "auto"
                                            }
                                        }
                                    }
                                }}
                                artwork={() => (
                                    <Icon src={getIcon(device.name)}/>
                                )}
                                endEnhancer={() => (
                                    <>
                                        <DeviceControl
                                            device={device}
                                            size="mini"
                                        />
                                        <AudioDeviceControl device={device}></AudioDeviceControl>
                                    </>
                                )}
                            >
                                <ListItemLabel description={device.name}>
                                    {device.caption}
                                </ListItemLabel>
                            </ListItem>
                        ))}
                    </>
                )}
            </Drawer>
        </div>
    );
}
