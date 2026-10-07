# Dolphy extensions

A pnpm workspace of Dolphy extensions. Each folder in `extensions/` is a
stand-alone `dolphy-ext` project laid out like the catalog
(`dolphy-app/dolphy-extensions`), so it can be copied into a catalog pull
request as it is. The build, the checks and the tests are ready: write the code
and the manifest.

## Layout

- `extensions/<id>/` — one extension; the folder name is the extension id:
  - `extension.json` — the manifest: identity and catalog metadata only, the
    build adds `main` and `client`;
  - `src/index.ts` — re-exports `server` and `client` from separate files;
  - `src/server.ts` — `server` (`defineServer`), built into `main.mjs`, runs in
    the extension host;
  - `src/client.ts` (`.tsx` with React) — `client` (`defineClient`), built into
    `client.mjs`, runs in the app window; components are `.vue` single-file
    components, `defineComponent`, or `Mountable`s (`reactComponent`);
  - `src/shared/` — code both parts import, such as `defineRpc` contracts;
  - `test/` — `vitest`; `package.json`, `tsconfig.json`, `pnpm-lock.yaml`,
    `README.md`;
  - `dolphy-ext.config.json` — only for React (`"frameworks": ["react"]`) and
    extra Node entries;
  - `dist-ext/<id>/` — the build output; never edit or commit it.
- `extensions/*` — the examples (Vue and React). Read the one closest to the
  task before writing new code.
- `scripts/create-extension.mjs` — `pnpm create:extension`; `scripts/dev.mjs` —
  `pnpm dev <id>`.
- `.github/workflows/ci.yml` — runs the commands below on every push and pull
  request.

## Commands

From the repository root (they act on every extension):

- `pnpm install` — the toolchain and the dependencies; writes one
  `pnpm-lock.yaml` per extension (`sharedWorkspaceLockfile: false`), commit them;
- `pnpm build` — `dolphy-ext build` into `extensions/<id>/dist-ext/<id>`;
- `pnpm test` — `vitest`;
- `pnpm typecheck` — `tsc` (it does not look inside `.vue` files);
- `pnpm validate` — parse the built manifests the way the app does (after
  `pnpm build`);
- `pnpm check` — `dolphy-ext catalog check extensions --skip-github-check`, the
  catalog rules; no output means no findings;
- `pnpm dev <id>` — a watch build of `extensions/<id>` and the installed app
  (`dolphy-ext dev`; quit a running Dolphy first, it has one instance);
- `pnpm create:extension <id> [--template <name>]` — a new extension;
- `pnpm format` — Prettier (80 columns, single quotes).

For one extension: `pnpm --filter ./extensions/<id> <script>` with `build`,
`test`, `typecheck`, `validate`, `lint` (the catalog's review checks on the
project), `watch` or `dev`.

Before a pull request run `pnpm typecheck`, `pnpm test`, `pnpm build`,
`pnpm validate` and `pnpm check`: all must pass.

## Rules

- `extension.json` holds the identity of the extension only (`id`, `version`,
  `name`, `description`, `author`, `tags`). Contributions are registered by code:
  `server` (`defineServer`) and/or `client` (`defineClient`). The folder name
  equals the `id`.
- Write ids in the code prefixed with the extension id (`my-extension.card`): a
  command, a panel, an injection, a setting, an exercise type. The host and the
  window refuse an id that is taken or does not carry the prefix. RPC names
  (`defineRpc`) are lower-case segments such as `my-extension.status`.
- The server part must not import `vue`, `vuetify`, components or anything
  client-only. The client part must not import `node:*`. Keep both parts in
  separate files that `src/index.ts` re-exports, and keep the top level of
  `src/index.ts` and its modules to declarations: that is how the build tells
  the parts apart.
- The app gives the client code its own `vue` and `vuetify`: import them as
  usual, they stay out of the bundle. Any other framework is a bundled
  dependency of the extension: React is switched on by
  `"frameworks": ["react"]` in `dolphy-ext.config.json`
  (`@dolphy-app/extension-sdk/react`: `reactComponent`, `useApp`, `useEngine`,
  `useRpc`, `usePanel`, `useInjection`, `useTheme`, `useLocale`). React
  components get no Vuetify components and no app overlays.
- In `.vue` files write `<style scoped>`: a plain `<style>` goes into the whole
  window document. `<style module>` and `.vue` files in the server part are not
  supported. Use `<v-btn>` and the other Vuetify tags without imports.
- Of the places in the window only `anchorSelector('dailyPlan')` is a stable
  injection target; any other selector depends on the app's markup.
- Dependencies come from the registry only: no `file:`, `link:`, `workspace:`
  ranges and no `postinstall`, `prepare` or other lifecycle scripts, or
  `pnpm check` and the catalog reject the extension. `zod` goes into
  `dependencies` of an extension that has an RPC contract; `vue`, `vuetify`,
  `react` and the tooling go into `devDependencies`.
- A hook (`s.before`) can cancel or rewrite an engine operation: an error, an
  invalid answer or 30 s makes the whole operation fail. Keep hooks small and
  return the request unchanged when there is nothing to do. The engine
  (`s.engine`, `useEngine()`) can write to the learner's log: record only what
  the learner really did. Do not call `s.engine` with `await` at the top level
  of `server()`: use it in handlers.
- `s.storage` takes JSON only: declare its types with `type`, not `interface`.
- Before publishing replace `your-github-login` in `author` with the GitHub
  login of the publisher.
- No `eval`, no `new Function`, no minified or obfuscated sources: `pnpm lint`
  and the catalog review flag them.
- Keep tests next to the behavior: `createTestServer` from
  `@dolphy-app/extension-sdk/testing` runs commands, events, hooks, RPC
  (`running.rpc`), schedules, exercise types, importers and exporters on
  in-memory fakes; `createTestClient` records what `client` adds; mount a Vue
  component with `createApp` from `vue` in `happy-dom` (`app.provide` the keys
  the component reads, stub the Vuetify tags), a `Mountable` with
  `mountForTest`.
- Public texts (README, comments, descriptions) are in English; format with
  Prettier before you finish.

## Guide

Start with `extensions/<id>/node_modules/@dolphy-app/extension-sdk/docs/quick-start.md`;
the recipes next to it show a task type, a theme, a command with a panel,
events with storage, hooks, RPC and the window API, and React.
