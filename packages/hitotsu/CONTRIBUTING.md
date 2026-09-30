# Contributing to Hitotsu

Thank you for wanting to help. Bug reports, rule questions and pull requests
are all welcome.

## Setting up

```sh
npm install
npm run check   # types and tests
npm run site    # build the demo into ./site, then serve it with any static server
```

## How the code is laid out

- `src/types.ts`, `src/constants.ts`: the vocabulary and the presets.
- `src/deck.ts`, `src/rules.ts`: the deck and the rules. Every function takes a
  game and returns a new one, and never changes the one it was given.
- `src/computer.ts`: the computer player. It sees only what a player at the
  table could see.
- `src/codec.ts`, `src/table.ts`: a game as text, and a table on several devices.
- `src/card.ts`: the card design, as shapes. Everything that draws a card draws
  these, so a change to the look is made once.
- `src/ui/`, `src/react.tsx`: the table in plain DOM, and the React wrapper.

## Pull requests

- A rule change comes with a test in `src/rules.test.ts` that plays the
  position it is about.
- Keep the core free of dependencies and of the DOM.
- Add a line under **Unreleased** in `CHANGELOG.md`.

By taking part you agree to follow the [code of conduct](./CODE_OF_CONDUCT.md).
