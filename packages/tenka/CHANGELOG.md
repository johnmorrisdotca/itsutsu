# Changelog

All notable changes to this project are written down here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The world wraps round: Alaska and the Russian Far East are neighbours across
  the Bering Strait, drawn off one edge of the map and on at the other.
- Two more sea links, Britain to Central Europe and Southern Europe to Egypt,
  and every sea crossing is drawn long enough to read at a whole-world view.
- Every continent frames on screen at one tap: the far northern islands are
  drawn but no longer framed, and an island past the seam is left off.

## [0.1.0] - 2026-09-30

The first release.

### Added

- The rules of the classic world-conquest game for two to six players, as pure
  functions over a plain game value: reinforcing, trading sets of cards,
  attacking one throw at a time or until it is decided, moving in, fortifying,
  knocking a player out and taking their cards, and the count at the end of the
  last round.
- A neutral army for a game of two, and starting armies placed at random or by
  hand.
- Every deal, shuffle and die drawn from the game's own seeded random, so a game
  replays exactly from its seed and moves; a game kept as text and read back,
  refusing anything that does not replay.
- Every legal move listed, and a sensible computer player.
- A map of the modern world in forty-two territories and six continents, built
  from Natural Earth, with neighbours by land and by sea.
- What a tap on the map means in each part of a turn, and what to light up.
- A whole table in plain DOM (`@johnmorrisdotca/tenka/ui`): the map with a
  look at each continent, the players, your cards and the dice, against the
  computer or passing one device round; light and dark, themeable through CSS
  variables.
- `TenkaMap` and `TenkaTable`, React components, from
  `@johnmorrisdotca/tenka/react`.
- A static demo for GitHub Pages.

[Unreleased]: https://github.com/johnmorrisdotca/tenka/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/johnmorrisdotca/tenka/releases/tag/v0.1.0
