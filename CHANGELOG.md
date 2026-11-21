# Changelog

All notable changes to this project are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The bot itself, rebuilt from scratch on Node.js 26 and discord.js 14, with its first slash
  commands: `/ping`, `/info` and `/help`, which answer in German or English.
- `/serverinfo`, `/userinfo` and `/avatar`: the server, a member and a member's profile picture.
- `/welcome`: a welcome card for new members in a channel, with the placeholders `{user}`,
  `{username}`, `{server}` and `{membercount}`. Needs the Server Members Intent.
- `/goodbye`: the same card when someone leaves, for every member, also those who joined before
  the bot started.
- `/autorole`: roles that new members get on joining. Nexo checks each role when it is added and
  names what stands in the way: @everyone, a role of an integration, a role not below the
  asker's own, Manage Roles, or a role above Nexo's own.
- Level and XP: 15 to 25 XP per message, at most every 20 seconds, a level-up card, `/rank` and
  `/leaderboard`.
- Moderation: `/warn`, `/warnings` and `/unwarn`, `/timeout` and `/untimeout`, `/kick`, `/ban` and
  `/unban`. Nexo refuses to act on the moderator, itself, the owner or anyone who ranks as high
  as the moderator, and writes the moderator's name into the audit log with the reason.
- `/modlog`: a channel where Nexo posts a card for every moderation command: the action, the
  member with their ID, the moderator, the reason, and the end of a timeout or a warning's
  number. Nexo answers the moderator first; if the card can't be posted, a private follow-up
  says why. A public log channel gets a note when it is set up.
- The mod log also shows kicks, bans, lifted bans and timeouts made in Discord itself, read from
  the audit log, in the language of whoever set up the mod log. Needs View Audit Log;
  `/modlog setup` says so when it is missing.
- `/ticket setup`: a card with a button that opens a ticket, a private thread only the member,
  the team (an optional role) and those who may manage threads see. One open ticket per member;
  a close button locks the thread. Setup names the permissions Nexo still lacks in the channel.

### Changed

- Commands, their options and descriptions are English for everyone, so the command list no
  longer mixes languages. Answers, cards and `/help` stay in each member's language.
- Every card uses Discord's newer components (Components V2) instead of embeds: a heading, the
  facts, then small print, and nothing twice. The welcome mentions the new member once, inside
  the card, which notifies them when `ping` is on. `/welcome setup` answers with a test button,
  `/warnings` has a remove button on each warning, `/help` and every hint to a command can be
  clicked, and `/avatar` links the account picture with a button.
- One design, matching Nexo's wooden logo: Nexo's amber is the one accent, icons are Heroicons
  uploaded as the app's own emojis, and facts show as small gray labels above their values. The
  welcome and the goodbye show a picture Nexo draws of the member (their picture in an amber ring,
  their name, the server and, for a welcome, their member number), and `/rank` draws a ring that
  fills toward the next level. `/help` comes in sections, and level-ups are a card.
- `/ping` shows "Nexo is thinking…" first, so its answer no longer counts as edited.

- `/levels`: level-up cards where members write, in one channel, or off; a card for every level
  up to 10, then every fifth and every level that gives a role; `reset` starts a member's XP
  again. Private threads, such as tickets, earn no XP.
- `/levelrole`: roles members get from a level on, free; checked like `/autorole`, and members who
  are past the level get them with their next message.
- Moderation tells the member by direct message: where, why, until when and how many warnings,
  without the moderator's name. The moderator hears when the message could not be delivered.
- When Nexo is removed from a server, it deletes everything it kept about it.
- `make build` makes plain JavaScript in `dist/` for servers; with `make start`, Nexo needs about
  55 MB of memory instead of about 110 MB.
- After each picture, Nexo hands its memory back at once: 40 pictures in a row hold about 34 MB
  instead of 54. The wood texture is scaled to the pictures' size, which saves 3 MB more.
- A `Makefile` with short commands: `make` lists them, from `make dev` to `make verify`, which
  runs every check CI runs on the code.

### Removed

- `/ping`: `/info` shows the connection to Discord. `/unwarn`: the remove button in `/warnings`
  does the same.

### Fixed

- `/welcome setup` and `/goodbye setup` check Attach Files too, which the picture needs.
- A banned member gets no goodbye, so a raid no longer posts a picture of every raider.
- A ticket whose card could not be posted is deleted again instead of blocking the member's next
  one; `/ticket setup` warns when members can't write in threads or the team role is too large for
  Discord to add to tickets.
- `/help` answers privately and lists only the commands the asker may use; `/leaderboard` tells
  the asker their own place privately.
- Names in Nexo's pictures leave out emoji, show fancy letters plainly and draw small capitals and
  rare accents with Noto Sans, instead of boxes; the small labels are large enough to read on a
  phone.
- The bot is called Nexo everywhere and keeps its wooden logo, now with its wooden banner on the
  profile. The welcome, goodbye and `/rank` pictures sit on the same walnut, with fireflies and
  cream names.
- `/info` shows the new tagline, "The quiet community bot.", and a button to add Nexo, instead of
  versions and a server count.
- The mod log speaks one language, the one it was set up in, for Nexo's commands too.
- Automatic roles wait until a new member accepts the rules, so Discord's rules screening still
  applies.
- `/unwarn` and the remove button refuse a warning of the moderator themself or of someone who
  ranks as high, as `/warn` does.
- Level-ups skip channels where Nexo may not write.
- Moderation, greeting tests and closing a ticket answer "Nexo is thinking" first, so a slow
  Discord no longer runs out the three seconds it waits for an answer.
- `/ticket setup` in a channel that has the button already updates it instead of posting another.
- `/serverinfo` no longer counts threads as channels.
- The `/rank` picture shows the place large instead of the English word "RANK"; the goodbye
  picture is gray all over; buttons are gray with Nexo's icons.
- Clearer texts: "timeout" instead of "mute", Discord's own German word for permissions, and
  the `/ping` connection named in words.
