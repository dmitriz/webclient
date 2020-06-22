import {styled, withStyle} from "baseui";
import {Theme} from "baseui/theme";

export const Root = styled("div", (props) => ({
    ...props.$theme.typography.font300,
    boxSizing: 'border-box',
    backgroundColor: props.$theme.colors.backgroundPrimary,
    boxShadow: '0px 1px 0px rgba(0, 0, 0, 0.08)',
    width: '100%',
}));

export const StyledButton = styled("button", (props: {
    $theme: Theme;
    $isFocusVisible: boolean;
}) => ({
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    color: props.$theme.colors.contentPrimary,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    paddingTop: '0',
    paddingBottom: '0',
    paddingLeft: '0',
    paddingRight: '0',
    marginLeft: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    outline: props.$isFocusVisible ? `3px solid ${props.$theme.colors.accent}` : 'none',
    outlineOffset: '-3px',
    WebkitAppearance: 'none',
    cursor: 'pointer',
}))

export const AppName = styled("div", props => ({
    ...props.$theme.typography.font550,
    color: props.$theme.colors.primary,
    textDecoration: 'none',
    [props.$theme.mediaQuery.medium]: {
        ...props.$theme.typography.font650,
    }
}));

export const SideBarButton = withStyle(StyledButton, props => ({
    marginRight: props.$theme.sizing.scale600,
    paddingTop: props.$theme.sizing.scale100,
    paddingBottom: props.$theme.sizing.scale100,
    paddingLeft: props.$theme.sizing.scale100,
    paddingRight: props.$theme.sizing.scale100,
}));

export const NavBarItem = styled("div", (props) => ({}));

export const StyledSpacing = styled("div", props => ({
    boxSizing: 'border-box',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingTop: props.$theme.sizing.scale400,
    paddingBottom: props.$theme.sizing.scale400,
    [props.$theme.mediaQuery.medium]: {
        paddingTop: props.$theme.sizing.scale700,
        paddingBottom: props.$theme.sizing.scale700,
    },
}));

export const StyledPrimaryMenuContainer = styled("div", {
    boxSizing: 'border-box',
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
});

export const UserMenuListItem = styled("div", {});


export const StyledMainMenuItem = styled("div", (props: {
    $theme?: Theme,
    $active?: boolean,
    $isFocusVisible: boolean
}) => ({
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    color: props.$active ? props.$theme.colors.contentPrimary : props.$theme.colors.contentTertiary,
    marginLeft: props.$theme.sizing.scale700,
    marginRight: props.$theme.sizing.scale700,
    paddingTop: '0',
    paddingBottom: '0',
    outline: 'none',
    outlineOffset: '-3px',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor:
        props.$active && !props.$isFocusVisible ? props.$theme.colors.primary : 'transparent',
    cursor: props.$active ? 'default' : 'pointer',
    whiteSpace: 'initial',
    ':first-child': {
        marginLeft: '0',
    },
    ':last-child': {
        marginRight: '0',
    },
    ':hover': {
        color: props.$theme.colors.primary,
    },
}))
