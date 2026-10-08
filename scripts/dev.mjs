#!/usr/bin/env node
/**
 * Cross-platform task runner (works the same in PowerShell, cmd, Git Bash,
 * macOS and Linux). The Makefile, the `make` shim and the root npm scripts
 * all delegate here, so this file is the single source of truth.
 *
 *   node scripts/dev.mjs <task>      (or `make <task>` / `npm run <task>`)
 */
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const color = (code) => (text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const cyan = color(36);
const magenta = color(35);
const dim = color(2);
const red = color(31);

/** Runs a command, streaming output. Resolves with its exit code. */
function run(command, args = [], { cwd = ROOT, prefix, env } = {}) {
  return new Promise((resolve) => {
    // npm/npx are .cmd shims on Windows and need a shell to launch.
    const child = spawn(command, args, {
      cwd,
      shell: isWindows,
      stdio: prefix ? ['inherit', 'pipe', 'pipe'] : 'inherit',
      env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? '1', ...env },
    });
    if (prefix) {
      for (const stream of [child.stdout, child.stderr]) {
        let buffer = '';
        stream.on('data', (chunk) => {
          buffer += chunk;
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop();
          for (const line of lines) process.stdout.write(`${prefix} ${line}\n`);
        });
      }
    }
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    child.on('error', (error) => {
      console.error(red(`Could not start "${command}": ${error.message}`));
      resolve(127);
    });
    run.children.add(child);
    child.on('exit', () => run.children.delete(child));
  });
}
run.children = new Set();

/** Runs steps in order, stopping at the first failure. */
async function series(...steps) {
  for (const step of steps) {
    const code = await step();
    if (code) return code;
  }
  return 0;
}

const npm = (dir, ...args) => () => run('npm', ['--prefix', dir, ...args]);
const compose = (...args) => () => run('docker', ['compose', ...args]);

function copyIfMissing(from, to) {
  if (existsSync(path.join(ROOT, to))) {
    console.log(dim(`${to} exists — left unchanged`));
  } else {
    copyFileSync(path.join(ROOT, from), path.join(ROOT, to));
    console.log(`created ${to}${to.startsWith('backend') ? ' — set JWT_SECRET' : ''}`);
  }
  return 0;
}

/**
 * Stops a child and everything it started. On Windows, child.kill() would
 * only end the cmd.exe wrapper and orphan the real server on its port.
 */
function killTree(child) {
  if (child.exitCode !== null) return;
  if (isWindows) {
    // Synchronous: the runner may exit right after this returns.
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

/** API and web app side by side; Ctrl+C (or either one exiting) stops both. */
async function devServers() {
  const stopAll = () => {
    for (const child of run.children) killTree(child);
  };
  process.on('SIGINT', stopAll);
  const code = await Promise.race([
    run('npm', ['--prefix', 'backend', 'run', 'dev'], { prefix: cyan('[api]') }),
    run('npm', ['--prefix', 'frontend', 'run', 'dev'], { prefix: magenta('[web]') }),
  ]);
  stopAll();
  return code;
}

const TASKS = {
  // Setup
  setup: ['Install backend and frontend dependencies', () => series(npm('backend', 'install'), npm('frontend', 'install'))],
  env: [
    'Create .env files from the examples (never overwrites)',
    () => series(
      () => copyIfMissing('backend/.env.example', 'backend/.env'),
      () => copyIfMissing('frontend/.env.example', 'frontend/.env')
    ),
  ],
  // Database
  'db-up': ['Start the local MongoDB (Docker) and wait until healthy', compose('up', '-d', '--wait')],
  'db-down': ['Stop the local MongoDB (keeps data)', compose('down')],
  'db-reset': [
    'Wipe the local MongoDB and re-seed demo data',
    () => series(compose('down', '-v'), compose('up', '-d', '--wait'), npm('backend', 'run', 'seed')),
  ],
  'db-logs': ['Tail MongoDB logs', compose('logs', '-f', 'mongo')],
  'db-shell': ['Open mongosh on the dev database', compose('exec', 'mongo', 'mongosh', 'smartbudget_dev')],
  seed: ['Add the demo account (demo@smartbudget.dev / demo1234)', npm('backend', 'run', 'seed')],
  // Run
  dev: ['Start DB, API (:5000) and web app (:3000) together', () => series(compose('up', '-d', '--wait'), devServers)],
  'dev-api': ['API with auto-reload, using backend/.env', npm('backend', 'run', 'dev')],
  'dev-web': ['Vite dev server on :3000', npm('frontend', 'run', 'dev')],
  'dev-memory': ['API on a throwaway in-memory DB with demo data (no Docker)', npm('backend', 'run', 'dev:memory')],
  // Quality
  test: ['Run all tests', () => series(npm('backend', 'test'), npm('frontend', 'test'))],
  'test-api': ['Backend tests (in-memory MongoDB)', npm('backend', 'test')],
  'test-web': ['Frontend tests', npm('frontend', 'test')],
  lint: ['Lint both apps', () => series(npm('backend', 'run', 'lint'), npm('frontend', 'run', 'lint'))],
  format: ['Format both apps with Prettier', () => series(npm('backend', 'run', 'format'), npm('frontend', 'run', 'format'))],
  audit: [
    'Check production dependencies for known vulnerabilities',
    () => series(npm('backend', 'audit', '--omit=dev'), npm('frontend', 'audit', '--omit=dev')),
  ],
  // Build
  build: ['Production build of the web app (frontend/build)', npm('frontend', 'run', 'build')],
  preview: [
    'Production build served on :3000, talking to the LOCAL API',
    () =>
      series(
        // An empty VITE_API_URL overrides .env.production, so a local preview
        // never calls the production API (it uses the /api proxy instead).
        () => run('npm', ['--prefix', 'frontend', 'run', 'build'], { env: { VITE_API_URL: '' } }),
        npm('frontend', 'run', 'preview')
      ),
  ],
  clean: [
    'Remove build output and dependencies',
    () => {
      for (const dir of ['frontend/build', 'frontend/node_modules', 'backend/node_modules']) {
        rmSync(path.join(ROOT, dir), { recursive: true, force: true });
        console.log(dim(`removed ${dir}`));
      }
      return 0;
    },
  ],
};

function help() {
  console.log('Usage: make <task>   (or: node scripts/dev.mjs <task>)\n');
  const width = Math.max(...Object.keys(TASKS).map((name) => name.length)) + 2;
  for (const [name, [description]] of Object.entries(TASKS)) {
    console.log(`  ${cyan(name.padEnd(width))}${description}`);
  }
  return 0;
}

const task = process.argv[2] ?? 'help';
if (task === 'help' || task === '--help' || task === '-h') {
  process.exit(help());
}
if (!TASKS[task]) {
  console.error(red(`Unknown task "${task}".\n`));
  help();
  process.exit(1);
}
process.exit(await TASKS[task][1]());
