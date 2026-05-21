import { createTheme } from '@mui/material/styles';
import './theme/dark.css';

function getCssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.body).getPropertyValue(name);
  return value ? value.trim() : fallback;
}

export function buildThemeFromCssVars() {
  return createTheme({
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
    },
    palette: {
      primary: {
        main: getCssVar('--md-sys-color-primary', '#1976d2'),
        contrastText: getCssVar('--md-sys-color-on-primary', '#fff'),
        light: getCssVar('--md-sys-color-primary-container', '#90caf9'),
        dark: getCssVar('--md-sys-color-on-primary-container', '#1565c0'),
      },
      secondary: {
        main: getCssVar('--md-sys-color-secondary', '#9c27b0'),
        contrastText: getCssVar('--md-sys-color-on-secondary', '#fff'),
        light: getCssVar('--md-sys-color-secondary-container', '#ce93d8'),
        dark: getCssVar('--md-sys-color-on-secondary-container', '#6d1b7b'),
      },
      tertiary: {
        main: getCssVar('--md-sys-color-tertiary', '#607d8b'),
        contrastText: getCssVar('--md-sys-color-on-tertiary', '#fff'),
        light: getCssVar('--md-sys-color-tertiary-container', '#b0bec5'),
        dark: getCssVar('--md-sys-color-on-tertiary-container', '#263238'),
      },
      error: {
        main: getCssVar('--md-sys-color-error', '#f44336'),
        contrastText: getCssVar('--md-sys-color-on-error', '#fff'),
        light: getCssVar('--md-sys-color-error-container', '#e57373'),
        dark: getCssVar('--md-sys-color-on-error-container', '#b71c1c'),
      },
      background: {
        default: getCssVar('--md-sys-color-background', '#fafafa'),
        paper: getCssVar('--md-sys-color-surface', '#fff'),
      },
      text: {
        primary: getCssVar('--md-sys-color-on-background', '#212121'),
        secondary: getCssVar('--md-sys-color-on-surface', '#757575'),
      },
    },
  });
}

const theme = buildThemeFromCssVars();
export default theme;
