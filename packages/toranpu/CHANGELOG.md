# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-09-30

### Added

- The deck: fifty-two cards as objects, a seeded shuffle, dealing, one-character
  and two-character codes, and card names (`@johnmorrisdotca/toranpu/deck`).
- Nine games, each with its rules, its computer player and its save format:
  Hearts, Spades, Euchre, Cribbage, Crazy Eights, Go Fish, Big Two, President
  and Gin Rummy, each also its own entry point.
- `CardGameRules`, the one interface every game answers, and
  `CARD_GAME_RULES` and `CARD_GAME_TABLES` for all nine.
- `newGame`, `rulesFor` and `playComputers`, to start and run any game by name.
- Saved games as text (the table, the seed and the moves), read back by
  playing the moves through the rules again.
- `useCardGame`, a React hook (`@johnmorrisdotca/toranpu/react`).
- A demo where a hand of any game can be played against the computer,
  published to GitHub Pages.

[Unreleased]: https://github.com/johnmorrisdotca/toranpu/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/johnmorrisdotca/toranpu/releases/tag/v1.0.0
