import {PLACEMENT, StatefulPopover, TRIGGER_TYPE} from "baseui/popover";
import {AppNavBarPropsT} from "baseui/app-nav-bar";
import {Button} from "baseui/button";
import {Avatar} from "baseui/avatar";
import {ChevronDown, ChevronUp} from "baseui/icon";
import React, {useState} from "react";
import {StyledButton} from "./components";

const svgStyleOverride = ({$theme}) => ({paddingLeft: $theme.sizing.scale200});

export default function UserMenu(props: AppNavBarPropsT) {
    // isOpen is used for displaying different arrow icons in open or closed state
    const [isOpen, setIsOpen] = useState(false);
    const {username, userImgUrl} = props;

    return (
        <StatefulPopover
            dismissOnEsc={true}
            dismissOnClickOutside={true}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            placement={PLACEMENT.bottomRight}
            popperOptions={{modifiers: {flip: {enabled: false}}}}
            triggerType={TRIGGER_TYPE.click}
        >
            <Button overrides={{BaseButton: {component: StyledButton}}}>
                <Avatar name={username || ''} src={userImgUrl} size={'32px'}/>
                {isOpen ? (
                    <ChevronUp
                        size={28}
                        overrides={{Svg: {style: svgStyleOverride}}}
                    />
                ) : (
                    <ChevronDown
                        size={28}
                        overrides={{Svg: {style: svgStyleOverride}}}
                    />
                )}
            </Button>
        </StatefulPopover>
    );
}
