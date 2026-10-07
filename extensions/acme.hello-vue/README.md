# acme.hello-vue

The smallest extension with a user interface, drawn with Vue single-file
components (`.vue`). It shows the three ways an extension can talk to the
learner:

- **Palette commands** (Ctrl/⌘+K): "Say hello" shows a notification, "Open the
  hello panel" opens the panel with properties.
- **A panel**: a page of the extension in the sidebar. It asks the extension's
  server part for its data through a hidden command (`palette: false`).
- **A card in "Today's plan"**: a Vue component the app draws at the
  `dailyPlan` anchor. A button on the card opens the panel through `useApp()`.

The extension needs no permissions and no dependencies at run time: `vue` and
`vuetify` belong to the app, the bundle is a few KiB.

## Files

- `extension.json` — identity and catalog metadata. Replace
  `your-github-login` in `author` with your GitHub login before publishing.
- `src/server.ts` — `server` (`defineServer`): the three commands. Runs in the
  extension host and is built into `main.mjs`.
- `src/client.ts` — `client` (`defineClient`): `addPanel` and `addInjection`
  with `anchorSelector('dailyPlan')`, the only injection target the app keeps
  stable. Built into `client.mjs`.
- `src/StatusPanel.vue` — the panel: `<script setup>`, `<v-btn>` (Vuetify tags
  need no import) and `<style scoped>` (a plain `<style>` would reach the whole
  window).
- `src/PlanCard.vue` — the card in the daily plan: `<v-card>` and `useApp()`.
- `src/env.d.ts` — tells `tsc` the type of a `.vue` import.
- `vitest.config.ts` — `@vitejs/plugin-vue`, so tests can import `.vue`.
- `test/index.test.ts` — commands with `createTestServer`, registrations with
  `createTestClient`, components mounted with `createApp` in `happy-dom`
  (Vuetify tags are replaced by plain elements: the test has no Vuetify).

## Commands

Run them from the repository root with `pnpm --filter ./extensions/acme.hello-vue
<script>`, or from this folder:

```sh
pnpm build      # dist-ext/acme.hello-vue
pnpm test
pnpm typecheck  # tsc; it does not look inside .vue files
pnpm validate   # parses the built manifest the way the app does
pnpm lint       # the checks the catalog review also runs
pnpm dev        # rebuilds on every change and starts the installed app
```
