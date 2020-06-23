import {createDarkTheme, DarkTheme} from 'baseui';
import {ThemePrimitives} from "baseui/theme";
import {black, blue, darkRed, red, white} from "./colors";

const primitives: Partial<ThemePrimitives> = {
    ...DarkTheme.colors,
    primaryA: white,
    primaryB: black,
    primary: red,

    accent: blue,
}

export const DigitalStageDarkTheme = createDarkTheme(primitives);
