import {useStage} from "../lib/digitalstage/useStage"
import React from "react";
import LocalDevicePanel from "./LocalDevicePanel";
import {styled} from "baseui";
import {Display2} from "baseui/typography";
import NavBar from "./ui/NavBar";
import MemberView from "./MemberView";

const Wrapper = styled("div", {
    position: "relative",
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh'
})

const Header = styled("div", {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 0
});

const Members = styled("div", {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexWrap: "wrap",
    flexGrow: 1
    //gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
});

const Member = styled("div", {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: "50%",
    flexBase: "50%",
    height: "50%",
    overflow: 'hidden'
});

export default () => {
    const {members, stage} = useStage();

    console.log(members);

    return (
        <Wrapper>
            <NavBar/>
            <Header>
                {stage.name && (
                    <Display2>{stage.name}</Display2>
                )}
                {members.length} Members
            </Header>
            <Members>
                {members.map((member) => (
                    <Member>
                        <MemberView member={member}/>
                    </Member>
                ))}
            </Members>
            <LocalDevicePanel/>
        </Wrapper>
    )
}
