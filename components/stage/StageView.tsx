import React from "react";
import {styled} from "baseui";
import MemberView from "./MemberView";
import Click from "../click/Click";
import {FlexGrid, FlexGridItem} from "baseui/flex-grid";
import {BlockProps} from "baseui/block";
import {AspectRatioBox, AspectRatioBoxBody} from "baseui/aspect-ratio-box";
import {useStage} from "../../lib/digitalstage/useStage";

const Wrapper = styled("div", {
    position: "relative",
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh'
});


const ClickPanel = styled("div", {
    position: "fixed",
    top: "100px",
    right: "50px",
    zIndex: 2
});

const itemProps: BlockProps = {};

export default () => {
    const {members} = useStage();

    return (
        <>
            <Wrapper>
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
                                    <MemberView member={member}/>
                                </AspectRatioBoxBody>
                            </AspectRatioBox>
                        </FlexGridItem>
                    ))}
                </FlexGrid>


            </Wrapper>


        </>
    )
}
