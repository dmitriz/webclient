import {HeaderNavigation} from "baseui/header-navigation";
import React from "react";
import {Button} from "baseui/button";
import {useStyletron} from "baseui";
import {LabelLarge} from "baseui/typography";
import useDigitalStage from "../../lib/useDigitalStage";
import Link from "next/link";


export default () => {
    const {stage, leave, user} = useDigitalStage();
    const [css] = useStyletron();

    return (
        <HeaderNavigation overrides={{
            Root: {
                style: {
                    display: 'flex',
                    alignItems: "center",
                    justifyContent: "space-between"
                }
            }
        }}>
            <div className={css({
                display: 'flex',
                alignItems: "center"
            })}>
                <img className={css({
                    display: "flex",
                    width: "100px",
                    height: "auto"
                })} src="logo.svg"/>
                {stage && (
                    <LabelLarge>{stage.name}</LabelLarge>
                )}
            </div>


            <div className={css({
                display: 'flex',
                justifySelf: 'flex-end',
                alignSelf: 'flex-end'
            })}>
                {stage ? (
                        <Button onClick={leave}>
                            Leave
                        </Button>
                    ) :
                    user ? (
                        <>
                            <Link href="/create">
                                <Button>
                                    Create
                                </Button>
                            </Link>
                            <Link href="/join">
                                <Button>
                                    Join
                                </Button>
                            </Link>
                            <Link href="/logout">
                                <Button>
                                    Logout
                                </Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button>
                                    Login
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button>
                                    Sign up
                                </Button>
                            </Link>
                        </>
                    )}
            </div>
        </HeaderNavigation>
    );
}
