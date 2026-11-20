<p align="center">
  <img src="assets/banner-readme.svg" alt="Nexo: One bot. Every feature." width="100%">
</p>

Nexo is a Discord bot for communities. It is being rebuilt from scratch, one feature at a time:
each command is tried on a real server before the next one lands. It answers in German or English,
in the language of each member's Discord.

## <img src="assets/icons/features.svg" height="33" align="absmiddle" alt="">What it does

| Command       | What it does                                                                  |
|---------------|-------------------------------------------------------------------------------|
| `/ping`       | Shows how fast Nexo answers: the round trip and the connection to Discord     |
| `/info`       | Shows the version, how many servers use Nexo, and how long it has been online |
| `/serverinfo` | Shows the server: owner, members, channels, roles, boosts and its age         |
| `/userinfo`   | Shows a member, or you: account age, joining date and roles                   |
| `/avatar`     | Shows a member's profile picture, or yours, in full size                      |
| `/welcome`    | Greets new members in a channel: `setup`, `test`, `off`; for admins           |
| `/goodbye`    | Says goodbye in a channel when someone leaves: `setup`, `test`, `off`         |
| `/autorole`   | Gives new members roles: `add`, `remove`, `list`; for admins                  |
| `/warn`       | Warns a member with a reason; Nexo keeps the warning                          |
| `/warnings`   | Shows a member's warnings, numbered; `/unwarn` removes one                    |
| `/timeout`    | Mutes a member for 5 minutes up to a week; `/untimeout` ends it               |
| `/kick`       | Removes a member from the server; they can join again                         |
| `/ban`        | Bans someone, also before they join; `/unban` lifts it                        |
| `/help`       | Lists every command with its description                                      |

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
   `applications.commands` and the permissions _Send Messages_, _Embed Links_, _Manage Roles_ (for
   automatic roles) and _Timeout Members_, _Kick Members_ and _Ban Members_ (for moderation), open
   the URL and pick your server. Nexo can only give roles below its own
   highest role: in the server settings under _Roles_, drag Nexo's role above them.
4. **Start it.**

   ```bash
   pnpm install
   pnpm dev
   ```

   The console shows `Nexo#1234 is online with 17 commands`. `pnpm dev` restarts the bot whenever
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
  Each answer picks the language of the member's Discord.
- The bot asks Discord for the server list (`Guilds`) and, for welcome, goodbye and automatic
  roles, for members joining and leaving (`GuildMembers`, the privileged _Server Members Intent_).
- `/welcome` and `/goodbye` are one command built twice (`src/commands/greeting.ts`); both post
  the same card (`src/greeting.ts`).
- Moderation checks the role order itself (`src/moderation.ts`): Discord only checks that a
  moderator has the permission, so without it someone could act through Nexo on a member who
  ranks above them. Nobody can act on themselves, on Nexo or on the server's owner.
- Each server's settings, such as its welcome, its automatic roles and its warnings, sit in an
  SQLite file, `data/nexo.sqlite` (or `DATABASE_PATH`), through the SQLite that Node.js brings
  along.

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
