import React, {useEffect, useState} from "react";
import {useAuth} from "../../lib/useAuth";
import Link from "next/link";
import {styled} from "baseui";
import {useDigitalStage} from "../../lib/digitalstage/useDigitalStage";
import {ItemT, MainNavItemT, Unstable_AppNavBar as AppNavBar, UserNavItemT,} from 'baseui/app-nav-bar';
import {Delete as DeleteIcon, Overflow as OverflowIcon} from 'baseui/icon';
import {useRouter} from 'next/router'
import {LabelMedium} from "baseui/typography";

interface NavItem extends ItemT {
    label: string;
    href?: string;
    onClick?: () => void;
}


function renderItemToString(item: NavItem) {
    return item.label;
}

function renderItem(item: NavItem) {
    if (item.href) {
        return (
            <Link href={item.href}>
                <LabelMedium as="a">
                    {item.label}
                </LabelMedium>
            </Link>
        )
    }
    if (item.onClick) {
        return (
            <div onClick={item.onClick}>
                {item.label}
            </div>
        )
    }
    return item.label;
}

const CenterVertical = styled("div", {
    display: 'flex',
    alignItems: 'center'
});

const Banner = styled("img", {
    width: '40px',
    paddingRight: '1rem'
});

const AppNavWrapper = styled("div", {
    boxSizing: 'border-box',
    width: '100vw',
    position: 'relative'
})

const USER_NAV: UserNavItemT[] = [{
    icon: OverflowIcon,
    item: {label: 'Account', href: "/account"},
    mapItemToNode: renderItem,
    mapItemToString: renderItemToString,
},
    {
        icon: DeleteIcon,
        item: {label: 'Logout', href: '/logout'},
        mapItemToNode: renderItem,
        mapItemToString: renderItemToString,
    }];

export default () => {
    const router = useRouter()
    const {user} = useAuth();
    const {leave, id, name} = useDigitalStage();
    const [activeNavItem, setActiveNavItem] = useState<MainNavItemT | UserNavItemT>();
    const [nav, setNav] = useState<MainNavItemT[]>()

    useEffect(() => {
        if (user) {
            if (id) {
                setNav([
                    {
                        item: {label: 'Leave stage', onClick: leave},
                        mapItemToNode: renderItem,
                        mapItemToString: renderItemToString,
                    }
                ]);
            } else {
                setNav([
                    {
                        item: {label: 'Create stage', href: '/create'},
                        mapItemToNode: renderItem,
                        mapItemToString: renderItemToString,
                    },
                    {
                        item: {label: 'Join stage', href: '/'},
                        mapItemToNode: renderItem,
                        mapItemToString: renderItemToString,
                    }
                ]);
            }
        } else {
            setNav([{
                item: {label: 'Login', href: '/login'},
                mapItemToNode: renderItem,
                mapItemToString: renderItemToString,
            },
                {
                    item: {label: 'Sign up', href: '/signup'},
                    mapItemToNode: renderItem,
                    mapItemToString: renderItemToString,
                }]);
        }
    }, [user, id])

    useEffect(() => {
        if (nav) {
            const activeItem = nav.find((item) => {
                if (item.item.href) {
                    return item.item.href === router.pathname;
                }
                return false;
            });
            setActiveNavItem(activeItem);
        }
    }, [router.pathname, nav])

    return (
        <AppNavWrapper>
            <AppNavBar
                appDisplayName={(
                    <CenterVertical>
                        <Banner src={"/logo.png"}/>
                        {name ? name : "Digital Stage"}
                    </CenterVertical>
                )}
                mainNav={nav}
                isNavItemActive={({item}) => {
                    return (
                        item === activeNavItem
                    );
                }}
                onNavItemSelect={() => {
                }}
                userNav={user ? USER_NAV : undefined}
                username={user ? user.displayName : undefined}
                usernameSubtitle={user ? user.email : undefined}
                userImgUrl={user ? user.photoURL : undefined}
            />
        </AppNavWrapper>
    );
};
