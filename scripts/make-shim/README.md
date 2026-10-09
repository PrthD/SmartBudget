# `make` shim

GNU make isn't available on many Windows setups. This tiny package adds a `make`
command (for PowerShell, cmd and Git Bash) that runs this repo's tasks via Node:

```bash
npm run make:install     # once, from the repo root
make dev                 # works in any shell now
```

Inside this repo it runs `scripts/dev.mjs <task>`. In other directories it passes
through to a real GNU make (`mingw32-make` or `gmake`) if one is installed.

Remove it with `npm uninstall -g smartbudget-make-shim`.
