import React from "react";
import Navigation from "./Navigation";
import {styled} from "baseui";

const NavBar = styled(Navigation, {
    position: "relative",
    width: "100vw",
    zIndex: 9999
})

export default (props: {
    children: React.ReactNode
}) => {
    return (
        <>
            <NavBar/>
            {props.children}
        </>
    );
}
