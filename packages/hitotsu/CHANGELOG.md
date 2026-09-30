# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-09-30

### Added

- The game for two to eight: match the colour or the number, skip, reverse,
  draw two, wild, wild draw four, and the call with one card left. Scored by
  the cards left in the other hands, to 200 or 500 points or one hand.
- Its own deck of 108 cards, drawn as SVG: four colours, each with one of the
  five elements in its corners (火 土 木 水) so no card is told by colour alone.
- The popular house rules, each an option: stacking (same card, or any draw
  card on any), jump-in, sevens and zeros, draw until you can play, and the
  Wild Draw Four challenged or played without bluffing. Classic and Party
  presets.
- A computer player that stacks, challenges, saves its wilds and always calls.
- Games kept as a line of text (the set-up, the seed and the moves) and read
  back by replaying them through the rules.
- A table for several devices: set-ups and moves as they arrive over the wire,
  checked, with jumping in taken off.
- `mountHitotsu`, a table to play against computers on any page, and
  `HitotsuTable`, `HitotsuCardImage` and `HitotsuCardDrawing` for React, from
  `@johnmorrisdotca/hitotsu/react`.
- A static demo, published to GitHub Pages.

[Unreleased]: https://github.com/johnmorrisdotca/hitotsu/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/johnmorrisdotca/hitotsu/releases/tag/v0.1.0
