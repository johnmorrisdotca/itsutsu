# Changelog

All notable changes to this project are written down here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-30

The first release.

### Added

- Games dealt from a seed by laying a crossword first, so every bag can be
  finished: hands of 3, 7 or 11, three levels of wild tiles, short, medium and
  full games, and two English sets at once.
- English and Japanese: 144 tiles in each, 110,316 English words from SCOWL and
  163,461 Japanese readings from JMdict, loaded when first needed.
- Playing a game as plain values: lay, move, swap, lift, sort, draw and trade
  one tile for three; wild tiles given any letter or kana.
- Every run across and down judged against the list, with Diagonals as a
  choice; a finished grid checked against its bag in time proportional to its
  size; points for a finish, ten a tile and more for speed.
- Help: the words the hand's own tiles spell, longest first.
- A table of two to eight sharing one bag: turns, drawing together, the last
  round, going out, resigning, joining and leaving, kept as text; and a
  computer player that can take a seat.
- Turning the table a quarter at a time with every tile kept upright, and the
  sums for fitting, zooming and panning a view of it.
- A whole game alone in plain DOM (`@johnmorrisdotca/kumimoji/ui`), light and
  dark, themeable through CSS variables.
- `KumimojiBoard` and `KumimojiTable`, React components, from
  `@johnmorrisdotca/kumimoji/react`.
- A static demo for GitHub Pages.

[Unreleased]: https://github.com/johnmorrisdotca/kumimoji/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/johnmorrisdotca/kumimoji/releases/tag/v0.1.0
