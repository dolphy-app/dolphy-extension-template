// @vitest-environment happy-dom
import { APP_KEY, PANEL_HANDLE_KEY } from '@dolphy-app/extension-sdk';
import type { AppApi, JsonValue, PanelHandle } from '@dolphy-app/extension-sdk';
import {
  createTestClient,
  createTestServer,
} from '@dolphy-app/extension-sdk/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, shallowReactive } from 'vue';
import type { App, Component } from 'vue';
import { client, server } from '../src/index.ts';
import PlanCard from '../src/PlanCard.vue';
import StatusPanel from '../src/StatusPanel.vue';

const ID = 'hello-vue';

const disposables: { dispose(): unknown }[] = [];
afterEach(async () => {
  await Promise.all(disposables.splice(0).map((item) => item.dispose()));
});

const start = async () => {
  const running = await createTestServer(server, { extensionId: ID });
  disposables.push(running);
  return running;
};

describe(`${ID}: server`, () => {
  it('hello greets the name from the arguments, "world" without them', async () => {
    const running = await start();
    expect(await running.commands.run(`${ID}.hello`, 'Ada')).toEqual({
      kind: 'notify',
      text: 'Hello, Ada!',
    });
    expect(await running.commands.run(`${ID}.hello`)).toEqual({
      kind: 'notify',
      text: 'Hello, world!',
    });
  });

  it('open asks the app to open the panel with properties', async () => {
    const running = await start();
    expect(await running.commands.run(`${ID}.open`)).toEqual({
      kind: 'openPanel',
      panelId: `${ID}.view`,
      props: { name: 'Dolphy' },
    });
  });

  it('data returns what the panel shows and stays out of the palette', async () => {
    const running = await start();
    expect(await running.commands.run(`${ID}.data`)).toEqual({
      kind: 'data',
      value: { message: `Hello from ${ID}` },
    });
    const hidden = running.registration.commands.find(
      (command) => command.id === `${ID}.data`,
    );
    expect(hidden?.palette).toBe(false);
  });
});

describe(`${ID}: client`, () => {
  it('adds the panel that the open command points to', async () => {
    const running = await createTestClient(client, { extensionId: ID });
    disposables.push(running);
    expect(running.panels.map((panel) => panel.id)).toEqual([`${ID}.view`]);
    expect(running.panels[0]?.component).toBe(StatusPanel);
  });

  it('puts the card at the end of the daily plan anchor', async () => {
    const running = await createTestClient(client, { extensionId: ID });
    disposables.push(running);
    expect(running.injections).toMatchObject([
      {
        id: `${ID}.plan-card`,
        target: '[data-ext-anchor="dailyPlan"]',
        position: 'append',
        component: PlanCard,
      },
    ]);
  });
});

// the app draws Vuetify tags with its Vuetify; the test gives plain elements
const plain = (tag: string): Component =>
  defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h(tag, slots['default']?.()),
  });

// draws a component the way the app does: the keys are provided to it
const mountComponent = (component: Component, provide: (app: App) => void) => {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render: () => h(component) });
  app.component('v-btn', plain('button'));
  app.component('v-card', plain('div'));
  app.component('v-card-text', plain('p'));
  provide(app);
  app.mount(host);
  disposables.push({
    dispose: () => {
      app.unmount();
      host.remove();
    },
  });
  return host;
};

const mountPanel = (
  props: JsonValue | undefined,
  call: PanelHandle['call'],
) => {
  const handle = shallowReactive({
    panelId: `${ID}.view`,
    props,
    context: { courseId: null },
    call,
  });
  const host = mountComponent(StatusPanel, (app) =>
    app.provide(PANEL_HANDLE_KEY, handle),
  );
  return { host, handle };
};

describe(`${ID}: panel`, () => {
  it('shows the data command reply and follows new properties', async () => {
    const calls: string[] = [];
    const { host, handle } = mountPanel({ name: 'Ada' }, async (commandId) => {
      calls.push(commandId);
      return { message: 'Hello from the test' };
    });
    expect(host.querySelector('h2')?.textContent).toBe('Hello, Ada!');
    await vi.waitFor(() =>
      expect(host.querySelector('p')?.textContent).toBe('Hello from the test'),
    );
    expect(calls).toEqual([`${ID}.data`]);

    // the app opens the panel again with new properties
    handle.props = { name: 'Grace' };
    await nextTick();
    expect(host.querySelector('h2')?.textContent).toBe('Hello, Grace!');
  });

  it('asks the data command again when the button is pressed', async () => {
    const calls: string[] = [];
    const { host } = mountPanel(undefined, async (commandId) => {
      calls.push(commandId);
      return { message: 'x' };
    });
    host.querySelector('button')?.click();
    await vi.waitFor(() => expect(calls).toEqual([`${ID}.data`, `${ID}.data`]));
  });

  it('greets the world when it is opened without properties', () => {
    const { host } = mountPanel(undefined, async () => ({ message: 'x' }));
    expect(host.querySelector('h2')?.textContent).toBe('Hello, world!');
  });
});

describe(`${ID}: plan card`, () => {
  it('opens the panel of the extension through the window API', () => {
    const opened: unknown[][] = [];
    const app = {
      openPanel: (...args: unknown[]) => void opened.push(args),
    } as unknown as AppApi;
    const host = mountComponent(PlanCard, (root) => root.provide(APP_KEY, app));
    expect(host.textContent).toContain('Hello from hello-vue');

    host.querySelector('button')?.click();
    expect(opened).toEqual([[ID, `${ID}.view`, { name: 'the daily plan' }]]);
  });
});
