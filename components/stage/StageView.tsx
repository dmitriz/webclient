import {useStage} from "../../lib/digitalstage/useStage"
import React from "react";
import LocalDevicePanel from "./LocalDevicePanel";
import {styled} from "baseui";
import NavBar from "../theme/NavBar";
import MemberView from "./MemberView";
import Click from "../click/Click";

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
});

const ClickPanel = styled("div", {
    position: "relative",
    width: "100%",
    flexGrow: 0
});

export default () => {
    const {members} = useStage();

    return (
        <Wrapper>
            <NavBar/>
            <ClickPanel>
                <Click/>
            </ClickPanel>
            <Members>
                {members.map((member) => (
                    <Member key={member.uid}>
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
