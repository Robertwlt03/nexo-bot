# nexo-bot: working notes for Claude

## Toolchain

- Node.js 26, which runs the TypeScript in `src/` directly (type stripping): imports name the
  `.ts` file, and only syntax that can be erased is allowed (`erasableSyntaxOnly`).
- discord.js 14, pnpm, Biome for format and lint, Vitest for tests.
- Lines at most 100 characters (`.editorconfig`, `biome.json`).

## Commands

- Run the bot: `pnpm dev` (restarts on changes) or `pnpm start`; settings in `.env`
- All checks: `pnpm check` (Biome and TypeScript) and `pnpm test` (Vitest)
- Fix formatting: `pnpm format`
- Repository checks, as CI runs them: `check-pipeline` (check-pipeline.toml)

## Hard rules

- English everywhere in code and docs. What members see is in `src/texts.ts` (English) and
  `src/translations/de.ts` (German); a command shows them through `texts(interaction.locale)`.
- Every command has an English description and a German one (`setDescriptionLocalizations`).
- One small step at a time: each command is tried on Robert's test server before the next one.
- No privileged intents unless a feature needs one, and then say which and why. Today: Server
  Members (`GuildMembers`), for welcome, goodbye and automatic roles; it is turned on in the
  Developer Portal.
- Read the docs of the versions in use (the installed typings first) before using an API; avoid
  what they mark deprecated, such as `ephemeral: true` (use `flags: MessageFlags.Ephemeral`).
- Never commit `.env` or a token.
- Discord checks only that someone has a permission, never the role order. So whenever Nexo acts
  on Discord for someone, it checks that the target (a member or a role) ranks below that
  person, as Discord's own settings would: `moderationProblem` for moderation, `autoroleProblem`
  for automatic roles. Otherwise anyone could use Nexo to reach above their own rank.

## Where things go

- Entry point: `src/main.ts`; settings: `src/config.ts`
- Commands: one file each in `src/commands/`, listed in `src/commands/index.ts`
- Answer cards: `src/card.ts`; texts: `src/texts.ts` and `src/translations/`
- Each server's settings: `src/settings.ts` (SQLite); welcome and goodbye: `src/greeting.ts`;
  automatic roles: `src/autorole.ts`; moderation checks: `src/moderation.ts`
- Tests: `tests/`; README graphics: `assets/`

## Before every commit

Run `pnpm check`, `pnpm test` and `check-pipeline`, and add a line to `CHANGELOG.md` for anything
a member or a server admin notices.

## Git

- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:` …).
- A release is a tag `vX.Y.Z` that matches `CHANGELOG.md` and `package.json`.
