import type { ThemeRegistration } from '@dolphy-app/extension-sdk';

// the allowed color and variable keys are `THEME_COLOR_KEYS` and
// `THEME_VARIABLE_KEYS` of '@dolphy-app/extension-sdk'
export const night: ThemeRegistration = {
  id: 'acme.night-theme',
  label: 'Night',
  dark: true,
  colors: {
    background: '#0B1020',
    surface: '#141B2F',
    'surface-variant': '#1E2742',
    'on-background': '#E4E9F7',
    'on-surface': '#E4E9F7',
    'on-surface-variant': '#B4BEDA',
    primary: '#7AA2F7',
    'on-primary': '#0B1020',
    secondary: '#BB9AF7',
    'on-secondary': '#0B1020',
    error: '#F7768E',
    'on-error': '#0B1020',
  },
  variables: { 'border-opacity': 0.2 },
};
