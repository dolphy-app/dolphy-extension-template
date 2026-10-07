import { anchorSelector, defineClient } from '@dolphy-app/extension-sdk';
import StreakCard from './StreakCard.vue';

// runs in the app window: the card is a Vue component the app draws inside
// "Today's plan", at the anchor the app keeps stable
export const client = defineClient((c) => {
  c.addInjection({
    id: 'acme.streak.card',
    target: anchorSelector('dailyPlan'),
    position: 'prepend',
    component: StreakCard,
  });
});
