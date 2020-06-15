import React from "react";
import NavBar from "./NavBar";
import {Layer} from "baseui/layer";

export default (props: {
    children: React.ReactNode
}) => {
    return (
        <>
            <Layer index={2}>
                <NavBar/>
            </Layer>
            <Layer index={1}>
                {props.children}
            </Layer>
        </>
    );
}
