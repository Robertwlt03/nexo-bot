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

### Changed

- `/ping` shows "Nexo is thinking…" first, so its answer no longer counts as edited.
