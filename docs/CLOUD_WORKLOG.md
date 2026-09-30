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
- Every branch below now has its `cloud-…` name; fetch before merging, since
  several are being reworked to take their package from a GitHub release.

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
`main`, re-run its checks and push, so fetch before merging. Branches reported
on 0.460.0 need the two newer commits on `main` (0.460.1, 0.461.0) merged in
when they land.

| # | What | Branch | Thread | Notes |
| --- | --- | --- | --- | --- |
| 1 | Yacht and Pachisi, two dice games (two minors) | `cloud-dice-game-bt6fty` | A dice game | Landed by itsutsu-19 as 0.462.0 (Yacht) and 0.463.0 (Pachisi), pushed about 09:50Z; deploy result to follow. |
| 2 | The database changes, three releases: a race seat out of guesses reads as given up at once; race a chosen opponent (offered to a buddy by name, with inbox and My games); the unused backlog table, its four enums and its export script dropped. Migrations `20260930090000_drop_backlog_item`, `20260930091000_race_gave_up` (two nullable date columns), `20260930092000_race_offered_to` (one nullable column plus an index); Prisma reports no drift | `cloud-next-fixes-95jh14` (built on 0.461.0) | Next features and bug fixes | Unit tests and the race, inbox and kept-puzzle specs green. Covered by Neon branch `before-cloud-db-changes-2026-09-30` and DS1 dump `itsutsu-20260930-012747.dump`. **Do not land `cloud-puzzle-countdown`:** the countdown has been live since 0.420.0 (migration `20260928180000_puzzle_clocks`, spec `e2e/puzzle-clock.spec.ts`); that branch is a superseded second version with a duplicate `countdownMs` column. |
| 3 | Korokoro and the `/dice` tab under Games (open to strangers, kept offline), one minor | `cloud-dice-roller-korokoro` | Dice roller and number generator | One commit on 0.460.0. Lint, types, unit tests, build, dice and offline specs green. First site use of a package, through a tsconfig path to `packages/korokoro`. |
| 4 | Friends' history: a buddy's page lists every game they have played, of every kind, each opening to watch or look back | `cloud-friends-history-6aef1c` | Browse friends' game history | One commit on 0.460.0 by John. Types, lint, unit tests and 85 browser specs green, including the new friend-history spec; the one failure was the `/games/tricks` page-list line, fixed on main in 0.460.1. |
| 5 | The four Mac pieces rebuilt: Tenka map links (Bering Strait, Britain–Scandinavia, Southern Europe–Egypt), home page hero without duplicate buttons, result marks on every result with the move count on one line, plain-English second pass with a glossary gate. No numbers taken | `cloud-mac-only-pieces` | Rebuilding the Mac-only pieces | Rebased on 0.460.0. Types, lint, file sizes and unit suite green; party pictures re-stamped. 146 of 147 touched specs; the one failure was main's own missing `/games/tricks` page-list line, fixed on main in 0.460.1. Wallpaper button on finished puzzles left out (broke page-width checks on the Mac). #8 is being rebased on top of this branch. |
| 6 | Hitotsu, the Uno-style colour-card game for two to eight: Classic and Party modes with house rules, a computer for any seat, one device or several, on a new Colour cards shelf. No database change (several-device tables store the game as text) | `cloud-uno-style-08jmb8` at cf8feb0d, no number taken | Uno-style game and variants | Consumes the Hitotsu release v1.0.1 (https://github.com/johnmorrisdotca/hitotsu/releases/download/v1.0.1/johnmorrisdotca-hitotsu-1.0.1.tgz; 1.0.0 would not load through require, 1.0.1 fixes its exports), cut from the cloud through the manual Release run. `packages/hitotsu` and its tsconfig, vitest and eslint wiring are gone; package.json names the tarball, the lockfile integrity was checked against the download; src/ and e2e/ import by package name; the party pictures' fingerprint follows the installed version. Main 0.461.0 merged in, every commit by John. Lint, types, 8,635 unit tests, and the Hitotsu, About, screenshot and just-the-board browser specs green. A rules change now goes in the Hitotsu repo as a new release, then a URL bump here. Proposed changelog line: "Hitotsu 一つ, a colour-card game for two to eight (our own take on UNO): Classic and Party modes, stacking, jump-in, sevens and zeros, draw to match and no-bluffing house rules, a computer for any seat, played on one device or several, on a new Colour cards shelf." |
| 7 | Kyuubu: a Cubes family with a 3D cube 2×2 to 5×5; "Show me how" for 2×2 and 3×3 (a helped solve scores no points and stays off the fastest tables); a method guide at `/learn/cube` with a practice cube per stage. Two releases: the cube, then the solver and guide. No database change | `cloud-cube-kyuubu` at f5f68cd6 | Rubik's cube section | Consumes Kyuubu v1.0.1, `@johnmorrisdotca/kyuubu` (https://github.com/johnmorrisdotca/kyuubu/releases/download/v1.0.1/johnmorrisdotca-kyuubu-1.0.1.tgz; 1.0.0 could not be loaded by the browser tests). The `packages/kyuubu` copy and its tsconfig paths are gone; every import, browser tests included, uses the package name; package.json pins the tarball. Lockfile entries hand-written with integrity from the live tarball (byte-identical to a local pack; `--frozen-lockfile --lockfile-only` accepts it), but no install by URL has been done from the cloud, so the first normal install on the Mac is the first real fetch. Types, lint and all 24 cube and Learn browser specs green; unit suite green apart from two long simulations that time out only when sharing the machine with the browser run. Still two releases when landing: the cube, then the solver and guide. |
| 8 | Tenka and Kumimoji engines moved into `packages/tenka` and `packages/kumimoji`; old site paths are forwarding files. One release per package when landing | `cloud-tenka-kumimoji-packages` | Tenka and Kumimoji as packages | Must land AFTER #5: the thread is rebasing it onto the Mac-pieces branch so the new Tenka map sits inside `packages/tenka` (and goes to the tenka repo). Types, lint, 8,576 unit tests green; Tenka, Kumimoji, party and online-table specs 179 of 183, the 4 failures the known `no-select` cases from the cloud's older Chromium. Re-stamp the party and puzzle art fingerprints if moved watched files trip them (`scripts/party-art-stamp.ts`, `puzzle-art-stamp.ts`). |
| 9 | Tane: puzzles, daily words, board rules and the simulation draw their random numbers from the Tane release, every number unchanged. A patch release | `cloud-tane-package` | Tane seeded random package | Consumes Tane v1.0.1 (https://github.com/johnmorrisdotca/tane/releases/download/v1.0.1/johnmorrisdotca-tane-1.0.1.tgz; 1.0.0's exports answered only import, 1.0.1 uses default; sha256 matches the release digest). One commit on main 0.461.0: `packages/tane` and its tsconfig paths gone, the site imports `@johnmorrisdotca/tane` by name, seeds and daily puzzles unchanged (golden-value tests pass both sides). Lint, types, 8,598 unit tests, build and 72 browser specs green; all 322 spec files load. |
| 10 | Toranpu: the deck and all nine card games moved into `packages/toranpu`, imported by name; no visible change | `cloud-toranpu-package` | Toranpu playing-cards package | Rebased on 0.460.0. 40 card, win-cover, wallpaper and about specs green; 8,591 unit tests, with two failures that are flaky in parallel and pass alone. Keeps its own seeded generator (same results as Tane) until Tane is on npm. |
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
`@johnmorrisdotca/<name>` from John's account (itsutsu-19 handles it, on
John's word; see section 4), make it an ordinary dependency in
`package.json`, and delete the `packages/` copy and the tsconfig path.

**Since 10:15Z the way in is a GitHub release, not a copy** (itsutsu-19's
note in `CLOUD_HANDOVER.md`, John: "release v1 as that's why i made them
repos"). All eight repos have a `release.yml`; Korokoro v1.0.0 is released. Each
package thread tags its repo, deletes `packages/<name>` from its branch and
depends on the release tarball's URL instead. npm publishing waits on John's
"publish yes" to itsutsu-19; then the URLs become version numbers.

**How a release is cut from the cloud (09:19Z).** The cloud's git proxy
refuses tag pushes, so a package thread adds `workflow_dispatch` to the repo's
`release.yml`: a manual run reads the tag from `package.json`'s version and
runs `gh release create "$TAG" ./*.tgz --target "$GITHUB_SHA"`, which creates
the tag and the release together. The thread pushes that change as John and
starts the run from GitHub's Actions dispatch (release.yml, ref main). Tane
v1.0.0 came out this way:
https://github.com/johnmorrisdotca/tane/releases/download/v1.0.0/johnmorrisdotca-tane-1.0.0.tgz.
Kyuubu v1.0.0 was the one exception, tagged from the Mac at c600284d just before this route was found:
https://github.com/johnmorrisdotca/kyuubu/releases/download/v1.0.0/johnmorrisdotca-kyuubu-1.0.0.tgz.
From here the Mac does not tag package repos unless asked; a tag pushed by hand would
collide with the one the workflow makes. Korokoro's `release.yml` may want the
same `workflow_dispatch` so all eight release alike.

**A package's exports use `"default"`, not `"import"`,** in
`publishConfig.exports`. With `"import"`, Playwright's CommonJS-compiled specs
fail with `No "exports" main defined`. Kyuubu re-releases as 1.0.1 for this,
cut through the workflow route above, and Korokoro may need the same fix.

**pnpm in the cloud gets 401 on release tarballs** (the
objects.githubusercontent.com redirect), while curl and node fetch get 200.
The package threads work around it by adding the lockfile's importer, packages and snapshots entries by hand, with the integrity taken from `openssl dgst -sha512 -binary` of the curl'd .tgz in base64, which `pnpm install --frozen-lockfile --lockfile-only` accepts. The Tane thread's variant: curl the .tgz, install it from `file:`, then replace both `file:` spellings with the URL in package.json and pnpm-lock.yaml and run `pnpm install --frozen-lockfile`; check that a cloud-…
package branch's lockfile entries resolve normally on a Mac install.

**Until a branch is reworked that way, a change to a package's code goes in two places:** the
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

## 4. Decisions John has made, and what is still his

John, 2026-09-30 09:05Z: "npm - tell the ITS Agent to deal with this. Mroe
packages? tell the ITS agent to orchestrate it. REpo settings? you can help
with this only".

- **npm publishing is itsutsu-19's.** Publish the eight as
  `@johnmorrisdotca/<name>` from John's npm account (Narabe first, as the Mac
  suggested: every new game touches it). Once one is on npm, the site takes it
  as an ordinary dependency and its `packages/<name>` copy and tsconfig path go.
  Then the Tane follow-ups apply: Tenka's dice and Kumimoji's shuffle move onto
  Tane, and Toranpu and Narabe drop their own RNG copy for Tane.
- **Further packages are itsutsu-19's to orchestrate.** The survey is
  `docs/plans/packages/split-candidates.md`: Hitoriasobi (solitaire), Yomi
  (computer players for Narabe), Nazotoki (logic puzzles), Kanamoji (kana),
  Asobiba (pass-and-play table games), Kurikaeshi, Shoubu, Rusuban. Never split:
  the several-devices sync, the share-alike word lists and kanji data, the Pop
  brand-name word list and the WaniKani radical names. Cloud threads can build
  any package it assigns, on `cloud-…` branches, through the project
  coordinator; John creates each new repo on GitHub when asked by name.
- **GitHub settings on the eight repos stay with John, with the cloud's help.**
  The About box (description, website, topics) is set on none. Pages is on for
  kumimoji (built) and for kyuubu, toranpu, tane and tenka, each of which needs
  its Pages workflow re-run. It is off for korokoro, hitotsu and narabe
  (Settings, Pages, Source "GitHub Actions"). The text to paste is in the
  project's shared `packages/repo-settings.md`.
- **The child-reach rule in Test Mode** was left alone on purpose because it is
  a child-safety rule. The cloud is explaining it to John; do not change it.

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
