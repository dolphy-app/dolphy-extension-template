import { anchorSelector, defineClient } from '@dolphy-app/extension-sdk';
import type {
  InjectionHandle,
  InjectionProps,
  PanelHandle,
  PanelProps,
} from '@dolphy-app/extension-sdk';
import { reactComponent } from '@dolphy-app/extension-sdk/react';
import { HelloPanel } from './HelloPanel.tsx';
import { PlanCard } from './PlanCard.tsx';

// runs in the app window: the components are `Mountable`s the app draws into
// its own elements
export const client = defineClient((c) => {
  c.addPanel({
    id: 'hello-react.view',
    title: { en: 'Hello', ru: 'Привет' },
    component: reactComponent<PanelProps, PanelHandle>(HelloPanel),
  });

  // a card inside "Today's plan": the app marks the place with an anchor, the
  // only target it keeps stable
  c.addInjection({
    id: 'hello-react.plan-card',
    target: anchorSelector('dailyPlan'),
    position: 'append',
    component: reactComponent<InjectionProps, InjectionHandle>(PlanCard),
  });
});
