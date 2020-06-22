import {styled} from "baseui";
import React, {useCallback, useEffect, useState} from "react";
import MemberView from "../stage/MemberView";
import {IMember} from "../../lib/digitalstage/useStage";

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
    $numCols: number,
}) => ({
    position: 'relative',
    display: 'flex',
    width: (100 / props.$numCols) + "%",
    flexBase: (100 / props.$numCols) + "%",
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


export default (props: {
    members: IMember[]
}) => {
    const [numCols, setNumCols] = useState<number>();

    const [fullScreen, setFullScreen] = useState<boolean>(true);
    const [width, setWidth] = useState<string>("100%");
    const [height, setHeight] = useState<string>("100%");

    const handleResize = useCallback(() => {
        console.log("RESIZE");

        const isLandscape: boolean = window.innerHeight < window.innerWidth;


        // MOBILE FIRST
        if (props.members.length === 0)
            return;

        if (isLandscape) {
            console.log("LANDSCAPE");
            setNumCols(4);
        } else {
            console.log("HORIZO");
            if (props.members.length <= 4) {
                setNumCols(1);
                console.log("100%");
                setFullScreen(true);
                setWidth("100%");
                setHeight((100 / props.members.length) + "%");
            } else {
                setNumCols(2);
                setWidth("50%");
                setHeight((100 / props.members.length / 2) + "%");
                setFullScreen(props.members.length <= 8)
            }
        }


    }, [props.members])

    useEffect(() => {
        window.addEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        handleResize();
    }, [props.members])

    return (
        <OuterMembers>
            <InnerMember $fullscreen={fullScreen}>
                {props.members.map((member, index) => (
                    <Member $numCols={numCols} key={index}>
                        <Inner>
                            <MemberView member={member}/>
                        </Inner>
                    </Member>
                ))}
            </InnerMember>
        </OuterMembers>
    )
};
