// constants/colors.js
// Font families for Thai language support
import FONTS from '../src/constants/fonts';

const coffeeTheme = {
  primary: "#8B593E",
  background: "#FFF8F3",
  text: "#4A3428",
  border: "#E5D3B7",
  white: "#FFFFFF",
  textLight: "#9A8478",
  redwine: "#6A2E35",
  // redwine: "#800020",
  income: "#2ECC71",
  expense: "#E74C3C",
  card: "#FFFFFF",
  shadow: "#000000",
  creem: "#fdfaf4ff",
};

const forestTheme = {
  primary: "#2E7D32",
  background: "#E8F5E9",
  text: "#1B5E20",
  border: "#C8E6C9",
  white: "#FFFFFF",
  textLight: "#66BB6A",
  redwine: "#6A2E35",
  income: "#388E3C",
  expense: "#E74C3C",
  card: "#FFFFFF",
  shadow: "#000000",
  creem: "#fdfaf4ff",
};

const purpleTheme = {
  primary: "#6A1B9A",
  background: "#F3E5F5",
  text: "#4A148C",
  border: "#D1C4E9",
  white: "#FFFFFF",
  textLight: "#BA68C8",
  redwine: "#6A2E35",
  income: "#388E3C",
  expense: "#E74C3C",
  card: "#FFFFFF",
  shadow: "#000000",
  creem: "#fdfaf4ff",
};

const oceanTheme = {
  primary: "#0277BD",
  background: "#E1F5FE",
  text: "#01579B",
  border: "#B3E5FC",
  white: "#FFFFFF",
  textLight: "#4FC3F7",
  redwine: "#6A2E35",
  income: "#26A69A",
  card: "#FFFFFF",
  shadow: "#000000",
  creem: "#fdfaf4ff",
};

export const THEMES = {
  coffee: coffeeTheme,
  forest: forestTheme,
  purple: purpleTheme,
  ocean: oceanTheme,
};

// 👇 change this to switch theme
export const COLORS = THEMES.ocean;

// Export FONTS for easy import alongside COLORS
export { FONTS };