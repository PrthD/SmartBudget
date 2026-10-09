/**
 * Installs the `make` shim globally.
 *
 * On Windows, npm also generates a make.ps1 launcher, which PowerShell
 * prefers over make.cmd but refuses to run under the default "Restricted"
 * execution policy. Removing it makes PowerShell fall back to make.cmd,
 * which isn't subject to that policy — no security settings change needed.
 */
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const shimDir = path.dirname(fileURLToPath(import.meta.url));
execSync(`npm install -g "${shimDir}"`, { stdio: 'inherit' });

if (process.platform === 'win32') {
  const prefix = execSync('npm prefix -g').toString().trim();
  const ps1 = path.join(prefix, 'make.ps1');
  if (existsSync(ps1)) {
    rmSync(ps1);
    console.log('Removed make.ps1 so PowerShell uses make.cmd (works with any execution policy).');
  }
}
console.log('`make` is ready. Open a new terminal if it is not found yet.');
