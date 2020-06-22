import React from "react";
import {useAuth} from "../../lib/useAuth";
import NavBar from "./NavBar";
import {styled} from "baseui";
import {useStage} from "../../lib/digitalstage/useStage";

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
    const {leave, stageId, stageName} = useStage();

    return (
        <NavBar logo={(
            <CenterVertical>
                <Banner src={"/logo.png"}/>
                {stageName ? stageName : "Digital Stage"}
            </CenterVertical>
        )} user={user} main={user ? stageId ? [
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
