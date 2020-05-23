import {useStage} from "../lib/digitalstage/useStage"
import React from "react";
import LocalDevicePanel from "./LocalDevicePanel";
import {styled} from "baseui";
import NavBar from "./ui/NavBar";
import MemberView from "./MemberView";

const Wrapper = styled("div", {
    position: "relative",
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh'
});

const Members = styled("div", {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    flexWrap: "wrap"
});


const Member = styled("div", {
    position: 'relative',
    display: 'block',
    width: "50%",
    flexBase: "50%",
    padding: 0,
    overflow: 'hidden',
    boxSizing: "border-box",
    "::before": {
        display: 'block',
        content: '""',
        paddingTop: "56.25%"
    }
});

const MemberInner = styled("div", {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    bottom: 0,
    boxSizing: "border-box"
})

export default () => {
    const {members} = useStage();

    return (
        <Wrapper>
            <NavBar/>
            <Members>
                {members.map((member) => (
                    <Member>
                        <MemberInner>
                            <MemberView member={member}/>
                        </MemberInner>
                    </Member>
                ))}
            </Members>
            <LocalDevicePanel/>
        </Wrapper>
    )
}
