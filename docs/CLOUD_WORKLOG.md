# What the cloud did on 2026-09-30

Written for itsutsu-19 (the ITS Agent on John's Mac) on 2026-09-30 at about
08:50 UTC, when John handed deploys back to it: "now that it's back… it will do
all deploys etc again". Read it beside `docs/CLOUD_HANDOVER.md`, whose answers
from the Mac (the backup, the branch cleanup) it relies on.

**The new process, from here on:**

- itsutsu-19 owns every push to `main`, every deploy, every production database
  migration and every backup.
- The cloud's last push to `main` was the family-cards fix batch (0.460.1, the
  missing `/games/tricks` in the measured page list, and 0.461.0, Oh Hell),
  deployed green at 08:57Z. No cloud thread pushes to `main` again.
- Every cloud thread puts finished work on a `cloud-…` branch, rebased on
  current `main` with its checks and affected browser specs green, and says in
  its thread what the branch holds. itsutsu-19 tests it, takes the release
  number, lands it and watches the deploy. If a branch fails its tests, say so
  (in this file, or to John) and the owning thread fixes it.
- Three branches below still carry an older prefix, shown as `…/<name>`; their
  threads were asked at 08:39Z to move them to `cloud-…` names. Before merging,
  `git ls-remote --heads origin | grep <name>` finds the current one.

## 1. Live today

Every release below went out through `pnpm release:take … && pnpm preflight:prod`
and a push to `main`, committed as John Morris. "Live" means the named run's
`deploy` job finished green; a release with no run of its own went live inside
the next green run, which carried it.

| Version | What | Run that took it live |
| --- | --- | --- |
| 0.442.1–0.443.1 | Focus mode while playing (the site steps back), Tsunagi bridge line passes under | [36658294226](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36658294226) (their own runs 36654146039 failed: focus mode hid the nav 8 "left half way" specs clicked) |
| 0.443.2 | My games and Report a problem stay in the bar while playing | 36658294226 (own run 36656773818 failed) |
| 0.443.3 | Kumimoji try-it lists the word a blank wild makes | [36658294226](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36658294226) |
| 0.443.4 | Test members left out of players, ladders, standings, champions | [36663950740](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36663950740) |
| 0.444.0 | Gomoji, Tsunagi, Kumimoji and Koushi under Other on New game | [36663950740](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36663950740) |
| 0.445.0 | Tenka on several devices | [36665805493](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36665805493) |
| 0.446.0 | Mexican Train on several devices | [36665805493](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36665805493) |
| 0.447.0 | Itsutsu as a home-screen app | [36666762838](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36666762838) |
| 0.448.0, 0.449.0 | FreeCell, Spider | [36670689555](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36670689555) (0.449.0's own run 36667483252 failed on a spec leaving Gomoji as Tiles) |
| 0.449.1 | That spec's leak fixed | [36670689555](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36670689555) |
| 0.450.0 | Release date and time on What's new | [36671490433](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36671490433) |
| 0.450.1 | Game record leaves out test members' games unless Test Mode | [36672877361](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36672877361) |
| 0.451.0 | My games History tab, every kind of game | [36677652290](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36677652290) (own run 36674365969 failed the measured page list) |
| 0.451.1 | Measured page list includes the kept-game page | [36677652290](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36677652290) |
| 0.452.0 | Games play offline (service worker, Ready offline, keep every game) | [36679533170](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36679533170) |
| 0.453.0 | Completed on My games is one list | [36680903134](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36680903134) |
| 0.454.0, 0.455.0 | Gomoji Nige 逃げ, Gomoji Sakasa 逆さ | [36682652917](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36682652917) |
| 0.456.0 | Completed filtered by family or game | [36684795007](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36684795007) |
| 0.457.0–0.460.0 | Spades with a new Tricks shelf, Gin Rummy, Euchre, Cribbage (their own run [36688078512](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36688078512) failed: `/games/tricks` was missing from the measured page list) | [36692025625](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36692025625) |
| 0.460.1, 0.461.0 | The page-list fix; Oh Hell | [36692025625](https://github.com/johnmorrisdotca/itsutsu/actions/runs/36692025625), `deploy` job green 08:57Z |

**That was the cloud's last push to `main`.** `main` is 0.461.0 (4d3edf26), and
the landing queue below is itsutsu-19's from here.

The Mac's own leftovers that duplicate cloud work (0.453.0, the Mac-only pieces)
stay unmerged, as the Mac said; compare them against the cloud versions once
those are live, then clear them.

## 2. Built and tested, waiting to land, in this order

One at a time, oldest first, each on a fresh `main` with the number re-taken.
Branch heads as of 08:45Z; each thread was told at 08:39Z to rebase on current
`main`, re-run its checks and push, so fetch before merging.

| # | What | Branch | Thread | Notes |
| --- | --- | --- | --- | --- |
| 1 | Yacht and Pachisi, two dice games (two minors) | `cloud-dice-game-bt6fty` | A dice game | Rebased on 0.460.0; browser tests, history spec, just-the-board survey and 8,636 unit tests green. |
| 2 | The four database changes the Mac's backup covers: a race seat out of guesses says so at once (new column); race a chosen opponent (new column); drop the unused `BacklogItem` table; the puzzle countdown (`countdownMs`, Tortoise, Fox or Rabbit) | Race work and table drop: new `cloud-…` branch from the Next features thread (was `cloud-next-fixes-95jh14`); countdown: `cloud-puzzle-countdown` (from 2026-09-26, needs a rebase) | Next features and bug fixes | Covered by Neon branch `before-cloud-db-changes-2026-09-30` and DS1 dump `itsutsu-20260930-012747.dump`. Anything beyond these four migrations needs a fresh backup. |
| 3 | Korokoro and the `/dice` tab under Games (open to strangers, kept offline), one minor | `cloud-dice-roller-korokoro` | Dice roller and number generator | One commit on 0.460.0. Lint, types, unit tests, build, dice and offline specs green. First site use of a package, through a tsconfig path to `packages/korokoro`. |
| 4 | Friends' history: a player's page lists every game they played, of every kind | `cloud-friends-history-6aef1c` | Browse friends' game history | Built on 0.451.1; 199 browser specs green. |
| 5 | The four Mac pieces rebuilt: Tenka map links (Bering Strait, Britain–Scandinavia, Southern Europe–Egypt), home page hero without duplicate buttons, result marks on every result, plain-English second pass with a glossary gate | `…/mac-only-pieces-2ehusy` (older prefix) | Rebuilding the Mac-only pieces | Wallpaper button on finished puzzles left out (broke page-width checks on the Mac). One Mexican Train spec failed twice over a random deal in the long run, then passed 4 of 4 alone. |
| 6 | Hitotsu, the Uno-style colour-card game (three ways to play, house rules), from `packages/hitotsu` | `cloud-uno-style-08jmb8` | Uno-style game and variants | Party files and e2e import the package by relative path; components by package name. |
| 7 | Kyuubu: a Cubes family (2×2 to 7×7), "Show me how" step solver for 2×2 and 3×3 (a helped solve scores nothing and stays off the fastest tables), Learn guide "Solve the cube" | `…/rubiks-cube-9raqkb` (older prefix) | Rubik's cube section | 8,476 unit and 176 browser tests green. |
| 8 | Tenka and Kumimoji engines moved into `packages/tenka` and `packages/kumimoji`; old site paths are forwarding files. One release per package when landing | `cloud-tenka-kumimoji-packages` | Tenka and Kumimoji as packages | Must land AFTER #5: the thread is rebasing it onto the Mac-pieces branch so the new Tenka map sits inside `packages/tenka` (and goes to the tenka repo). Types, lint, 8,576 unit tests green; Tenka, Kumimoji, party and online-table specs 179 of 183, the 4 failures the known `no-select` cases from the cloud's older Chromium. Re-stamp the party and puzzle art fingerprints if moved watched files trip them (`scripts/party-art-stamp.ts`, `puzzle-art-stamp.ts`). |
| 9 | Tane: puzzles, daily words, board rules and the simulation draw their random numbers from `packages/tane`, every number unchanged. A patch release | `cloud-tane-package` | Tane seeded random package | Rebased on 0.460.0. Lint, types, unit suite, production build and 83 browser specs green. Fresh seeds skip the new Nige and Sakasa blocks. Tenka's dice file is left for the Tenka package. Golden values in `packages/tane/src/*.test.ts` are the site's historical numbers; never change them. |
| 10 | Toranpu: the deck and nine card games moved into `packages/toranpu` | `…/toranpu-package-r7pvma` (older prefix) | Toranpu playing-cards package | 8,530 unit tests and 27 card browser specs green. |
| 11 | Narabe: the rules engine of all 48 board games moved into `packages/narabe` (computer players stay in the site) | `cloud-narabe-package` | Narabe board rules package | Rebased on 0.460.0. Types, lint, size gate and 8,570 unit tests green. Board browser specs 142 of 142 before the rebase, not re-run after it (engine untouched): run them before landing. One local-only unit failure the thread traced to its own `.env`, not the change. |

Every package branch made `e2e/about.spec.ts` import the catalogue statically,
because Playwright does not follow a tsconfig path through a dynamic
`await import(...)`. The change is the same line on each branch and merges
cleanly.

Also waiting, not a site release: `cloud-tickets-2026-09-29` holds
`docs/plans/tickets-to-file-2026-09-29.md`, the board rows to file and close
(the Mac's chore in `CLOUD_HANDOVER.md`).

## 3. The eight package repositories

Pushed today under github.com/johnmorrisdotca, every commit authored and
committed by John Morris &lt;john@johnmorris.ca&gt;. Each is a complete pnpm
project (pnpm 10.11 pinned, lockfile committed, CI on lint, types, tests and
build, a Pages demo workflow, README, CONTRIBUTING, CODE_OF_CONDUCT, a
Keep-a-Changelog CHANGELOG).

| Repo | What it is |
| --- | --- |
| [korokoro](https://github.com/johnmorrisdotca/korokoro) | Dice roller: d4 to d100, one to five dice, exact odds, history |
| [kyuubu](https://github.com/johnmorrisdotca/kyuubu) | Turning cube 2×2 to 7×7 in CSS 3D, with the step solver |
| [hitotsu](https://github.com/johnmorrisdotca/hitotsu) | Colour-card shedding game, house rules, computer player, several-device table |
| [toranpu](https://github.com/johnmorrisdotca/toranpu) | Playing-card deck and nine card games with computer players |
| [tane](https://github.com/johnmorrisdotca/tane) | Seeded random and daily seeds (mulberry32, the site's own numbers) |
| [tenka](https://github.com/johnmorrisdotca/tenka) | World-conquest party game |
| [kumimoji](https://github.com/johnmorrisdotca/kumimoji) | Word tiles, with its word lists |
| [narabe](https://github.com/johnmorrisdotca/narabe) | One rules engine for 48 abstract board games |

**The site does not use them yet.** `main` has no `packages/` folder. Each branch
in section 2 (#3, #6 to #11) adds a copy of its package under
`packages/<name>` and points the site at it through a tsconfig path
(`@johnmorrisdotca/<name>` → `packages/<name>/src/index.ts`, plus `/react`). It
is not a pnpm workspace and not a dependency. Until those branches land, the
site still runs its old in-tree code.

**The intended end state:** publish each package to npm as
`@johnmorrisdotca/<name>` from John's account (his decision, not yet made; a
thread can prepare the publish commands), make it an ordinary dependency in
`package.json`, and delete the `packages/` copy and the tsconfig path.

**Until then, a change to a package's code goes in two places:** the
`packages/<name>` copy here and the package's own repo, as one change each,
authored as John.

**Use the packages.** New game or puzzle code that belongs to a package (rules,
a deck, dice, the cube, seeded random) goes in that package, not in `src/`. The
site keeps what is the site's: accounts, history, XP, ladders, copy, pictures,
pages.

**Follow-ups the package threads noted:**

- Tenka's dice and Kumimoji's shuffle move onto Tane once Tane lands; the
  sequences are bit-identical (`tenkaDice.ts` `nextRandom` equals Tane's `step`).
- Toranpu and Narabe keep their own small seeded-random copy until Tane is on
  npm, since a package cannot depend on an unpublished one. The switch is one
  file each.
- Left on the site on purpose: `winnableSeed.ts` (watched by the puzzle picture
  fingerprint) and the Gomoji mode seeds.
- The engine boundary gate (`gomoku/boundary.coverage.test.ts`) allows
  `@johnmorrisdotca/tane` by name; another package imported by the engine needs
  the same line.
- Moving files the art fingerprints watch means re-stamping them.

## 4. Still for John (bugs and features only; do not ask him about the rest)

- **The child-reach rule in Test Mode**, left alone on purpose because it is a
  child-safety rule; his call.
- **Which further packages to split out.** Candidates surveyed in
  `/mnt/project-files/packages/split-candidates.md` (Hitoriasobi, Yomi,
  Nazotoki, Kanamoji, Asobiba, Kurikaeshi, Shoubu, Rusuban). Never split: the
  several-devices sync, the share-alike word lists and kanji data, the Pop
  brand-name list and the WaniKani radical names.
- **npm publishing** of the eight, from his account.
- **GitHub settings on the eight repos**: the About box (description, website,
  topics) is set on none; Pages is on for kumimoji (built) and kyuubu, toranpu,
  tane, tenka (each needs its Pages workflow re-run), and off for korokoro,
  hitotsu, narabe (Settings → Pages → Source "GitHub Actions"). The exact text
  to paste is in `/mnt/project-files/packages/repo-settings.md`.

## 5. Things learned today worth keeping

- A new site page must be added to the browser suite's measured page list, or
  the suite fails (0.451.0 and 0.460.0 both hit it).
- A browser-shard failure can be a spec leaving a setting on for the specs after
  it in the same shard (0.449.0), not the code under test.
- The cloud's Chromium is older than CI's: `no-select.spec` fails locally there
  and passes in CI.
- Commits in johnmorrisdotca repos use john@johnmorris.ca. 0.442.1 to 0.449.0 on
  `main` went out under the spxis address by mistake; John said to leave that
  history as it is.
