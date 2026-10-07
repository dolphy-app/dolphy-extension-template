// @vitest-environment happy-dom
import { ENGINE_KEY, EXTENSION_ID_KEY } from '@dolphy-app/extension-sdk';
import type { ExtensionEngine } from '@dolphy-app/extension-sdk';
import {
  createTestClient,
  createTestServer,
} from '@dolphy-app/extension-sdk/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h } from 'vue';
import { client, server } from '../src/index.ts';
import { streakRpc } from '../src/shared/rpc.ts';
import StreakCard from '../src/StreakCard.vue';

const noon = (day: number): number => new Date(2026, 9, day, 12).getTime();

const disposables: { dispose(): unknown }[] = [];
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(noon(10));
});
afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(disposables.splice(0).map((item) => item.dispose()));
});

describe('acme.streak: client', () => {
  it('puts the card at the start of the daily plan anchor', async () => {
    const running = await createTestClient(client, {
      extensionId: 'acme.streak',
    });
    disposables.push(running);
    expect(running.injections).toMatchObject([
      {
        id: 'acme.streak.card',
        target: '[data-ext-anchor="dailyPlan"]',
        position: 'prepend',
        component: StreakCard,
      },
    ]);
  });
});

// the app draws Vuetify tags with its Vuetify; the test gives plain elements
const plain = (tag: string) =>
  defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h(tag, slots['default']?.()),
  });

// draws the card the way the app does: the extension id and the window engine
// are provided to it, and `useRpc` goes through `engine.extensions.invokeRpc`
const mountCard = (engine: ExtensionEngine) => {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render: () => h(StreakCard) });
  app.component('v-card', plain('div'));
  app.component('v-card-text', plain('p'));
  app.provide(EXTENSION_ID_KEY, 'acme.streak');
  app.provide(ENGINE_KEY, engine);
  app.mount(host);
  disposables.push({
    dispose: () => {
      app.unmount();
      host.remove();
    },
  });
  return host;
};

// the real server part behind the window engine, with attempts on `days`
const engineAfterAttempts = async (days: number[]) => {
  const running = await createTestServer(server, {
    extensionId: 'acme.streak',
  });
  disposables.push(running);
  for (const day of days) {
    await running.events.emit('attempt.closed', {
      exerciseId: 'c::l::e',
      courseId: 'c',
      lessonId: 'l',
      grade: 4,
      outcome: 'passed',
      source: 'runner',
      at: noon(day),
    });
  }
  return {
    extensions: { invokeRpc: async () => running.rpc(streakRpc, {}) },
  } as unknown as ExtensionEngine;
};

describe('acme.streak: card', () => {
  it('invites to start a streak when there is none', async () => {
    const host = mountCard(await engineAfterAttempts([]));
    await vi.waitFor(() => expect(host.textContent).toContain('No streak yet'));
  });

  it('shows the days of the streak', async () => {
    const host = mountCard(await engineAfterAttempts([9, 10]));
    await vi.waitFor(() => expect(host.textContent).toContain('2-day streak.'));
    expect(host.textContent).not.toContain('Practice today');
  });

  it('asks to practice today when the streak ends tonight', async () => {
    const host = mountCard(await engineAfterAttempts([8, 9]));
    await vi.waitFor(() =>
      expect(host.textContent).toContain('2-day streak. Practice today'),
    );
  });

  it('says so when the server part does not answer', async () => {
    const engine = {
      extensions: {
        invokeRpc: async () => {
          throw new Error('host is down');
        },
      },
    } as unknown as ExtensionEngine;
    const host = mountCard(engine);
    await vi.waitFor(() =>
      expect(host.textContent).toContain('not available right now'),
    );
  });
});
