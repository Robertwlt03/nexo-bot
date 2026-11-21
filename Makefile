# Short commands for Nexo; `make` alone lists them. Most run the pnpm script of the same name.
# `start` runs Node without pnpm, which would cost a second process of about 18 MB on a server.

.PHONY: help setup dev build start check test format verify

help: ## List the commands
	@grep -E '^[a-z-]+:.*## ' Makefile | awk -F ':.*## ' '{ printf "  make %-7s %s\n", $$1, $$2 }'

setup: ## Install the dependencies
	pnpm install

dev: ## Run the bot, restarting on changes
	pnpm dev

build: ## Turn the TypeScript into the JavaScript a server runs
	pnpm build

# --max-semi-space-size=1 keeps V8's young heap small; --max-old-space-size=64 caps the rest, which
# Nexo uses about 24 MB of. A feature that needs more raises it, or Node stops "out of memory".
# --expose-gc lets Nexo hand back a picture's memory right after drawing it (src/images.ts).
start: ## Run the built bot on a server, in about 55 MB
	node --env-file-if-exists=.env --max-semi-space-size=1 --max-old-space-size=64 --expose-gc \
		dist/main.js

check: ## Format, lint and types (Biome, TypeScript)
	pnpm check

test: ## Run the tests (Vitest)
	pnpm test

format: ## Fix what Biome can
	pnpm format

verify: check test build ## Everything CI runs on the code, before a push
