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

Every value goes into **the cloud environment's settings** (claude.ai, the
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
  Completed) is the same work as `claude/mac-only-pieces` and 0.453.0, and will
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
  `cloud-…` twin of a `claude/…` name.

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
git config --global user.email "john@spxis.com"
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
- **Browser tests do not run in a cloud session** (they need a local database).
  Before pushing a change that renames or hides something, grep `e2e/` for it and
  fix the spec in the same commit; the deploy's suite is the first run it gets.
- **Say what was verified.** "Deployed" means the `deploy` job finished green,
  with its run link; "live" means the version read off `/games`.
