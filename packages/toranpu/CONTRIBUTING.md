# Contributing to Toranpu

Thank you for helping. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug

Open an issue with the game, the number of players, the seed and what
happened. A seed and the moves reproduce any game exactly, so the quickest
report is the demo's address (it carries the game, the players and the seed)
or the text from `encode`, with a line on what you expected instead.

## Making a change

```sh
git clone https://github.com/johnmorrisdotca/toranpu
cd toranpu
pnpm install
pnpm check    # lint, types and tests: the same as CI
pnpm site     # builds the demo into ./site
pnpm dlx serve site   # or any static server
```

- **Keep the rules pure.** Every function takes plain data and returns new
  plain data, leaving what it was given alone. No classes, no mutation, no
  timers, no DOM, no dependencies.
- **Test the rule you change.** Tests sit beside their source as `*.test.ts`.
  A rule change needs a test that deals the position it is about.
- **Never break a seed.** A saved game is its seed and its moves, so
  `seededRandom`, `shuffled` and each game's dealing must deal the same cards
  for the same seed for ever. `random.test.ts` pins the stream.
- **A computer sees only its seat.** Each computer reads a view of the game
  built for it (`heartsView` and so on). Never give one another player's hand.
- **A new game** answers `CardGameRules`, joins `CARD_GAME_RULES`,
  `CARD_GAME_TABLES` and the entry points, and passes the simulation in
  `cardGames.simulation.test.ts`: computers alone finish every table, every
  seat can win, the computer beats random play, and a save reads back.
- One change per pull request, with a line in `CHANGELOG.md` under
  *Unreleased*.

## Releasing

Maintainers bump the version in `package.json`, move *Unreleased* to the new
version in `CHANGELOG.md`, tag `vX.Y.Z` and run `pnpm publish`.
