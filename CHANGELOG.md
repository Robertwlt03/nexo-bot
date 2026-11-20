# Changelog

All notable changes to this project are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The bot itself, rebuilt from scratch on Node.js 26 and discord.js 14, with its first slash
  commands: `/ping`, `/info` and `/help`, in German and English.
- `/serverinfo`, `/userinfo` and `/avatar`: the server, a member and a member's profile picture.

### Changed

- `/ping` shows "Nexo is thinking…" first, so its answer no longer counts as edited.
