# Contributing to Kumimoji

Thank you for wanting to help. Bug reports, rule questions and pull requests are
all welcome.

## Reporting a bug

Open an [issue](https://github.com/johnmorrisdotca/kumimoji/issues) with what you did,
what you expected and what happened. A game's seed makes almost any bug
reproducible: include it, and the moves if you have them.

## Making a change

```sh
git clone https://github.com/johnmorrisdotca/kumimoji.git
cd kumimoji
npm install
npm run check    # lint, types and tests, as CI runs them
npm run site     # build the demo into site/ and open site/index.html
```

- The rules are pure functions over plain values: a function returns a new
  game and never changes the one it was given. Keep it that way.
- Anything random is drawn from the game's own seeded random, so a game always
  replays from its seed. Never call `Math.random` inside the rules.
- Add or change a test beside the code you change (`*.test.ts`).
- Note the change under **Unreleased** in [CHANGELOG.md](CHANGELOG.md).
- Keep pull requests to one change each, with a message that says what a player
  or a developer would notice.

## Releasing

Maintainers bump the version in `package.json`, move **Unreleased** in the
changelog under the new version and date, tag `v<version>`, and publish with
`npm publish --access public`.

By contributing you agree that your work is released under the
[MIT licence](LICENSE), and to follow the [code of conduct](CODE_OF_CONDUCT.md).
