# acme.streak

A hand-written extension that uses most of the server side of the API: it
counts the days in a row on which the learner closed an attempt, shows the
streak in "Today's plan" and, when the streak ends tonight, puts the exercises
to review first.

## What it does

- Every closed attempt (`attempt.closed`) moves the streak: a new day after the
  last one adds a day, the same day changes nothing, a gap starts over. An
  attempt with the outcome `gave-up` does not count. Days are calendar days in
  the time zone of the machine.
- A card at the start of "Today's plan" reads the streak: "N-day streak", with
  "Practice today to keep it." when today has no attempt yet.
- While the streak is at risk, the batch the engine builds (the day plan or a
  practice batch) is reordered: exercises with the reason `review` come first,
  the most forgotten ones (lowest `memory[i].retrievability`) at the head.
  Otherwise the batch is left alone.

## How it is built

- `src/streak.ts` — the pure part: `advance` (the streak after an attempt),
  `status` (`{ days, atRisk }` for a moment). No SDK, easy to test.
- `src/order.ts` — `reviewsFirst`, the pure ordering of a `practice.batch`
  request.
- `src/shared/rpc.ts` — the `streakRpc` contract (`defineRpc`, `zod`
  schemas) that both parts import.
- `src/server.ts` — `server` (`defineServer`), built into `main.mjs`:
  `s.on('attempt.closed', …)` writes to `s.storage` (JSON, private to the
  extension, kept across restarts), `s.handle(streakRpc, …)` answers the card,
  `s.before('practice.batch', …)` is the hook.
- `src/client.ts` + `src/StreakCard.vue` — `client` (`defineClient`), built
  into `client.mjs`: `addInjection` at `anchorSelector('dailyPlan')` and a Vue
  single-file component that asks the server part with `useRpc(streakRpc)`.
- `test/server.test.ts` — events, storage, the contract and the hook through
  `createTestServer` (`running.events.emit`, `running.rpc`, `running.hook`),
  with the clock set by `vi.setSystemTime`.
- `test/card.test.ts` — the card mounted with `createApp` in `happy-dom`; its
  `useRpc` reaches the real server part through a fake window engine.

Things worth knowing:

- A hook can cancel or rewrite an operation of the engine: an error, a wrong
  answer or a slow handler (30 s) fails the whole batch. Keep hooks small and
  return the request as it is when there is nothing to change.
- `Streak` is a `type`, not an `interface`: `s.storage` takes JSON only, and an
  interface is not assignable to a JSON value.
- Events carry ids, the grade, the outcome and the time, never the learner's
  answer.

## Commands

Run them from the repository root with
`pnpm --filter ./extensions/acme.streak <script>`, or from this folder:

```sh
pnpm build      # dist-ext/acme.streak
pnpm test
pnpm typecheck  # tsc; it does not look inside .vue files
pnpm validate   # parses the built manifest the way the app does
pnpm lint       # the checks the catalog review also runs
pnpm dev        # rebuilds on every change and starts the installed app
```

Replace `your-github-login` in the `author` field of `extension.json` with your
GitHub login before publishing.
