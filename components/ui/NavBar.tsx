import {ALIGN, HeaderNavigation, StyledNavigationItem, StyledNavigationList} from "baseui/header-navigation";
import React from "react";
import {Button} from "baseui/button";
import {useAuth} from "../../lib/useAuth";
import Link from "next/link";
import {styled} from "baseui";
import {useStage} from "../../lib/digitalstage/useStage";
import {StyledLink} from "baseui/link";

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
    const {leave, stage, sendAudio} = useStage();

    return (
        <NavContainer>
            <HeaderNavigation>
                <StyledNavigationList $align={ALIGN.left}>
                    <StyledNavigationItem>
                        <CenterVertical>
                            <Banner src={"/logo.png"}/>
                            Digital Stage
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
                                        <StyledLink onClick={() => leave()}>
                                            Leave
                                        </StyledLink>
                                    </StyledNavigationItem>
                                </>
                            ) : (
                                <>
                                    <StyledNavigationItem>
                                        <Link href="/create">
                                            <StyledLink>
                                                Create stage
                                            </StyledLink>
                                        </Link>
                                    </StyledNavigationItem>
                                    <StyledNavigationItem>
                                        <Link href="/">
                                            <StyledLink>
                                                Join stage
                                            </StyledLink>
                                        </Link>
                                    </StyledNavigationItem>
                                </>
                            )}
                            <StyledNavigationItem>
                                <Link href="/account">
                                    <StyledLink>
                                        Account
                                    </StyledLink>
                                </Link>
                            </StyledNavigationItem>
                            <StyledNavigationItem>
                                <Link href="/logout">
                                    <Button isLoading={loading}>Logout</Button>
                                </Link>
                            </StyledNavigationItem>
                        </>
                    )}
                </StyledNavigationList>
            </HeaderNavigation>
        </NavContainer>
    );
};
