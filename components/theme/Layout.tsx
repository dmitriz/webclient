import React from "react";
import NavBar from "./NavBar";

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
