import { defineServer, notify, openPanel } from '@dolphy-app/extension-sdk';

// runs in the extension host: every call registers a contribution
export const server = defineServer((s) => {
  // palette command: shows a notification
  s.registerCommand({
    id: 'hello-vue.hello',
    title: { en: 'Say hello', ru: 'Поздороваться' },
    category: 'Hello',
    run: (args) => {
      const name = typeof args === 'string' ? args : 'world';
      return notify(`Hello, ${name}!`);
    },
  });

  // palette command: opens the panel (registered by the client) with properties
  s.registerCommand({
    id: 'hello-vue.open',
    title: { en: 'Open the hello panel', ru: 'Открыть панель' },
    category: 'Hello',
    run: () => openPanel('hello-vue.view', { name: 'Dolphy' }),
  });

  // hidden from the palette (palette: false): the panel asks for data
  s.registerCommand({
    id: 'hello-vue.data',
    title: 'Hello panel data',
    palette: false,
    run: () => ({ message: 'Hello from hello-vue' }),
  });
});
