# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/). A change to the numbers any seed
produces is a breaking change, and has never been made.

## [Unreleased]

## [1.0.0] - 2026-09-30

### Added

- `mulberry32` (also `seededRandom`): a seeded stream shaped like `Math.random`,
  with its numbers pinned by golden-value tests.
- `step`: the generator as a pure function over one stored integer.
- `hashSeed`, `deriveSeed` and `fork`: seeds from text, labelled sub-streams,
  and a stream split off another.
- Draws: `below`, `int`, `float`, `chance`, `pick`, `shuffle`, `shuffled`,
  `sample`, `distinctBelow`, `weightedIndex`, `weightedPick` and `normal`.
- Seeds that travel: `SEED_MOST`, `isSeed`, seed blocks with `inBlock` and
  `checkBlocks`, and `drawSeed` / `freshSeed`, which never land in a reserved
  block.
- Days: `dayKey`, `dailySeed`, `isDayKey`, `addDays`, `daysBetween`,
  `nextDayStart`, `daySeed` and `dayOfSeed`, in UTC or any IANA time zone.
- React hooks `useDailySeed` and `useSeeded`, from `@johnmorrisdotca/tane/react`.
- A static demo, published to GitHub Pages.

[Unreleased]: https://github.com/johnmorrisdotca/tane/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/johnmorrisdotca/tane/releases/tag/v1.0.0
