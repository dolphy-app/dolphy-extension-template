import { anchorSelector, defineClient } from '@dolphy-app/extension-sdk';
import PlanCard from './PlanCard.vue';
import StatusPanel from './StatusPanel.vue';

// runs in the app window: panels and injections are Vue components the app draws
export const client = defineClient((c) => {
  // a page of the extension: the sidebar lists it, `openPanel` opens it
  c.addPanel({
    id: 'hello-vue.view',
    title: { en: 'Hello', ru: 'Привет' },
    component: StatusPanel,
  });

  // a card inside "Today's plan": the app marks the place with an anchor, the
  // only target it keeps stable
  c.addInjection({
    id: 'hello-vue.plan-card',
    target: anchorSelector('dailyPlan'),
    position: 'append',
    component: PlanCard,
  });
});
