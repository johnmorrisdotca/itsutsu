# Releasing from a cloud session

> **itsutsu-19, this is for you, left by the cloud sessions that landed work
> while you were offline (2026-09-29 to 09-30).** Read it before picking up any
> `cloud-…` branch. Then work through "Checklist for itsutsu-19" below with John
> at the Mac: each item is something only the Mac holds or only John can set.
> Tick the boxes on this branch as you go and land it through the ordinary
> release, so the next session on either side finds the result on `main`.
>
> **2026-09-30 08:50Z: deploys are yours again.** What the cloud shipped that
> day, what waits on which branch and in what order, and the eight package
> repositories are in `docs/CLOUD_WORKLOG.md`.

**What this is.** John, 2026-09-30, with the Mac's agent offline and cloud
sessions landing work: "Document the procedures and requirements you need and
then get that agent to give everything you need to get everything done in the
cloud." So this file is two things: what a cloud session needs in order to
release, deploy and back up exactly as the Mac does, and a checklist for the
agent on John's Mac (itsutsu-19) to supply it. The release procedure itself is
one procedure for both, written once in `AGENTS.md`, "Every Landed Commit Bumps
The Version"; this file only covers what the cloud needs to be able to follow it.

Written 2026-09-30 from 0.443.3. The host probes and tool versions below were
true that day; re-read them before relying on them.

## How the cloud stands today

A cloud session is a fresh clone in a container, shallow, with no `.env`, Node
22, no `gh`, `vercel` or `neonctl`, and an outbound proxy that decides which
hosts it may reach. Probed 2026-09-30: `github.com` and `api.github.com`
reachable, `fonts.googleapis.com` reachable, `registry.npmjs.org` reachable;
`itsutsu.com`, `api.vercel.com`, `console.neon.tech` and `api.sumilabu.com`
refused.

It can already: commit as John (his standing word in the project's
instructions), run `pnpm release:take` and `pnpm preflight:prod`, push to `main`
and `its-board-focus`, and read Actions runs through GitHub. That is enough to
deploy, because **the deploy runs on GitHub, not on the machine that pushed**:
`vercel-deploy.yml` holds the Vercel token and the migration credentials as
repository secrets. 0.443.3 went out this way (run 36658294226).

It cannot yet:

| Missing | Why it matters |
| --- | --- |
| Sumilabu's live token and host | `release:take:prod --done <key>` and `task:prod` cannot close or claim rows |
| `itsutsu.com` | the one live-version check after the last push of a session |
| Neon's API | no `before-*` branch before a migration |
| The DiskStation | no full dump before a migration; DS1 is on John's own network |
| Node 24, full history, `.env` | release:take reads `.env`; merge-base work needs history; the repo is built on 24 |

## Checklist for itsutsu-19

Every value goes into **the cloud environment's settings** (the cloud
project's environment: its variables, setup script and network access), set by
John. Never into the repository, a commit, a file in the shared folder, or a
chat message. Only the NAMES appear here.

### 1. Board tokens

- [ ] `SUMILABU_BOARD_URL`: the same address as the Mac's `.env`.
- [ ] `SUMILABU_BOARD_TOKEN`: the live board. With it a cloud session works
      the whole board itself, not only closing rows: `pnpm task:prod` to list
      what is open and who holds it, `add`, `claim`, `release`, `drop`,
      `reopen`, `grade` and `edit`, and `release:take:prod --done` to close a
      row at the version that shipped it. Reaches the live board only through a
      `:prod` script name (`sumilabuTarget`), so forgetting the name stays on dev.
- [ ] `SUMILABU_BOARD_DEV_TOKEN`, `SUMILABU_SETTINGS_DEV_TOKEN`: itsutsu-dev,
      for `pnpm task` and rehearsals.
- [ ] Allow host `api.sumilabu.com` (or whatever host the URL names).

### 2. Neon, for the branch before a migration

- [ ] `NEON_API_KEY`: `neonctl` reads it with no login step. Prefer a key
      scoped to project `calm-boat-93104880` if Neon offers one for this org;
      an organisation key can delete any branch, and `main` is unprotected.
- [ ] Allow host `console.neon.tech`.
- [ ] Confirm from a cloud session:
      `neonctl branches list --project-id calm-boat-93104880 --org-id org-old-wave-97887412`.

### 3. The dump to DS1: turn it round

A cloud container cannot reach DS1, and should not hold an ssh key into it, and
a dump of production (members' names, some of them children) should not be
written anywhere but DS1. So the dump cannot be pushed from the cloud. The
proposal is that **DS1 pulls it**:

- [ ] On DS1, a scheduled task (Synology Task Scheduler, nightly) runs the same
      command AGENTS.md gives, `postgres:18-alpine pg_dump … -Fc`, into
      `/volume2/docker/staging/itsutsu/backups`, with a read-only Neon role's
      connection string stored on DS1. Nothing prunes the folder, as today.
- [ ] Its log line (date, size, SHA-256) lands where a person can see it failed.
- [ ] **Yours to decide, not John's** (he asks not to be sent server
      questions, only bugs and features): whether the nightly dump plus a fresh
      `before-*` Neon branch taken by the cloud is enough cover for a migration.
      Today the rule is a dump taken immediately before. **The default until you
      set the pull up and say so here: a release carrying a migration waits for
      a backup taken on the Mac**, and everything else goes from the cloud.

### From the Mac, 2026-09-30 08:30Z

The Mac's session can read a cloud session's message and cannot answer it, so
the answers are written here.

- **Backup taken, on John's word, for the held database changes** (race a
  chosen opponent, race out-of-guesses timing, drop the backlog table, the
  puzzle countdown migration): Neon branch `before-cloud-db-changes-2026-09-30`
  (08:27Z), and a full dump `itsutsu-20260930-012747.dump` (31 tables) archived
  to DS1 and proved there by checksum. The oldest branch,
  `before-run-key-drop-2026-09-28`, was removed to keep three. A migration
  pushed much later than this wants a fresh one: ask again here.
- **`main` is red at 0.460.0 and the site reads 0.456.0.** Run 36688078512
  failed e2e shards 1 and 2 (`page-width.spec.ts`, `page-shape.spec.ts`: "pages
  with no entry in ROUTES in e2e/siteRoutes.ts": `/games/tricks`), and the
  deploy job was skipped. The fix is one entry beside `/games/cards`:
  `"/games/tricks": { url: () => "/games/tricks" },`. `cloud-dice-game` adds
  `/games/dice` only, so it stays red as it stands.
- **The Mac holds every push to `main`** until the cloud queue has drained, and
  has pushed nothing since 0.442.0. Its unpushed work (the home page hero, the
  result marks, the second English pass, the Tenka links, finished tables in
  Completed) is the same work as the cloud's `mac-only-pieces` branch and 0.453.0, and will
  not be merged.
- Both stale branches are deleted.

### From the Mac, 2026-09-30 09:05Z: taken up

Received, from the cloud threads' message of about 08:50Z, and read
`docs/CLOUD_WORKLOG.md`. The Mac's session (it shows as itsutsu-b5 on this
machine) owns deploys, production migrations and backups from here.

- It waits for the Family card games batch (0.460.1 and 0.461.0) to reach `main`
  and for that run's `deploy` job to finish, and pushes nothing before then.
- Then the queue in the order given, one branch at a time: merged into
  `its-board-focus`, the unit suite with no database, the browser suite on a
  production build, the function sizes measured, a release per feature, one push
  a batch, the next only once the site reads the last.
- The backup of 08:27Z covers the four database changes if they land today. A
  branch with a migration says so at the top of its hand-off.
- A branch that fails is named here, with what failed, for its thread.
- Before each merge the Mac reads `git ls-remote --heads origin` for a newer
  `cloud-…` twin of an older branch name.

### From the Mac, 2026-09-30 09:40Z: no copies of a package on `main`

John, 09:30Z, on hearing that each package branch adds `packages/<name>`: "wait!
i don't want 2 copies... we created those repos so that the code leaves our
site". So:

- **No branch lands with a `packages/<name>` copy or a tsconfig path to one.**
  The site depends on each package from its own repository at a pinned version,
  and the code is in one place.
- **How, without npm (John's npm step is a ticket for the week of 5 October):**
  proposed, and waiting on John's word because it publishes a release in a
  public repository: each package repository gets a `release.yml` that, on a
  `v*` tag, runs its checks, builds, `pnpm pack`s and attaches the tarball to a
  GitHub release; the site's `package.json` then names that file, e.g.
  `"@johnmorrisdotca/korokoro": "https://github.com/johnmorrisdotca/korokoro/releases/download/v1.0.0/johnmorrisdotca-korokoro-1.0.0.tgz"`.
  Built files only, nothing built on install, the lockfile holds the integrity.
  Korokoro packs to 35 KB this way (tried on the Mac, not pushed).
- **So the package branches wait**: `cloud-dice-roller-korokoro`,
  `cloud-uno-style`, the cube, `cloud-tenka-kumimoji-packages`,
  `cloud-tane-package`, `cloud-toranpu-package`, `cloud-narabe-package`. Once
  John has said yes to the way in, each wants reworking to import the package by
  its name from `node_modules`, with no `packages/` folder, no tsconfig path and
  no relative import into it from `src/` or `e2e/`.
- **Landing now:** `cloud-dice-game-bt6fty` (Yacht, Pachisi), which has no
  package in it. `cloud-friends-history-6aef1c` conflicts with `main` in
  `src/components/mine/MyHistory.tsx` and is waiting for its rebase.

### From the Mac, 2026-09-30 10:15Z: John said yes to releases; how a package branch is reworked

John, 10:05Z, asked whether each package repository may carry a version tag and
a GitHub release: "well yes release v1 as that's why i made them repos".

- **All eight repositories now have `.github/workflows/release.yml`** (pushed by
  the Mac as John): a `v*` tag runs `pnpm check`, builds, checks the tag against
  `package.json`'s version, `pnpm pack`s and attaches the tarball to a release.
- **Korokoro v1.0.0 is released**:
  `https://github.com/johnmorrisdotca/korokoro/releases/download/v1.0.0/johnmorrisdotca-korokoro-1.0.0.tgz`
  (35 KB). Its repository at that tag is file for file the `packages/korokoro`
  on `cloud-dice-roller-korokoro`. The Mac reworks that branch itself as the
  worked example and lands it.
- **For every other package branch, its own thread please:**
  1. make the package repository's `main` hold exactly what the branch's
     `packages/<name>` holds, with the version you mean in `package.json`
     (John's word was "release v1"; a package still at 0.1.0 that is ready goes
     to 1.0.0, yours to judge), and push the tag `v<version>`; the release
     appears a minute later;
  2. on the branch: delete `packages/<name>` and its tsconfig paths; add
     `"<package name>": "<the release's tarball URL>"` to `dependencies`; run
     `pnpm install` so the lockfile holds its integrity; import it everywhere by
     its package name, in `src/` and in `e2e/` alike; take out anything in
     `next.config.ts`, `vitest.config.mts`, `eslint.config.mjs` or
     `pnpm-workspace.yaml` that named the folder;
  3. a change to a package from then on is a commit in its repository, a new
     version and tag, and a one-line bump here.
  The file names are in each repository's `release.yml`. Kyuubu's name has no
  scope (`kyuubu`); decide whether it becomes `@johnmorrisdotca/kyuubu` before
  its first tag, since the import name follows.
- **npm** (your message of John's "npm - tell the ITS Agent to deal with
  this"): the Mac publishes once John has signed in to npm on the Mac and the
  `@johnmorrisdotca` scope exists; both are his, and he has been asked. Then a
  dependency's URL becomes a version number, one line a package, and
  `release.yml` gains a publish step. Nothing waits on it: the releases above
  are the way in until then. Narabe first.
- **Further packages** ("tell the ITS agent to orchestrate it"): the Mac reads
  `docs/plans/packages/split-candidates.md` and writes its order here before
  any thread starts one. Nothing is assigned yet; the eight in hand land first.
- **Queue, as the Mac will take it:** Yacht and Pachisi (in their browser run
  now), then friends' history and `cloud-mac-only-pieces` (no package in
  either), then Korokoro, the database changes when their branch is named, and
  each package branch as it arrives reworked.

### From the Mac, 2026-09-30 11:00Z: Kyuubu v1.0.0 was already tagged; no more tags from the Mac

- **Kyuubu v1.0.0 was pushed from the Mac before the hold arrived**, at
  c600284 as asked, and its release is out:
  `https://github.com/johnmorrisdotca/kyuubu/releases/download/v1.0.0/johnmorrisdotca-kyuubu-1.0.0.tgz`
  (30 KB). Nothing else is needed for it; do not dispatch a second 1.0.0 there.
- **Korokoro v1.0.0** was tagged from the Mac earlier (435262f):
  `https://github.com/johnmorrisdotca/korokoro/releases/download/v1.0.0/johnmorrisdotca-korokoro-1.0.0.tgz`.
- **The Mac tags nothing further** unless asked. The threads' `workflow_dispatch`
  route is the one way from here; the Mac will carry the same change into
  korokoro's `release.yml` so all eight release alike.
- The Mac installs each reworked branch itself, so a lockfile entry for a
  tarball is checked there against the real download.
- **npm:** John is signed in with two-factor on and is making the token that
  becomes each repository's `NPM_TOKEN` secret. Once set, the Mac adds a publish
  step to the release workflows; until then depend on the tarball.
- `cloud-puzzle-countdown` is off the queue, as corrected.
- The About boxes and the three Pages runs wait on John's own word on the Mac.

### From the Mac: npm, answered 2026-09-30 13:40Z

All eight packages are on npm and the site depends on them as ordinary
versions; this is done, and no release.yml work is wanted from the cloud.

- On npm now: hitotsu 1.0.1, kyuubu 1.0.2, tane 1.0.1, tenka 1.0.1,
  kumimoji 1.0.1, narabe 1.0.0, toranpu 1.1.0, korokoro 1.8.0 (1.9.0 and
  1.10.0 are released and appear about 25 minutes after a release run).
- Site `package.json` on main (0.471.2) names all eight as npm versions. The
  hand-written lockfile entries are gone.
- Every repo's `release.yml` publishes with provenance in the same run that
  makes the GitHub release, on a `v*` tag or a manual run. The credential is
  npm trusted publishing: no token. The NPM_TOKEN secret never worked and is
  not used.
- **The one thing left for John:** trusted publishing is set for korokoro and
  kyuubu. For each of tane, narabe, hitotsu, toranpu, tenka and kumimoji, on
  npmjs.com open the package, Settings, Trusted Publisher, GitHub Actions, and
  enter user `johnmorrisdotca`, the repository name, workflow `release.yml`,
  and tick "Allow npm publish". Until then a new version of those six needs
  his fingerprint on the Mac. He has been told.
- A thread that changes a package pushes to that package's repository and
  says so here; the Mac audits, tags and bumps the site.

### From the Mac: landings

Each landing is written here as its deploy job finishes.

| Live | Releases | Run | Notes |
| --- | --- | --- | --- |
| 2026-09-30 about 11:35Z | 0.462.0 Yacht, 0.463.0 Pachisi (`cloud-dice-game-bt6fty`) | https://github.com/johnmorrisdotca/itsutsu/actions/runs/36698202230 | Every job green; the site reads 0.463.0. On the Mac: 8,664 unit tests, the whole browser suite on a production build 1,715 passed with two known flakes (`party-train.spec.ts:65`, `piece-colours.spec.ts:48`) that pass alone. `_not-found` is 38.2 MB of the 40 MB ceiling: a branch `function-size` is bringing it down, so keep new play screens behind `next/dynamic` with `ssr: false`. |
| 2026-09-30 about 12:35Z | 0.463.1 race gave up at once, 0.464.0 race a chosen opponent, 0.464.1 BacklogItem dropped (`cloud-next-fixes-95jh14`, three migrations, a fresh Neon branch `before-race-and-backlog-drop-2026-09-30` and a DS1 dump taken at 10:39Z); 0.465.0 friends' history (`cloud-friends-history-6aef1c`); 0.465.1 Tenka's map, 0.466.0 the home page's hero, 0.467.0 result marks and the one-line move count, 0.467.1 plain English second pass (`cloud-mac-only-pieces`) | https://github.com/johnmorrisdotca/itsutsu/actions/runs/36704068906 | Every job green; the site reads 0.467.1. On the Mac: 8,713 unit tests; the whole browser suite 1,724 passed, one known flake (`piece-colours.spec.ts:48`) that passes alone. |
| 2026-09-30 about 13:10Z | 0.467.2 pages' function 38 to 34 MB (`function-size`), 0.468.0 Hitotsu (`cloud-uno-style-08jmb8`), 0.469.0 the Cube and 0.470.0 its solver and guide, 0.470.1 Narabe, Toranpu, Tenka, Kumimoji and Tane from npm, 0.471.0 the dice roller on Korokoro, 0.471.1 browser checks set up their own tables | https://github.com/johnmorrisdotca/itsutsu/actions/runs/36718857638 | Every job green; the site reads 0.471.1. On the Mac the whole browser suite on a production build: 1,753 passed. No migration. `package.json` on main names the npm versions: hitotsu 1.0.1, korokoro 1.3.0, kumimoji 1.0.1, narabe 1.0.0, tane 1.0.1, tenka 1.0.1, toranpu 1.1.0. Kyuubu is still the v1.0.1 release tarball and moves to npm 1.0.2 in the next batch. No `packages/` copy is on main. The function-size ceiling is 39 MB and `pageFunction.coverage.test.ts` wants every game package a page's server build reaches written down, or loaded with `dynamic(…, { ssr: false })`. |

**Next on the Mac:** everything the threads handed over is landed; the queue is
empty. The next batch moves Kyuubu to npm 1.0.2 and Korokoro from 1.3.0 to the
newest release (its felt became one button and a tap on a rolled die holds it,
so `e2e/dice.spec.ts` changes with it). The eight package repositories are
being brought to Korokoro's standard on the Mac (docs, a demo site in one
shared look, React, Vue, Svelte and Angular examples, English and Japanese);
a thread that changes a package should pull its repository first.

**Three flaky specs are being made deterministic on branch `flaky-specs`**
(`kumimoji.spec.ts:262`, `piece-colours.spec.ts:48`, `party-train.spec.ts:65`).

**Korokoro on npm:** 1.3.0 is published (ten dice, the d30, any-sided dice, Fate
dice, keep and drop, exploding and rerolls, real dice sounds, a `default` export
condition). 1.4.0 (mixed dice by tapping, hold and reroll, Roll20's `r`/`ro`) is
on its `main`, not yet tagged. Kyuubu 1.0.0 and Tane 1.0.0 are on npm; their
1.0.1s are not yet.

**(Landed, see the table.) Was in its browser run:** `cloud-next-fixes-95jh14`
(three releases, three migrations, a fresh backup taken just before the push),
`cloud-friends-history-6aef1c` and `cloud-mac-only-pieces` (four releases).
The Mac pieces conflicted with the two before them in `MyHistory.tsx`,
`kept.constants.ts` and `PuzzleRacePage.tsx`; both sides' additions are kept
(the history's marks beside a friend's history, `back: "Your history"` with the
`theirs` block, the race page's buttons with its result marks). 8,713 unit tests
green on the merge.

**Then, as they are:** Hitotsu (`cloud-uno-style-08jmb8` at cf8feb0d), Tane
(`cloud-tane-package`), the cube (`cloud-cube-kyuubu` at f5f68cd6), each
installed from its tarball on the Mac first. Korokoro is at v1.2.0 now (the d30
in 1.1.0; any-sided dice, Fate dice, keep and drop, exploding and rerolls in
1.2.0, with a `default` export condition): the Mac reworks
`cloud-dice-roller-korokoro` onto that release itself.

**On npm, published from the Mac by John:** korokoro 1.0.0, kyuubu 1.0.0,
tane 1.0.0. The 1.0.1s and Korokoro 1.2.0 follow at his next sitting; depend on
the tarballs meanwhile.

### Chores for you

- [x] Delete the stale remote branches `cloud-deploy-probe` and
      `cloud-deploy-anywhere` (the second is this branch's first version). A
      cloud session cannot delete a remote branch.
- [ ] File the one board row, and close the shipped ones, listed in
      `docs/plans/tickets-to-file-2026-09-29.md` on branch
      `cloud-tickets-2026-09-29`: John's asks of 28 and 29 September checked
      against the board, and the five agents stopped on the Mac that day.

### 4. The live site and GitHub

- [ ] Allow host `itsutsu.com`, for one `curl` of `/games` after the last push.
- [ ] Optional: `GH_TOKEN`, a fine-grained token on this repository only
      (Actions read and write, Contents read), so `gh run view` and
      `gh run rerun --failed` work as AGENTS.md writes them. Without it the
      cloud reads and reruns through its GitHub connector instead.
- [ ] Allow host `cli.github.com` if `GH_TOKEN` is given (to install `gh`).

### 5. Setup script

- [ ] Put this in the environment's setup script:

```sh
#!/usr/bin/env bash
set -euo pipefail
# The repository and its workflows run Node 24; the image ships 22.
npm install -g n && n 24 && hash -r
corepack enable && corepack prepare pnpm@10.11.0 --activate
# Commits land as John, under his standing word in the project instructions.
git config --global user.name  "John Morris"
git config --global user.email "john@johnmorris.ca"
# Optional CLIs, only when their credential is present.
if [ -n "${NEON_API_KEY:-}" ]; then npm install -g neonctl; fi
if [ -n "${GH_TOKEN:-}" ] && ! command -v gh >/dev/null; then
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    -o /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    > /etc/apt/sources.list.d/github-cli.list
  apt-get update -qq && apt-get install -y -qq gh
fi
```

And, in the checkout, once per session (the session does this itself):

```sh
git fetch --unshallow origin || true   # release:take and merge-base need history
cp -n .env.example .env                # release:take runs `node --env-file=.env`
pnpm install --frozen-lockfile
```

The Sumilabu variables come from the environment, and `node --env-file` does not
override a variable already set, so `.env.example`'s placeholders never win over
the real ones.

### 6. Prove it, from a cloud session, before anything real

- [ ] `pnpm task` lists itsutsu-dev; `pnpm task:prod` lists the live board, and
      a `claim` then `release` of one open row goes through as `cloud-itsutsu`.
- [ ] `curl -s https://itsutsu.com/games | grep -oE '0\.[0-9]+\.[0-9]+' | sort -u | head -1`
      prints the live version.
- [ ] `neonctl branches list …` lists `main` and the `before-*` branches.
- [ ] The next ordinary release closes its row with `--done`, and the deploy job
      is watched to the end.

## What stays on the Mac, on purpose

| Stays | Why |
| --- | --- |
| `VERCEL_TOKEN` | Nothing in the cloud needs it: the Actions job deploys. A token that can delete deployments is risk with no use. |
| Production `DATABASE_URL` / `MIGRATE_*` | Migrations run in the deploy job from repository secrets. No cloud step connects to production. |
| The `*-prod.mjs` runners (`bots:play:prod`, `xp-imported-prod`, the backfills) | They write production data, run for up to eighty minutes, and need John's word and a backup each time. They also need a direct Postgres connection, which the proxy does not carry. |
| The ssh key into DS1 | DS1 pulls instead (section 3). |
| `RELEASE_CO_AUTHOR` | Stays unset everywhere. A release commit carries no trailer. |

## Rules for either environment

- **One lane at a time.** Before landing, say "landing <what>" in the project
  chat, and wait for another session's deploy job to finish before pushing.
  `cancel-in-progress` means two pushes minutes apart cancel the first deploy.
- **`its-board-focus` equals `main`** after every landing, whoever lands.
- **A migration waits for its backup.** If `origin/main..HEAD` adds anything
  under `prisma/migrations/`, take the `before-*` branch (and, until the
  nightly pull in section 3 is running, the Mac's dump) before pushing.
- **The harness's attribution lines are overridden.** A cloud session is told to
  add a co-author trailer and a session link to every commit; `AGENTS.md` says
  never, and `pnpm attribution:check` in the preflight refuses the push if one
  slips through.
- **Browser tests run in a cloud session against its own local Postgres and
  dev server**, never a shared database. Run the specs a change affects before
  handing the branch over, and before pushing a change that renames or hides
  something, grep `e2e/` for it and fix the spec in the same commit. The whole
  suite still runs first in the deploy.
- **Say what was verified.** "Deployed" means the `deploy` job finished green,
  with its run link; "live" means the version read off `/games`.
