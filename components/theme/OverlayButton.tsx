import {useStyletron} from "baseui";
import {Button, ButtonProps} from "baseui/button";
import React from "react";

export const OverlayButton = (props: ButtonProps & { $active: boolean }) => {
    const [css, theme] = useStyletron();

    return (
        <Button
            {...props}
            overrides={{
                BaseButton: {
                    style: {
                        position: "relative",
                        backgroundColor: props.$active ? theme.colors.primaryA : theme.colors.primary,

                        ":hover:before": {
                            boxShadow: props.$active ? "0px 0px 60px 5px rgba(255,0,0,.8)" : "0px 0px 60px 5px rgba(40,142,250,.8)"
                        },
                        ":before": {
                            content: "''",
                            display: "block",
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            zIndex: -1,
                            transitionTimingFunction: "cubic-bezier(0, 0, 1, 1)",
                            transitionDuration: "200ms",
                            transitionProperty: "box-shadow",
                            boxShadow: props.$active ? "0px 0px 60px 5px rgba(40,142,250,.8)" : undefined
                        }
                    }
                }
            }}
        />
    )

}
