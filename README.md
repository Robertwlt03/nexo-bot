<p align="center">
  <img src="assets/banner-readme.svg" alt="Nexo: The quiet community bot." width="100%">
</p>

Nexo is the quiet community bot: levels with free role rewards, a mod log that also shows what
moderators do in Discord itself, welcomes, tickets and moderation, answering each member in the
language of their Discord (German or English). It never reads your messages. It is being rebuilt
from scratch, one feature at a time: each command is tried on a real server before the next one
lands.

## <img src="assets/icons/features.svg" height="33" align="absmiddle" alt="">What it does

| Command        | What it does                                                                  |
|----------------|-------------------------------------------------------------------------------|
| `/info`        | Shows what Nexo is, its connection to Discord and how long it is online       |
| `/serverinfo`  | Shows the server: owner, members, channels, roles, boosts and its age         |
| `/userinfo`    | Shows a member, or you: account age, joining date and roles                   |
| `/avatar`      | Shows a member's profile picture, or yours, in full size                      |
| `/welcome`     | Greets new members in a channel: `setup`, `test`, `off`; for admins           |
| `/goodbye`     | Says goodbye in a channel when someone leaves: `setup`, `test`, `off`         |
| `/autorole`    | Gives new members roles: `add`, `remove`, `list`; for admins                  |
| `/warn`        | Warns a member by direct message with a reason; Nexo keeps the warning        |
| `/warnings`    | Shows a member's warnings, each with a button that removes it                 |
| `/timeout`     | Times a member out for 5 minutes up to a week; `/untimeout` ends it           |
| `/kick`        | Removes a member from the server; they can join again                         |
| `/ban`         | Bans someone, also before they join; `/unban` lifts it                        |
| `/modlog`      | Logs moderation, Nexo's and Discord's own: `setup`, `off`; for admins         |
| `/ticket`      | Posts a button that opens a private ticket thread with the team; for admins   |
| `/rank`        | Shows a member's level, rank and XP, or yours                                 |
| `/leaderboard` | Shows the ten members with the most XP, and privately your own place          |
| `/levels`      | Sets where level-ups appear, or turns them off: `setup`, `off`, `reset`       |
| `/levelrole`   | Gives members roles when they reach a level: `add`, `remove`, `list`          |
| `/help`        | Lists, privately, the commands you can use                                    |

## <img src="assets/icons/install.svg" height="33" align="absmiddle" alt="">Install

You need [Node.js 26](https://nodejs.org) and [pnpm](https://pnpm.io).

1. **Create the bot.** In the
   [Discord Developer Portal](https://discord.com/developers/applications), choose
   _New Application_ and name it, such as _Nexo Test_. Under _Bot_, choose _Reset Token_ and copy
   the token. A new application is best: one an older bot used still lists that bot's commands,
   which Nexo then answers with "Nexo doesn't have this command (anymore)". On the same page, under
   _Privileged Gateway Intents_, turn on _Server Members Intent_: the welcome needs to know when
   someone joins. Without it, the bot stops at its start with "Used disallowed intents".
2. **Fill in the settings.** Copy `.env.example` to `.env` and paste the token after
   `DISCORD_TOKEN=`. For a test server, turn on _Developer Mode_ in Discord's settings under
   _Advanced_, right-click your server, choose _Copy Server ID_ and paste it after `GUILD_ID=`.
3. **Invite it.** Under _OAuth2_, open the _URL Generator_, tick the scopes `bot` and
   `applications.commands` and the permissions _Send Messages_, _Embed Links_, _Attach Files_ (for
   the welcome and goodbye pictures), _Manage Roles_ (for automatic roles), _Timeout Members_,
   _Kick Members_ and _Ban Members_ (for moderation), _View Audit Log_ (for the mod log), and
   _Create Private Threads_, _Send Messages in Threads_, _Manage Threads and Posts_ and _Read
   Message History_ (for tickets; with a team role that isn't mentionable also _Mention @everyone,
   @here, and All Roles_), open the URL and pick your server. Nexo can only give roles
   below its own highest role: in the server settings under _Roles_, drag Nexo's role above them.
4. **Start it.**

   ```bash
   pnpm install
   pnpm dev
   ```

   The console shows `Nexo#1234 is online with 21 commands`. `pnpm dev` restarts the bot whenever
   a file changes; `pnpm start` runs it once.

## <img src="assets/icons/use.svg" height="33" align="absmiddle" alt="">Use

Type `/` in any channel of your server and pick one of Nexo's commands. With `GUILD_ID` set, the
commands appear on that server at once. Without it, they are registered for every server the bot
is in, which can take Discord a moment.

## <img src="assets/icons/how.svg" height="33" align="absmiddle" alt="">How it works

- Node.js 26 runs the TypeScript in `src/` directly, so there is no build step.
- `src/commands/index.ts` lists every command. When the bot starts, it registers that list with
  Discord and answers each slash command with the matching one.
- `src/texts.ts` holds every text in English; `src/translations/de.ts` holds the German ones.
  Each answer picks the language of the member's Discord. The commands themselves are English
  for everyone (`commandTexts`), so the command list never mixes languages.
- The bot asks Discord for the server list (`Guilds`) and, for welcome, goodbye and automatic
  roles, for members joining and leaving (`GuildMembers`, the privileged _Server Members Intent_).
  For the mod log it gets new audit log entries (`GuildModeration`), so kicks, bans and timeouts
  made in Discord itself are logged too; its own are logged by its commands.
- Every card is built in `src/card.ts` with Discord's newer components, in one design that matches
  Nexo's wooden logo and banner: Nexo's amber is the one accent, icons are
  [Heroicons](https://heroicons.com) uploaded as the app's own emojis (`src/icons.ts`), and facts
  show as small gray labels above their values. What Nexo can do right away is a button on the card,
  and a hint to a command is a mention that puts the command into the message box. Mentions only
  notify where a message is meant to: the welcome with `ping` on, and the team in a new ticket.
- The welcome, the goodbye and `/rank` show a picture Nexo draws of the member
  (`src/images.ts`): an SVG rendered to PNG by [resvg](https://github.com/thx/resvg-js) in the
  [Geist](https://vercel.com/font) font, with [Noto Sans](https://notofonts.github.io) for the
  letters Geist lacks; `assets/fonts/` holds both under the SIL Open Font License. The pictures
  sit on walnut with fireflies (`assets/wood/`, Unsplash License). It shows
  names, numbers and their units only, so it suits every language; emoji are left out of names.
- `/welcome` and `/goodbye` are one command built twice (`src/commands/greeting.ts`); both post
  the same card (`src/greeting.ts`).
- Members earn 15 to 25 XP for a message, at most every 20 seconds; level _L_ needs
  5·_L_² + 50·_L_ + 50 more XP (`src/leveling.ts`). Nexo only learns that someone wrote
  (`GuildMessages`), never what: it does without the privileged _Message Content Intent_.
  Private threads, such as tickets, earn no XP. XP stays when someone leaves, so a member who comes
  back keeps their level; `/levels reset` takes someone off the leaderboard. A level-up card
  appears for every level up to 10, then every fifth, and for every level that gives a role
  (`src/levelup.ts`).
- Moderation tells the member by direct message what happened and why, in the moderator's
  language, without the moderator's name; a kick or ban tells them first, while they still share
  the server with Nexo.
- Every moderation command posts a card in the mod log, if the server has one (`src/modlog.ts`):
  what, whom (with the ID, which still reads after they left), by whom and why, in the language
  of whoever set up the mod log. Nexo answers the moderator first and posts the card after, so a
  slow channel never makes the command fail. Kicks, bans and timeouts made in Discord itself come
  from the audit log into the same log.
- Moderation checks the role order itself (`src/moderation.ts`): Discord only checks that a
  moderator has the permission, so without it someone could act through Nexo on a member who
  ranks above them. Nobody can act on themselves, on Nexo or on the server's owner.
- Each server's settings, such as its welcome, its automatic roles and its warnings, sit in an
  SQLite file, `data/nexo.sqlite` (or `DATABASE_PATH`), through the SQLite that Node.js brings
  along. When Nexo is removed from a server, it deletes everything it kept about that server.

## <img src="assets/icons/contribute.svg" height="33" align="absmiddle" alt="">Contribute

```bash
pnpm check    # Biome and TypeScript
pnpm test     # Vitest
pnpm format   # Biome fixes what it can
```

CI runs the same checks, plus [check-pipeline](https://github.com/Robertwlt03/check-pipeline) for
secrets, links and texts. `CLAUDE.md` holds the rules this repository follows.

## <img src="assets/icons/license.svg" height="33" align="absmiddle" alt="">License

[MIT](LICENSE)
