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

## Message design

- Nexo Mono: Nexo's amber (`NEXO_AMBER`) is the only color, on Discord's own grays. Every card
  has the amber edge; nothing gets its own color, and no emoji colors a message.
- Every card is a Components V2 container (`MessageFlags.IsComponentsV2`), built in
  `src/card.ts`: a heading, then the facts as a small gray uppercase label above each value
  (`facts`), then subtext (`-#`) for what matters least. No embeds: they can't hold buttons, and
  mentions in them never notify.
- Icons are Heroicons (outline) in amber, uploaded as the app's own emojis (`src/icons.ts`) and
  put in front of a heading with `icon()`. No Unicode emoji in what Nexo writes.
- A picture Nexo draws (`src/images.ts`, rendered with resvg in the Geist font from
  `assets/fonts`) shows data, never decoration: the member's picture, names, numbers. It holds no
  words, so it suits every language, and the text below doesn't repeat what it shows.
- Something Nexo can do right away is a button on the message (`customId` = `command:what`,
  handled by the command's `button`). A link is a link button, never a markdown link. A hint to a
  command that needs input is a clickable command mention (`commandMention`), never `/command` in
  code format.
- Each piece of information appears once per message: no mention above a card that mentions the
  same person, no heading that repeats the text below it, no footer that repeats a line of a list,
  no timestamp Discord shows anyway.
- Discord shows text only left-aligned; structure comes from headings, labels, dividers and a
  picture beside the text.
- Mentions never notify unless the message is meant to (the client's `allowedMentions` is
  `{ parse: [] }`); a message that should notify names exactly whom.

## Where things go

- Entry point: `src/main.ts`; settings: `src/config.ts`
- Commands: one file each in `src/commands/`, listed in `src/commands/index.ts`
- Answer cards: `src/card.ts`; texts: `src/texts.ts` and `src/translations/`
- Each server's settings: `src/settings.ts` (SQLite); welcome and goodbye: `src/greeting.ts`;
  automatic roles: `src/autorole.ts`; moderation checks: `src/moderation.ts`; mod log:
  `src/modlog.ts`; posting in a server's channel: `src/channel.ts`; level math:
  `src/leveling.ts`; icons: `src/icons.ts`; Nexo's drawn pictures: `src/images.ts`
- Tests: `tests/`; README graphics: `assets/`; fonts for Nexo's pictures: `assets/fonts/`
  (Geist, SIL Open Font License in `OFL.txt`)

## Before every commit

Run `pnpm check`, `pnpm test` and `check-pipeline`, and add a line to `CHANGELOG.md` for anything
a member or a server admin notices.

## Git

- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:` …).
- A release is a tag `vX.Y.Z` that matches `CHANGELOG.md` and `package.json`.
