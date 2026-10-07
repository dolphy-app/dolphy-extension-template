# Dolphy extension template

A template repository for writing [Dolphy](https://github.com/dolphy-app/dolphy)
extensions. It holds two working examples in a pnpm workspace whose layout
repeats the one of the extension catalog
([`dolphy-app/dolphy-extensions`](https://github.com/dolphy-app/dolphy-extensions)):
every folder in `extensions/` can be moved into a catalog pull request as it
is.

## Use this template

Click **Use this template → Create a new repository** on GitHub, clone the new
repository and run:

```sh
pnpm install
pnpm test
```

Keep the examples you need, delete the rest, and add your own with
`pnpm create:extension` (below).

## Requirements

- Node.js 22.12 or newer (`.nvmrc` pins 22);
- [pnpm](https://pnpm.io) (`packageManager` in `package.json` names the version;
  with Corepack or a recent pnpm it is picked up by itself);
- the Dolphy app, version 0.5.0 or newer, installed: `pnpm dev` starts it. The
  tests, the build and the checks do not need the app.

## Examples

| Folder                                  | What it shows                                                                                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`hello-vue`](extensions/hello-vue)     | A Vue interface: palette commands, a panel and a card in "Today's plan", all written as single-file components (`.vue`, `<v-btn>`, `<style scoped>`).      |
| [`hello-react`](extensions/hello-react) | The same drawn with React (`"frameworks": ["react"]`, `reactComponent`), and a card that calls the server part with `useRpc` and the window with `useApp`. |

Each folder has its own README that explains the files.

## Commands

Run them in the repository root; `build`, `test`, `typecheck` and `validate`
work on every extension (`pnpm -r`).

| Command                        | What it does                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm install`                 | Installs the toolchain and the dependencies of every extension.                                                          |
| `pnpm build`                   | `dolphy-ext build` for each extension: `extensions/<id>/dist-ext/<id>/` with `extension.json`, `main.mjs`, `client.mjs`. |
| `pnpm test`                    | `vitest` for each extension (`createTestServer`, `createTestClient`, `mountForTest`, components in `happy-dom`).         |
| `pnpm typecheck`               | `tsc` for each extension. It does not look inside `.vue` files.                                                          |
| `pnpm validate`                | `dolphy-ext validate` on the built directories: the manifest is parsed the way the app does it (run after `pnpm build`). |
| `pnpm check`                   | `dolphy-ext catalog check extensions --skip-github-check`: the rules the catalog applies to a pull request (see below).  |
| `pnpm dev <id> [--app <path>]` | `dolphy-ext dev` for one extension, for example `pnpm dev hello-vue`.                                                    |
| `pnpm create:extension [<id>]` | A new extension in `extensions/<id>` (see below).                                                                        |
| `pnpm format`                  | Prettier over the whole repository.                                                                                      |

`pnpm check` prints nothing and exits with 0 when there are no findings; an
`error` line fails it. `--skip-github-check` turns off only the rule that asks
the GitHub API whether the `author` login exists: the catalog's CI runs that
check, so put your real login into `author` before you publish.

### `pnpm dev <id>`

`pnpm dev hello-vue` runs `dolphy-ext dev` in `extensions/hello-vue`.
It starts a watch build of the extension and the installed Dolphy app with
`DOLPHY_DEV_EXTENSIONS=<extension>/dist-ext`, so the app lists the extension
(origin `dev`) and applies every rebuild without a restart and without
reloading the window. Ctrl+C stops the build and the app.

- The app is looked up in this order: `--app <path>` (a macOS `.app` bundle or
  an executable), the `DOLPHY_APP` environment variable, the standard place of
  the platform (macOS `/Applications/Dolphy.app` and `~/Applications/Dolphy.app`;
  Windows `%LOCALAPPDATA%\Programs\Dolphy\Dolphy.exe`; Linux the newest
  `~/Applications/Dolphy-Linux-*.AppImage`). If none is found the command exits
  with 2 and lists the places it looked at.
- The app has a single instance. If Dolphy is already running, the second one
  quits at once and the command says "Dolphy is probably already running": quit
  the app and run the command again.
- In the app, `F12`, `Cmd+Alt+I` (macOS) and `Ctrl+Shift+I` toggle DevTools
  while a developer directory is set; your TypeScript is in "Sources".
- Load errors of an extension show up in "Settings → Extensions".

To run the pieces yourself: `pnpm --filter ./extensions/<id> watch`
(`dolphy-ext build --watch`) in one terminal, and start the app with
`DOLPHY_DEV_EXTENSIONS=<absolute path>/extensions/<id>/dist-ext` in another.

## Lockfiles

Each extension has its own `pnpm-lock.yaml` next to its `package.json`
(`sharedWorkspaceLockfile: false` in `pnpm-workspace.yaml`), so a folder is
complete on its own: the catalog checks a folder in isolation and requires a
lockfile inside it. `pnpm install` writes them; commit them with the extension.
Dependencies must come from the registry (no `file:`, `link:`, `workspace:`
ranges) and a project must not have install or publish scripts (`postinstall`,
`prepare`, …).

## Create your own extension

```sh
pnpm create:extension my-extension --template react-panel
```

The script wraps `create-dolphy-extension`: it makes `extensions/<id>` from a
template and drops the files that this repository already has at its root (CI,
`.gitignore`, `AGENTS.md`). Without `--template` it asks in a terminal. The
templates:

| Template        | What you get                                                |
| --------------- | ----------------------------------------------------------- |
| `command-panel` | palette commands and a panel (Vue single-file component)    |
| `react-panel`   | the same with the panel drawn by React                      |
| `exercise`      | a new exercise type: grading on the server, an answer field |
| `events`        | a learning-event handler with storage and a panel           |
| `theme`         | a color theme (data only)                                   |
| `blank`         | an empty project                                            |

Then `pnpm install` and `pnpm dev <id>`. Start from the example that is closest
to what you want, or copy one: rename the folder, and change the id everywhere
(`extension.json`, `package.json`, the `validate` script and the ids written in
the code, which all start with the extension id).

The guide for the API is installed with the SDK:
`extensions/<id>/node_modules/@dolphy-app/extension-sdk/docs/quick-start.md`
and the recipes next to it.

## Publish to the catalog

1. Replace `your-github-login` in `author` of `extension.json` with your GitHub
   login, give the extension a real `name`, `description` (at least 20
   characters) and `tags`, and keep a `README.md` that says what it does.
2. Run `pnpm install`, `pnpm test`, `pnpm build`, `pnpm validate` and `pnpm check`.
3. Fork [`dolphy-app/dolphy-extensions`](https://github.com/dolphy-app/dolphy-extensions)
   and copy `extensions/<id>` into `extensions/<id>` of the fork (the folder
   name must equal the `id` in `extension.json`). Copy the source files and the
   lockfile, not `node_modules` or `dist-ext`.
4. In the fork, check it: `npm install` and then
   `npx dolphy-ext catalog check extensions --ids <id> --skip-github-check`.
5. Open a pull request. The catalog's CI checks the extension and builds it, a
   maintainer reviews it. After the merge into `main` the version appears in the
   catalog. Published versions never change: to ship a fix, raise `version` and
   open a new pull request.

The catalog's PR workflow installs the dependencies of an extension with
`npm ci`, which needs a `package-lock.json`. If that step fails on a pnpm
project, run `npm install --package-lock-only` in the extension folder and
commit the file next to `pnpm-lock.yaml`.

## Limitations

- **An extension runs without restrictions.** Its code has the same access as
  the app: files, processes, network and native modules, with no permissions to
  declare. Nothing in a manifest limits it. What stands between a user and a
  harmful extension is the review of the catalog pull request and the safe mode
  of the app, not a sandbox; read the code of what you install and write code
  you would let others read.
- An extension reaches the learning engine directly (`s.engine`, `useEngine()`),
  writing included. A write goes into the same log as the learner's own, so
  record only what the learner really did.
- Of the places in the app window, only the `dailyPlan` anchor
  (`anchorSelector('dailyPlan')`) is stable. Any other injection target depends
  on the markup of the app and can stop matching after an update.
- Each extension carries its own UI runtime, except Vue and Vuetify, which the
  app provides: a React panel adds about 0.5 MB to `client.mjs`, and two
  extensions on React load two copies of React.
- Components on other frameworks cannot use Vuetify components or the overlays
  of the app (`VDialog`, `VMenu`, `VSnackbar`).
- A `<style>` in a `.vue` file goes into the whole window: write
  `<style scoped>`.
- `pnpm --filter ./extensions/<id> lint` (`dolphy-ext lint`, the checks the
  catalog review also runs) warns `CHECK-022` ("dynamic code execution") for an
  extension that bundles `zod`, which every RPC contract needs: zod runs
  `new Function('')` once to find out whether code generation is allowed. It is
  a heuristic warning, not an error; `hello-react` shows
  it.

## Layout

```
dolphy-extension-template/
  extensions/
    hello-vue/           # Vue single-file components: commands, panel, card
    hello-react/         # the same in React, plus RPC and the window API
  scripts/               # create-extension.mjs, dev.mjs
  .github/workflows/ci.yml
  package.json  pnpm-workspace.yaml  AGENTS.md
```

Inside an extension folder:

```
extension.json   # identity and metadata; contributions are registered by code
package.json  pnpm-lock.yaml  README.md  tsconfig.json
src/index.ts     # exports `server` and/or `client`
test/            # vitest
```

More: [what an extension is and how to write one](https://github.com/dolphy-app/dolphy/blob/develop/docs/design/extensions.md).
