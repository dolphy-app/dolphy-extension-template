// @vitest-environment happy-dom
import { isMountable } from '@dolphy-app/extension-sdk';
import type {
  AppApi,
  ExtensionEngine,
  InjectionHandle,
  PanelHandle,
  PanelProps,
} from '@dolphy-app/extension-sdk';
import {
  createTestClient,
  createTestServer,
  mountForTest,
} from '@dolphy-app/extension-sdk/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { client, server } from '../src/index.ts';
import { greet } from '../src/shared/rpc.ts';

const ID = 'hello-react';

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

  it('answers the greet contract and rejects an input that breaks it', async () => {
    const running = await start();
    expect(running.registration.rpcs).toEqual(['hello.greet']);
    expect(await running.rpc(greet, { name: 'Ada' })).toEqual({
      greeting: 'Hello, Ada!',
    });
    await expect(running.rpc(greet, { name: '' })).rejects.toThrow();
  });
});

describe(`${ID}: client`, () => {
  it('adds the panel that the open command points to', async () => {
    const running = await createTestClient(client, { extensionId: ID });
    disposables.push(running);
    expect(running.panels.map((panel) => panel.id)).toEqual([`${ID}.view`]);
    expect(isMountable(running.panels[0]?.component)).toBe(true);
  });

  it('puts the card at the end of the daily plan anchor', async () => {
    const running = await createTestClient(client, { extensionId: ID });
    disposables.push(running);
    expect(running.injections).toMatchObject([
      {
        id: `${ID}.plan-card`,
        target: '[data-ext-anchor="dailyPlan"]',
        position: 'append',
      },
    ]);
    expect(isMountable(running.injections[0]?.component)).toBe(true);
  });
});

// draws the panel the way the app does: into an element, on a context the test controls
const mountPanel = async (
  props: PanelProps['props'],
  call: PanelHandle['call'],
) => {
  const running = await createTestClient(client, { extensionId: ID });
  disposables.push(running);
  const component = running.panels[0]?.component;
  if (!isMountable(component)) throw new Error('the panel is not a Mountable');
  const panelProps: PanelProps = {
    panelId: `${ID}.view`,
    props,
    context: { courseId: null },
  };
  const mounted = await mountForTest(component, {
    props: panelProps,
    handle: { ...panelProps, call },
  });
  disposables.push({ dispose: () => mounted.unmount() });
  return { mounted, panelProps };
};

describe(`${ID}: panel`, () => {
  it('shows the data command reply and follows new properties', async () => {
    const calls: string[] = [];
    const { mounted, panelProps } = await mountPanel(
      { name: 'Ada' },
      async (commandId) => {
        calls.push(commandId);
        return { message: 'Hello from the test' };
      },
    );
    expect(mounted.el.querySelector('h2')?.textContent).toBe('Hello, Ada!');
    await vi.waitFor(() =>
      expect(mounted.el.querySelector('p')?.textContent).toBe(
        'Hello from the test',
      ),
    );
    expect(calls).toEqual([`${ID}.data`]);

    mounted.setProps({ ...panelProps, props: { name: 'Grace' } });
    expect(mounted.el.querySelector('h2')?.textContent).toBe('Hello, Grace!');
  });

  it('greets the world when it is opened without properties', async () => {
    const { mounted } = await mountPanel(undefined, async () => ({
      message: 'x',
    }));
    expect(mounted.el.querySelector('h2')?.textContent).toBe('Hello, world!');
  });

  it('asks the data command again when the button is pressed', async () => {
    const calls: string[] = [];
    const { mounted } = await mountPanel(undefined, async (commandId) => {
      calls.push(commandId);
      return { message: 'x' };
    });
    mounted.el.querySelector('button')?.click();
    await vi.waitFor(() => expect(calls).toEqual([`${ID}.data`, `${ID}.data`]));
  });
});

// draws the card the way the app does: the window API and the engine are
// fakes, the server part is the real one
const mountCard = async (invoke: (input: unknown) => Promise<unknown>) => {
  const running = await createTestClient(client, { extensionId: ID });
  disposables.push(running);
  const component = running.injections[0]?.component;
  if (!isMountable(component)) throw new Error('the card is not a Mountable');
  const notified: unknown[][] = [];
  const app = {
    notify: (...args: unknown[]) => void notified.push(args),
  } as unknown as AppApi;
  const engine = {
    extensions: {
      invokeRpc: async (request: { input: unknown }) => invoke(request.input),
    },
  } as unknown as ExtensionEngine;
  const target: InjectionHandle = { target: document.body, position: 'append' };
  const mounted = await mountForTest(component, {
    props: target,
    handle: target,
    app,
    engine,
    extensionId: ID,
  });
  disposables.push({ dispose: () => mounted.unmount() });
  return { mounted, notified };
};

describe(`${ID}: plan card`, () => {
  it('shows and announces the greeting the server part sends', async () => {
    const running = await start();
    const { mounted, notified } = await mountCard((input) =>
      running.rpc(greet, input as { name: string }),
    );
    mounted.el.querySelector('button')?.click();
    await vi.waitFor(() =>
      expect(
        mounted.el.querySelector('[data-role="greeting"]')?.textContent,
      ).toBe('Hello, Dolphy!'),
    );
    expect(notified).toEqual([['Hello, Dolphy!']]);
  });

  it('shows a failed call as an error toast', async () => {
    const { mounted, notified } = await mountCard(async () => {
      throw new Error('the server is busy');
    });
    mounted.el.querySelector('button')?.click();
    await vi.waitFor(() =>
      expect(notified).toEqual([['the server is busy', 'error']]),
    );
  });
});
