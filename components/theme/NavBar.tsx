import {ALIGN, HeaderNavigation, StyledNavigationItem, StyledNavigationList} from "baseui/header-navigation";
import React from "react";
import {Button, KIND} from "baseui/button";
import {useAuth} from "../../lib/useAuth";
import Link from "next/link";
import {styled} from "baseui";
import {useDigitalStage} from "../../lib/digitalstage/useDigitalStage";

const NavContainer = styled("div", {
    width: '100%'
});

const CenterVertical = styled("div", {
    display: 'flex',
    alignItems: 'center'
});

const Banner = styled("img", {
    width: '40px',
    paddingRight: '1rem'
});

export default () => {
    const {user, loading} = useAuth();
    const {leave, stage} = useDigitalStage();

    return (
        <NavContainer>
            <HeaderNavigation>
                <StyledNavigationList $align={ALIGN.left}>
                    <StyledNavigationItem>
                        <CenterVertical>
                            <Banner src={"/logo.png"}/>
                            {stage ? stage.name : "Digital Stage"}
                        </CenterVertical>
                    </StyledNavigationItem>
                </StyledNavigationList>
                <StyledNavigationList $align={ALIGN.center}/>
                <StyledNavigationList $align={ALIGN.right}>
                    {!user ? (
                        <>
                            <StyledNavigationItem>
                                <Link href="/signup">
                                    <Button isLoading={loading}>Sign Up</Button>
                                </Link>
                            </StyledNavigationItem>
                            <StyledNavigationItem>
                                <Link href="/login">
                                    <Button isLoading={loading}>Login</Button>
                                </Link>
                            </StyledNavigationItem>
                        </>
                    ) : (
                        <>
                            {stage ? (
                                <>
                                    <StyledNavigationItem>
                                        <Button kind={KIND.minimal} onClick={() => leave()}>
                                            Leave
                                        </Button>
                                    </StyledNavigationItem>
                                </>
                            ) : (
                                <>
                                    <StyledNavigationItem>
                                        <Link href="/create">
                                            <Button kind={KIND.minimal}>
                                                Create stage
                                            </Button>
                                        </Link>
                                    </StyledNavigationItem>
                                    <StyledNavigationItem>
                                        <Link href="/">
                                            <Button kind={KIND.minimal}>
                                                Join stage
                                            </Button>
                                        </Link>
                                    </StyledNavigationItem>
                                    <StyledNavigationItem>
                                        <Link href="/logout">
                                            <Button isLoading={loading}>Logout</Button>
                                        </Link>
                                    </StyledNavigationItem>
                                </>
                            )}
                        </>
                    )}
                </StyledNavigationList>
            </HeaderNavigation>
        </NavContainer>
    );
};
