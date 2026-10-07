import { defineServer } from '@dolphy-app/extension-sdk';
import { reviewsFirst } from './order.ts';
import { streakRpc } from './shared/rpc.ts';
import { advance, status } from './streak.ts';
import type { Streak } from './streak.ts';

const KEY = 'streak';

// runs in the extension host: every call registers a contribution
export const server = defineServer((s) => {
  const load = () => s.storage.get<Streak>(KEY);

  // arrives asynchronously, once per recorded attempt
  s.on('attempt.closed', async ({ at, outcome }) => {
    // giving up is not practice
    if (outcome === 'gave-up') return;
    await s.storage.set(KEY, advance(await load(), at));
  });

  // the card in the daily plan asks for this with `useRpc(streakRpc)`
  s.handle(streakRpc, async () => status(await load(), Date.now()));

  // runs before the engine hands a batch or the day plan to the learner: when
  // the streak ends tonight, the exercises to review come first
  s.before('practice.batch', async (request) => {
    const { atRisk } = status(await load(), Date.now());
    if (!atRisk) {
      return { exerciseIds: request.exerciseIds, reasons: request.reasons };
    }
    return reviewsFirst(request);
  });
});
