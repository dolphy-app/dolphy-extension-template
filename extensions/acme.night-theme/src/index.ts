import { defineClient } from '@dolphy-app/extension-sdk';
import { night } from './theme.ts';

// runs in the app window: a theme is data, there is no server part
export const client = defineClient((c) => {
  c.addTheme(night);
});
