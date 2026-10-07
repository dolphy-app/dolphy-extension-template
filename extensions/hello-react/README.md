# hello-react

The same extension as `hello-vue`, with its interface drawn by React
instead of Vue: palette commands, a panel and a card in "Today's plan". The
card also calls the extension's server part through a typed RPC contract.

- **Palette commands** (Ctrl/⌘+K): "Say hello" shows a notification, "Open the
  hello panel" opens the panel with properties.
- **A panel**: a page of the extension in the sidebar. It asks the server part
  for its data through a hidden command (`usePanel().call`).
- **A card in "Today's plan"**: a React component the app draws at the
  `dailyPlan` anchor. Its button calls `useRpc(greet)`; the answer is shown on
  the card and announced with `useApp().notify`.

React is a dependency of this extension, not of the app: `react` and
`react-dom` go into `client.mjs` (about 0.7 MB unminified). The app shares only
Vue and Vuetify, so there are no Vuetify components and no app overlays in a
React component; the window colors reach it as CSS variables such as
`rgb(var(--v-theme-on-surface))`.

## Files

- `extension.json` — identity and catalog metadata. Replace
  `your-github-login` in `author` with your GitHub login before publishing.
- `dolphy-ext.config.json` — `"frameworks": ["react"]` turns the React build on
  (`.tsx` files, automatic JSX runtime).
- `src/shared/rpc.ts` — the `greet` contract (`defineRpc` with `zod` schemas),
  imported by both parts. Both sides validate with it.
- `src/server.ts` — `server` (`defineServer`): the commands and
  `s.handle(greet, …)`. Runs in the extension host, built into `main.mjs`.
- `src/client.tsx` — `client` (`defineClient`): `addPanel` and `addInjection`;
  `reactComponent` turns a React component into the `Mountable` the app draws.
- `src/HelloPanel.tsx` — the panel (`usePanel`).
- `src/PlanCard.tsx` — the card (`useApp`, `useRpc`).
- `test/index.test.ts` — commands and the contract with `createTestServer`,
  registrations with `createTestClient`, components with `mountForTest`.

`tsconfig.json` has `"jsx": "react-jsx"`. A `.tsx` file with JSX and no
`"react"` in `frameworks` fails the build.

## Commands

Run them from the repository root with
`pnpm --filter ./extensions/hello-react <script>`, or from this folder:

```sh
pnpm build      # dist-ext/hello-react
pnpm test
pnpm typecheck  # tsc
pnpm validate   # parses the built manifest the way the app does
pnpm lint       # the checks the catalog review also runs
pnpm dev        # rebuilds on every change and starts the installed app
```
