import Container from "./Container";
import CenteredCard from "./CenteredCard";
import {styled} from "baseui";
import React, {useEffect} from "react";
import NavBar from "./NavBar";
import {useDarkModeSwitch} from "../../lib/useDarkModeSwitch";
import {useConnection} from "../../lib/useConnection";

const MarginTop = styled("div", {
    marginTop: '10vh'
});
const Background = styled('div', (props: {
    $darkMode: boolean
}) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: props.$darkMode ? 'black' : 'white',
    zIndex: -1
}));

export default (props: {
    children: React.ReactNode
}) => {
    const {stage} = useConnection();
    const {darkMode, setDarkMode} = useDarkModeSwitch();

    useEffect(() => {
        setDarkMode(stage !== undefined);
    }, [stage]);

    return (
        <>
            <Background $darkMode={darkMode}/>
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
