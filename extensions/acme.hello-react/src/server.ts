import { defineServer, notify, openPanel } from '@dolphy-app/extension-sdk';
import { greet } from './shared/rpc.ts';

// runs in the extension host: every call registers a contribution
export const server = defineServer((s) => {
  // palette command: shows a notification
  s.registerCommand({
    id: 'acme.hello-react.hello',
    title: { en: 'Say hello', ru: 'Поздороваться' },
    category: 'Hello',
    run: (args) => {
      const name = typeof args === 'string' ? args : 'world';
      return notify(`Hello, ${name}!`);
    },
  });

  // palette command: opens the panel (registered by the client) with properties
  s.registerCommand({
    id: 'acme.hello-react.open',
    title: { en: 'Open the hello panel', ru: 'Открыть панель' },
    category: 'Hello',
    run: () => openPanel('acme.hello-react.view', { name: 'Dolphy' }),
  });

  // hidden from the palette (palette: false): the panel asks for data
  s.registerCommand({
    id: 'acme.hello-react.data',
    title: 'Hello panel data',
    palette: false,
    run: () => ({ message: 'Hello from acme.hello-react' }),
  });

  // a typed call the card in the daily plan makes with `useRpc(greet)`
  s.handle(greet, ({ name }) => ({ greeting: `Hello, ${name}!` }));
});
