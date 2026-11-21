# Changelog

All notable changes to this project are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The bot itself, rebuilt from scratch on Node.js 26 and discord.js 14, with its first slash
  commands: `/ping`, `/info` and `/help`, in German and English.
- `/serverinfo`, `/userinfo` and `/avatar`: the server, a member and a member's profile picture.
- `/welcome`: a welcome card for new members in a channel, with the placeholders `{user}`,
  `{username}`, `{server}` and `{membercount}`. Needs the Server Members Intent.
- `/goodbye`: the same card when someone leaves, for every member, also those who joined before
  the bot started.
- `/autorole`: roles that new members get on joining. Nexo checks each role when it is added and
  names what stands in the way: @everyone, a role of an integration, a role not below the
  asker's own, Manage Roles, or a role above Nexo's own.
- Level and XP: 15 to 25 XP per message, at most every 20 seconds, a 🎉 in the channel at each
  new level, `/rank` and `/leaderboard`.
- Moderation: `/warn`, `/warnings` and `/unwarn`, `/timeout` and `/untimeout`, `/kick`, `/ban` and
  `/unban`. Nexo refuses to act on the moderator, itself, the owner or anyone who ranks as high
  as the moderator, and writes the moderator's name into the audit log with the reason.
- `/modlog`: a channel where Nexo posts a card for every moderation command: the action, the
  member with their ID, the moderator, the reason, and the end of a timeout or a warning's
  number. Nexo answers the moderator first; if the card can't be posted, a private follow-up
  says why. A public log channel gets a note when it is set up.

### Changed

- Every card uses Discord's newer components (Components V2) instead of embeds: a heading, the
  facts, then small print, and nothing twice. The welcome mentions the new member once, inside
  the card, which notifies them when `ping` is on. `/welcome setup` answers with a test button,
  `/warnings` has a remove button on each warning, `/help` and every hint to a command can be
  clicked, and `/avatar` links the account picture with a button.
- One design, Nexo Mono: Nexo's amber is the only color, icons are Heroicons uploaded as the
  app's own emojis, and facts show as small gray labels above their values. The welcome and the
  goodbye show a picture Nexo draws of the member (their picture in an amber ring, their name,
  the server and, for a welcome, their member number), and `/rank` draws a ring that fills
  toward the next level. `/help` comes in sections, and level-ups are a card.
- `/ping` shows "Nexo is thinking…" first, so its answer no longer counts as edited.
