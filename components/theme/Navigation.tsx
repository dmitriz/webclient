import React from "react";
import {useAuth} from "../../lib/useAuth";
import {useDigitalStage} from "../../lib/digitalstage/useDigitalStage";
import NavBar from "./NavBar";
import {styled} from "baseui";

const CenterVertical = styled("div", {
    display: 'flex',
    alignItems: 'center'
});

const Banner = styled("img", {
    width: '40px',
    paddingRight: '1rem'
});

export default () => {
    const {user} = useAuth();
    const {leave, stage} = useDigitalStage();

    return (
        <NavBar logo={(
            <CenterVertical>
                <Banner src={"/logo.png"}/>
                {stage ? stage.name : "Digital Stage"}
            </CenterVertical>
        )} user={user} main={user ? stage ? [
            {
                label: "Leave stage",
                onClick: leave
            }
        ] : [
            {
                label: "Create stage",
                href: "/create"
            },
            {
                label: "Join stage",
                href: "/"
            }
        ] : [
            {
                label: "Sign up",
                href: "/signup"
            },
            {
                label: "Login",
                href: "/login"
            }
        ]}/>
    );
};
