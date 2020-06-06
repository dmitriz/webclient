import {useStage} from "../../lib/digitalstage/useStage"
import React from "react";
import LocalDevicePanel from "./LocalDevicePanel";
import {styled} from "baseui";
import NavBar from "../theme/NavBar";
import MemberView from "./MemberView";
import Click from "../click/Click";
import {FlexGrid, FlexGridItem} from "baseui/flex-grid";
import {BlockProps} from "baseui/block";
import {AspectRatioBox, AspectRatioBoxBody} from "baseui/aspect-ratio-box";

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

const itemProps: BlockProps = {
};

export default () => {
    const {members} = useStage();

    return (
        <Wrapper>
            <NavBar/>
            <ClickPanel>
                <Click/>
            </ClickPanel>
            <FlexGrid
                flexGridColumnCount={[1, 2, 2, 4]}
                flexGridColumnGap="scale800"
                flexGridRowGap="scale800"
            >
                {members.map((member) => (
                    <FlexGridItem key={member.uid} {...itemProps}>
                        <AspectRatioBox aspectRatio={16 / 9}>
                            <AspectRatioBoxBody display="flex"
                                                alignItems="center"
                                                justifyContent="center">
                                <MemberView member={member} />
                            </AspectRatioBoxBody>
                        </AspectRatioBox>
                    </FlexGridItem>
                ))}
            </FlexGrid>
            <LocalDevicePanel/>
        </Wrapper>
    )
}
