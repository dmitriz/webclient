import Container from "./Container";
import CenteredCard from "./CenteredCard";
import {styled} from "baseui";
import React, {useEffect} from "react";
import NavBar from "./NavBar";
import {useStage} from "../../lib/digitalstage/useStage";
import {useDarkModeSwitch} from "../../lib/useDarkModeSwitch";

const MarginTop = styled("div", {
    marginTop: '10vh'
});

export default (props: {
    children: React.ReactNode
}) => {
    const {stage} = useStage();
    const {setDarkMode} = useDarkModeSwitch();

    useEffect(() => {
        setDarkMode(stage !== undefined);
    }, [stage]);

    return (
        <>
            <NavBar/>
            <Container>
                <MarginTop>
                    <CenteredCard>
                        {props.children}
                    </CenteredCard>
                </MarginTop>
            </Container>
        </>
    );
}
