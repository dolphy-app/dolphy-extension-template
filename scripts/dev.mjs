#!/usr/bin/env node
// `pnpm dev <id> [--app <path>]`: runs `dolphy-ext dev` in `extensions/<id>`,
// which rebuilds the extension on every change and starts the installed
// Dolphy app with `DOLPHY_DEV_EXTENSIONS` pointing at its `dist-ext`.
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionsDir = path.join(root, 'extensions');

const ids = readdirSync(extensionsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const [id, ...rest] = process.argv.slice(2);
if (id === undefined || !ids.includes(id)) {
  const problem =
    id === undefined ? 'no extension given' : `no extension '${id}'`;
  process.stderr.write(
    `${problem}\nusage: pnpm dev <id> [--app <path>]\nextensions: ${ids.join(', ')}\n`,
  );
  process.exit(2);
}

// run in the folder of the extension, so the id never has to match a package
// name and a failure is not wrapped in the report of a recursive run
const child = spawn(
  'pnpm',
  ['--dir', `extensions/${id}`, 'run', 'dev', ...rest],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
);
child.on('error', (error) => {
  process.stderr.write(`cannot run pnpm: ${error.message}\n`);
  process.exit(1);
});
// Ctrl+C reaches the whole foreground process group: the child stops its build
// and the app by itself, and this script waits for it. A SIGTERM goes to this
// script only, so it is forwarded.
process.on('SIGINT', () => {});
process.on('SIGTERM', () => child.kill('SIGTERM'));
child.on('exit', (code) => {
  process.exit(code ?? 1);
});
