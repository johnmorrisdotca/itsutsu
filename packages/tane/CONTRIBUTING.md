# Contributing to Tane

Thank you for helping. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug

Open an issue with the seed, the calls you made, what you expected and what
you got, and where it ran (browser and version, or Node). A seed and three
lines of code are usually the whole bug report.

## Making a change

```sh
git clone https://github.com/johnmorrisdotca/tane
cd tane
pnpm install
pnpm check    # lint, types and tests: the same as CI
pnpm site     # builds the demo into ./site
pnpm dlx serve site   # or any static server
```

- **Never change a seed's numbers.** People store seeds in links, databases
  and saved games, and expect them to replay. The golden values in
  `src/*.test.ts` pin every generator and every draw; a change that moves one
  is a breaking change and needs a new function instead.
- **Say how many draws.** Every function that draws documents how many numbers
  it takes, because a caller's next number depends on it. Keep that true.
- **Stay small.** No dependencies, no DOM in the core, nothing that is not
  about seeded randomness or days.
- **Test what you change.** Tests sit beside their source as `*.test.ts`.
- One change per pull request, with a line in `CHANGELOG.md` under
  *Unreleased*.

## Releasing

Maintainers bump the version in `package.json`, move *Unreleased* to the new
version in `CHANGELOG.md`, tag `vX.Y.Z` and run `pnpm publish`.
