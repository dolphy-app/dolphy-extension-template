import type { LearningEventPayloads } from '@dolphy-app/extension-sdk';
import { createTestServer } from '@dolphy-app/extension-sdk/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../src/index.ts';
import { streakRpc } from '../src/shared/rpc.ts';

type Attempt = LearningEventPayloads['attempt.closed'];

// noon of a day in October 2026, in the time zone of the machine
const noon = (day: number): number => new Date(2026, 9, day, 12).getTime();

const attempt = (
  day: number,
  outcome: Attempt['outcome'] = 'passed',
): Attempt => ({
  exerciseId: 'c::l::e',
  courseId: 'c',
  lessonId: 'l',
  grade: 4,
  outcome,
  source: 'runner',
  at: noon(day),
});

const memoryOf = (retrievability: number | null) => ({
  retrievability,
  lastAttemptAt: retrievability === null ? null : 1_000,
  attempts: retrievability === null ? 0 : 3,
  stability: retrievability === null ? null : 5,
  difficulty: retrievability === null ? null : 4,
});

const disposables: { dispose(): unknown }[] = [];
const start = async () => {
  const running = await createTestServer(server, {
    extensionId: 'acme.streak',
  });
  disposables.push(running);
  return running;
};

// the server asks the clock for "today": only `Date` is faked
const today = (day: number) => vi.setSystemTime(noon(day));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  today(10);
});
afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(disposables.splice(0).map((item) => item.dispose()));
});

describe('acme.streak: registrations', () => {
  it('subscribes to attempt.closed, answers the contract and hooks the batch', async () => {
    const running = await start();
    expect(running.registration.events).toEqual(['attempt.closed']);
    expect(running.registration.rpcs).toEqual(['streak.status']);
    expect(running.registration.hooks).toEqual(['practice.batch']);
  });
});

describe('acme.streak: attempt.closed', () => {
  it('counts consecutive days and ignores a repeat on the same day', async () => {
    const running = await start();
    await running.events.emit('attempt.closed', attempt(1));
    await running.events.emit('attempt.closed', attempt(1));
    await running.events.emit('attempt.closed', attempt(2));
    expect(await running.storage.get('streak')).toEqual({
      days: 2,
      last: '2026-10-02',
    });
  });

  it('a skipped day starts over; giving up leaves the streak alone', async () => {
    const running = await start();
    await running.events.emit('attempt.closed', attempt(1));
    await running.events.emit('attempt.closed', attempt(2));
    await running.events.emit('attempt.closed', attempt(3, 'gave-up'));
    expect(await running.storage.get('streak')).toEqual({
      days: 2,
      last: '2026-10-02',
    });
    await running.events.emit('attempt.closed', attempt(5));
    expect(await running.storage.get('streak')).toEqual({
      days: 1,
      last: '2026-10-05',
    });
  });

  it('an attempt of an earlier day does not move the streak back', async () => {
    const running = await start();
    await running.events.emit('attempt.closed', attempt(4));
    await running.events.emit('attempt.closed', attempt(2));
    expect(await running.storage.get('streak')).toEqual({
      days: 1,
      last: '2026-10-04',
    });
  });
});

describe('acme.streak: streak.status', () => {
  it('is empty before the first attempt', async () => {
    const running = await start();
    expect(await running.rpc(streakRpc, {})).toEqual({
      days: 0,
      atRisk: false,
    });
  });

  it('is safe once today has an attempt', async () => {
    const running = await start();
    await running.events.emit('attempt.closed', attempt(9));
    await running.events.emit('attempt.closed', attempt(10));
    expect(await running.rpc(streakRpc, {})).toEqual({
      days: 2,
      atRisk: false,
    });
  });

  it('is at risk when the last attempt was yesterday', async () => {
    const running = await start();
    await running.events.emit('attempt.closed', attempt(8));
    await running.events.emit('attempt.closed', attempt(9));
    expect(await running.rpc(streakRpc, {})).toEqual({ days: 2, atRisk: true });
  });

  it('is over after a missed day and is not at risk any more', async () => {
    const running = await start();
    await running.events.emit('attempt.closed', attempt(7));
    expect(await running.rpc(streakRpc, {})).toEqual({
      days: 0,
      atRisk: false,
    });
  });
});

describe('acme.streak: practice.batch', () => {
  const request = {
    sessionId: null,
    source: 'plan' as const,
    exerciseIds: ['c::l::a', 'c::l::b', 'c::l::c', 'c::l::d'],
    reasons: ['new', 'review', 'remediation', 'review'] as (
      'review' | 'new' | 'remediation'
    )[],
    memory: [memoryOf(null), memoryOf(0.8), memoryOf(0.5), memoryOf(0.3)],
  };

  it('leaves the batch alone while the streak is safe', async () => {
    const running = await start();
    await running.events.emit('attempt.closed', attempt(10));
    expect(await running.hook('practice.batch', request)).toEqual({
      exerciseIds: request.exerciseIds,
      reasons: request.reasons,
    });
  });

  it('puts the most forgotten reviews first while the streak is at risk', async () => {
    const running = await start();
    await running.events.emit('attempt.closed', attempt(9));
    expect(await running.hook('practice.batch', request)).toEqual({
      exerciseIds: ['c::l::d', 'c::l::b', 'c::l::a', 'c::l::c'],
      reasons: ['review', 'review', 'new', 'remediation'],
    });
  });
});
