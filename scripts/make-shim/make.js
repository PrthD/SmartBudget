#!/usr/bin/env node
/**
 * `make` for machines without GNU make on PATH (e.g. Windows).
 *
 * - Inside a project that has scripts/dev.mjs next to its Makefile (this
 *   repo), runs those tasks directly: `make dev`, `make db-up seed`, …
 * - Anywhere else, passes through to a real GNU make if one exists
 *   (mingw32-make, gmake), so other projects keep working.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function findProjectRoot(dir) {
  for (let current = dir; ; current = path.dirname(current)) {
    if (
      existsSync(path.join(current, 'Makefile')) &&
      existsSync(path.join(current, 'scripts', 'dev.mjs'))
    ) {
      return current;
    }
    if (path.dirname(current) === current) return null;
  }
}

const root = findProjectRoot(process.cwd());
if (root) {
  const tasks = args.filter((arg) => !arg.startsWith('-'));
  for (const task of tasks.length ? tasks : ['help']) {
    const { status } = spawnSync(process.execPath, [path.join(root, 'scripts', 'dev.mjs'), task], {
      stdio: 'inherit',
      cwd: root,
    });
    if (status) process.exit(status);
  }
  process.exit(0);
}

for (const candidate of ['mingw32-make', 'gmake']) {
  const result = spawnSync(candidate, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  // 9009 / 127: "command not found" on cmd.exe / POSIX shells.
  if (!result.error && result.status !== 9009 && result.status !== 127) {
    process.exit(result.status ?? 1);
  }
}
console.error('make: no GNU make found on PATH, and this is not a project with scripts/dev.mjs.');
process.exit(127);
