#!/usr/bin/env node
// `pnpm create:extension [<id>] [--template <name>]`: a new extension in
// `extensions/<id>`, made by `create-dolphy-extension`. The generator writes a
// stand-alone project; the files that belong to a repository of their own
// (CI, .gitignore, agent instructions) are dropped, because this repository
// already has them at the root.
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TEMPLATES = [
  ['command-panel', 'palette commands and a panel (Vue single-file component)'],
  ['react-panel', 'palette commands and a panel drawn with React'],
  ['exercise', 'a new exercise type: grading on the server, answer field'],
  ['events', 'a learning-event handler with storage and a panel'],
  ['theme', 'a color theme (data only)'],
  ['blank', 'an empty project'],
];
const DEFAULT_TEMPLATE = 'command-panel';
/** Files of a stand-alone project that this repository keeps at its root. */
const ROOT_FILES = ['.github', '.gitignore', 'AGENTS.md', 'CLAUDE.md'];

const USAGE = `usage: pnpm create:extension [<id>] [--template <name>]

  <id>               extension id, for example my-extension; the folder is
                     extensions/<id>
  --template <name>  ${TEMPLATES.map(([name]) => name).join(', ')}
                     (asked for in a terminal when missing)
`;

const fail = (message, code = 2) => {
  process.stderr.write(`${message}\n`);
  process.exit(code);
};

const parseArgs = (argv) => {
  let id;
  let template;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      process.stdout.write(USAGE);
      process.exit(0);
    } else if (arg === '--template' || arg === '-t') {
      template = argv[++i];
      if (template === undefined) fail(`${arg} requires a value\n${USAGE}`);
    } else if (arg.startsWith('-')) {
      fail(`unknown flag: ${arg}\n${USAGE}`);
    } else if (id === undefined) {
      id = arg;
    } else {
      fail(`unexpected argument: ${arg}\n${USAGE}`);
    }
  }
  return { id, template };
};

const ask = async (question) => {
  const lines = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    return (await lines.question(question)).trim();
  } finally {
    lines.close();
  }
};

const chooseTemplate = async () => {
  const menu = TEMPLATES.map(
    ([name, summary], index) => `  ${index + 1}. ${name} - ${summary}`,
  ).join('\n');
  const answer = await ask(
    `Template:\n${menu}\nNumber or name [${DEFAULT_TEMPLATE}]: `,
  );
  if (answer === '') return DEFAULT_TEMPLATE;
  const byNumber = TEMPLATES[Number(answer) - 1];
  return byNumber === undefined ? answer : byNumber[0];
};

let { id, template } = parseArgs(process.argv.slice(2));
const interactive = process.stdin.isTTY === true;
if (id === undefined) {
  if (!interactive) fail(`no extension id given\n${USAGE}`);
  id = await ask('Extension id (for example my-extension): ');
  if (id === '') fail(`no extension id given\n${USAGE}`);
}
if (template === undefined) {
  template = interactive ? await chooseTemplate() : DEFAULT_TEMPLATE;
}

const target = path.join('extensions', id);
const result = spawnSync(
  'pnpm',
  [
    'exec',
    'create-dolphy-extension',
    target,
    '--id',
    id,
    '--template',
    template,
  ],
  {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  },
);
if (result.error !== undefined) {
  fail(`cannot run pnpm: ${result.error.message}`, 1);
}
if (result.status !== 0) {
  // the generator explains itself (bad id, unknown template, folder not empty)
  fail(result.stderr.trim() || result.stdout.trim(), result.status ?? 1);
}

const dir = path.join(root, target);
for (const name of ROOT_FILES) {
  rmSync(path.join(dir, name), { recursive: true, force: true });
}

// `pnpm dev <id>` starts the app, so the `dev` script of an extension is
// `dolphy-ext dev`; the plain watch build the generator calls `dev` is `watch`
const packageFile = path.join(dir, 'package.json');
const manifest = JSON.parse(readFileSync(packageFile, 'utf8'));
manifest.scripts = {
  ...manifest.scripts,
  dev: 'dolphy-ext dev',
  watch: 'dolphy-ext build --watch',
};
writeFileSync(packageFile, `${JSON.stringify(manifest, null, 2)}\n`);

// the generated README describes a stand-alone project: keep what the project
// is and replace how it is run
const readmeFile = path.join(dir, 'README.md');
const [head = ''] = readFileSync(readmeFile, 'utf8').split(
  '## Development loop',
);
writeFileSync(
  readmeFile,
  `${head}## Development loop

From the root of the repository:

\`\`\`sh
pnpm install
pnpm dev ${id} # rebuilds on every change and starts the installed Dolphy app
\`\`\`

A change is applied live: the window does not reload, the components on screen
are redrawn. Quit a running Dolphy first: the app has a single instance. Load
errors are shown in "Settings → Extensions".

## Build, check, test

\`\`\`sh
pnpm --filter ./${target} build      # dist-ext/${id}
pnpm --filter ./${target} validate   # the same manifest parsing the app does
pnpm --filter ./${target} lint       # checks before a catalog pull request
pnpm --filter ./${target} typecheck  # tsc
pnpm --filter ./${target} test
\`\`\`
`,
);

process.stdout.write(`created ${id} in ${target} (template ${template})

Next steps:
  pnpm install   # also writes ${target}/pnpm-lock.yaml
  pnpm --filter ./${target} test
  pnpm dev ${id}   # rebuilds on every change and starts the app

Before publishing replace "your-github-login" in ${target}/extension.json.
`);
