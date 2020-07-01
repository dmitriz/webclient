import useDigitalStage from "../../lib/useDigitalStage";
import React from "react";
import {useStyletron} from "baseui";
import {useDarkModeSwitch} from "../../lib/useDarkModeSwitch";
import DeviceControl from "./DeviceControl";

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
                <DeviceControl device={localDevice}/>
            </div>
        </div>
    )
}
