import React from "react";
import NavBar from "./theme/NavBar";
import {useStyletron} from "baseui";
import LocalDeviceControl from "./stage/LocalDeviceControl";

export default (props: {
    children: React.ReactNode
}) => {
    const [css] = useStyletron();

    return (
        <>
            <NavBar/>
            {props.children}
            <LocalDeviceControl className={css({
                position: "fixed",
                left: "15px",
                bottom: "15px",
                zIndex: 1000
            })}/>
        </>
    )
}
