import {styled} from "baseui";
import {Button as BaseButton} from "baseui/button";

export const OverlayButton = styled(BaseButton, (props: {
    $active: boolean
}) => ({
    position: "relative",

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
}));
