import React, {useState} from "react";
import {
    AppName,
    Root,
    SideBarButton,
    StyledMainMenuItem,
    StyledPrimaryMenuContainer,
    StyledSpacing
} from "./components";
import * as  firebase from "firebase/app";
import {useStyletron} from "baseui";
import {Cell, Grid} from "baseui/layout-grid";
import {Button} from "baseui/button";
import {Menu as MenuIcon} from "baseui/icon";
import {Drawer} from "baseui/drawer";
import {useRouter} from "next/router";
import {LabelMedium} from "baseui/typography";
import Link from "next/link";

export interface NavItem {
    label: string;
    href?: string;
    onClick?: () => void;
}

const MainMenuItem = (props: {
    item: NavItem,
}) => {
    if (props.item.href) {
        return (
            <Link href={props.item.href}>
                <LabelMedium as="a">
                    {props.item.label}
                </LabelMedium>
            </Link>
        )
    }

    return (
        <Button kind="minimal" size="large"
                overrides={{
                    BaseButton: {
                        style: {
                            width: "100%"
                        }
                    }
                }}
                onClick={props.item.onClick}>
            <LabelMedium>
                {props.item.label}
            </LabelMedium>
        </Button>
    )
}


const DrawerMainMenuItem = (props: {
    item: NavItem,
}) => {
    if (props.item.href) {
        return (
            <Link href={props.item.href}>
                <Button kind="minimal" size="large"
                        overrides={{
                            BaseButton: {
                                style: {
                                    width: "100%"
                                }
                            }
                        }}>
                    {props.item.label}
                </Button>
            </Link>
        )
    }

    return (
        <Button kind="minimal" size="large"
                overrides={{
                    BaseButton: {
                        style: {
                            width: "100%"
                        }
                    }
                }}
                onClick={props.item.onClick}>
            <LabelMedium>
                {props.item.label}
            </LabelMedium>
        </Button>
    )
}

export default (props: {
    logo?: React.ReactNode,
    main: NavItem[],
    user: firebase.User
}) => {
    const router = useRouter();
    const [css, theme] = useStyletron();
    const [open, setOpen] = useState<boolean>(false);

    return (
        <>
            <Root>
                <div
                    className={css({
                        [`@media screen and (min-width: ${theme.breakpoints.large}px)`]: {
                            display: 'none',
                        },
                    })}
                >
                    <Grid>
                        <Cell span={[4, 8, 0]}>
                            <StyledSpacing>
                                <Button
                                    overrides={{BaseButton: {component: SideBarButton}}}
                                    onClick={() => setOpen(prevState => !prevState)}
                                >
                                    <MenuIcon size={'24px'}/>
                                </Button>
                                <AppName>
                                    {props.logo && props.logo}
                                </AppName>
                            </StyledSpacing>
                        </Cell>
                    </Grid>
                </div>

                <div
                    className={css({
                        [`@media screen and (max-width: ${theme.breakpoints.large - 1}px)`]: {
                            display: 'none',
                        },
                    })}
                >
                    <Grid>
                        <Cell span={[0, 3, 3]}>
                            <StyledSpacing>
                                <AppName>
                                    {props.logo && props.logo}
                                </AppName>
                            </StyledSpacing>
                        </Cell>
                        <Cell span={props.user ? [0, 4, 8] : [0, 5, 9]}>
                            <StyledPrimaryMenuContainer
                                role="navigation"
                                aria-label="Main navigation">
                                {props.main.map((item) =>
                                    <StyledMainMenuItem $isFocusVisible={false}
                                                        $active={item.href && router.pathname === item.href}
                                                        key={item.label}>
                                        <MainMenuItem
                                            item={item}/>
                                    </StyledMainMenuItem>)}
                            </StyledPrimaryMenuContainer>
                        </Cell>
                        {props.user && (
                            <Cell span={[0, 1, 1]}>
                                <StyledSpacing>
                                </StyledSpacing>
                            </Cell>
                        )}
                    </Grid>

                </div>

            </Root>
            <Drawer
                isOpen={open}
                onClose={() => setOpen(false)}
                anchor="left"
                overrides={{
                    Root: {
                        style: {
                            zIndex: 9996
                        }
                    }
                }}
            >
                {props.user && (
                    <LabelMedium>
                        <p>Signed in as</p>
                        <p>{props.user.displayName}</p>
                    </LabelMedium>
                )}
                {props.main.map((item) => (
                    <div key={item.label} className={css({
                        display: 'flex',
                        width: '100%',
                        flexDirection: 'column',
                    })}>
                        <DrawerMainMenuItem item={item}
                                            key={item.label}/>
                    </div>
                ))}
            </Drawer>
        </>
    );
};
