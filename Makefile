# SmartBudget development commands — run `make` to list them.
#
# Every target delegates to scripts/dev.mjs (Node), so recipes don't depend
# on bash/sh vs cmd.exe and behave identically on Windows, macOS and Linux.
# No GNU make? `node scripts/dev.mjs <task>` or the `make` shim
# (see scripts/make-shim/README.md) do exactly the same thing.

TASKS := help setup env db-up db-down db-reset db-logs db-shell seed \
         dev dev-api dev-web dev-memory test test-api test-web lint format \
         audit build preview clean

.DEFAULT_GOAL := help
.PHONY: $(TASKS)

$(TASKS):
	@node scripts/dev.mjs $@
