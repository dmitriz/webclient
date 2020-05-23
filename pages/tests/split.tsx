import {styled} from "baseui";
import React, {useCallback, useEffect, useState} from "react";
import {Button} from "baseui/button";
import {StageMember} from "../../lib/digitalstage/client.model";

const MOBILE: string = "@media screen and (max-width: 880px)";

const Wrapper = styled("div", {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    boxSizing: "border-box"
})
const Headline = styled("div", {
    position: 'relative',
    width: '100%',
    flexGrow: 0,
    boxSizing: "border-box"

});
const OuterMembers = styled("div", {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    flexGrow: 1,
    backgroundColor: '#333',
    boxSizing: "border-box",
});
const InnerMember = styled("div", (props: {
    $fullscreen: boolean
}) => ({
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    flexGrow: 1,
    backgroundColor: '#333',
    boxSizing: "border-box",
    overflowX: 'hidden',
    overflowY: props.$fullscreen ? 'hidden' : 'scroll'
}));
const Member = styled("div", (props: {
    $width: string
}) => ({
    position: 'relative',
    display: 'flex',
    width: props.$width,
    flexBase: props.$width,
    backgroundColor: 'red',
    boxSizing: "border-box"
}));

const Inner = styled("div", {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    overflow: 'hidden',
    border: "4px solid red",
    margin: 0,
    padding: 0,
    boxSizing: "border-box"
});


export default () => {
    const [members, setMembers] = useState<string[]>([""]);
    const [fullScreen, setFullScreen] = useState<boolean>(true);
    const [width, setWidth] = useState<string>("100%");
    const [height, setHeight] = useState<string>("100%");

    const handleResize = useCallback(() => {
        console.log("RESIZE");

        // MOBILE FIRST
        if (members.length === 0)
            return;

        if (members.length <= 4) {
            console.log("100%");
            setFullScreen(true);
            setWidth("100%");
            setHeight((100 / members.length) + "%");
        } else {
            setWidth("50%");
            setHeight((100 / (members.length / 2)) + "%");
            setFullScreen(members.length <= 8)
        }

    }, [members])

    useEffect(() => {
        window.addEventListener("onresize", handleResize);
        return () => window.removeEventListener("onresize", handleResize);
    }, []);

    useEffect(() => {
        handleResize();
    }, [members])

    return (
        <Wrapper>
            <Headline>
                <Button onClick={() => setMembers(prevState => [...prevState, ""])}>
                    Add
                </Button>
            </Headline>
            <OuterMembers>
                <InnerMember $fullscreen={fullScreen}>
                    {members.map((name, index) => (
                        <Member $width={width} key={index}>
                            <Inner>
                                <img
                                    src="https://digitalasset.intuit.com/IMAGE/A0Ef6ACc0/woman-recording-guitar-in-home-sound-studio_INF31369.jpg"/>
                            </Inner>
                        </Member>
                    ))}
                </InnerMember>
            </OuterMembers>
        </Wrapper>
    )
};
