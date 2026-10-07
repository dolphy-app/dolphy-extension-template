# acme.night-theme

A color theme for Dolphy: a deep blue background with a soft blue accent. A
theme is data only: the extension has no server part and no components, and
the build writes `extension.json` and `client.mjs` (a few hundred bytes).

After installing, the theme appears as a tile in Settings → Appearance next to
System, Light and Dark.

## Files

- `extension.json` — identity and catalog metadata (`"tags": ["theme"]`).
  Replace `your-github-login` in `author` with your GitHub login before
  publishing.
- `src/theme.ts` — the `ThemeRegistration`: `id` (the extension id), `label`,
  `dark`, `colors` and `variables`. The allowed keys are `THEME_COLOR_KEYS` and
  `THEME_VARIABLE_KEYS` of `@dolphy-app/extension-sdk`; colors are `#rrggbb` or
  `#rrggbbaa`.
- `src/index.ts` — `client.addTheme(night)`.
- `test/theme.test.ts` — the client adds the theme; every text color has a WCAG
  contrast of at least 4.5:1 on its background; a dark theme has a dark
  background. Keep the test when you change the colors.

## Make it yours

1. Pick a new id and rename the folder to it (the catalog requires the folder
   name to equal the id), then update the id in `extension.json`,
   `package.json`, `src/theme.ts` and the `validate` script (the theme `id` is
   the extension id or starts with it and a dot; `system`, `light` and `dark`
   are taken).
2. Change `label`, the colors, `name` and `description`.
3. Run `pnpm test`: a pair of colors below the contrast limit fails it.

## Commands

Run them from the repository root with
`pnpm --filter ./extensions/acme.night-theme <script>`, or from this folder:

```sh
pnpm build      # dist-ext/acme.night-theme
pnpm test
pnpm typecheck  # tsc
pnpm validate   # parses the built manifest the way the app does
pnpm lint       # the checks the catalog review also runs
pnpm dev        # rebuilds on every change and starts the installed app
```
