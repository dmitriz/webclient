import {createLightTheme, LightTheme} from 'baseui';
import {ThemePrimitives} from "baseui/theme";
import {black, darkRed, red, white} from "./colors";

const primitives: Partial<ThemePrimitives> = {
    ...LightTheme.colors,
    primaryA: black,
    primaryB: white,
    primary: darkRed,

    accent: red,
}
export const DigitalStageLightTheme = createLightTheme(primitives);
