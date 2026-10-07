<div align="center">

# 五つ · Itsutsu

**Forty-five board games on one engine, and three puzzles beside them.** Gomoku and renju, Othello and Go,
checkers and draughts, Hex and Halma — two players in one browser, or two
devices a QR code apart.

[**itsutsu.com**](https://itsutsu.com) · Next.js 16 · React 19 · TypeScript ·
Postgres

<img src="docs/images/board-in-play.jpg" alt="A game in progress on a kaya board" width="820">

</div>

---

- **New to the code?** Read this page, then
  [`docs/CORE_CONCEPTS.md`](docs/CORE_CONCEPTS.md) for the ideas it rests on,
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how it fits together and
  [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) for the database.
- **Changing the code?** Follow the numbered checklist below, [Making a change
  and shipping it](#making-a-change-and-shipping-it-read-this-first), from a
  ticket to a live site. [`AGENTS.md`](AGENTS.md) is the rulebook behind it. It
  is long because every rule in it was learned the hard way, and the gates
  enforce most of it.

The site is in beta, free, and joining is by invitation. Anybody can read the
games and their rules without one.

## Contents

- [Making a change and shipping it](#making-a-change-and-shipping-it-read-this-first)
- [Getting started](#getting-started)
- [What it does](#what-it-does)
- [How it is put together](#how-it-is-put-together)
- [The API](#the-api)
- [Getting in](#getting-in)
- [Who gets in](#who-gets-in)
- [Games played from two devices](#games-played-from-two-devices)
- [Embedding the board](#embedding-the-board)
- [Deploying](#deploying)
- [Scripts](#scripts)
- [Documentation](#documentation)

<!-- procedures:start -->
## Making a change and shipping it (read this first)

AGENTS.md and the README carry this same checklist, so a reader of either one
has it. It is commands, in order, from "somebody asked for something" to "it is
live". The section named in brackets after a step has the reasons; you do not
need them to follow the step. A test fails if the two copies differ, or if a
`pnpm` script named here does not exist.

**How to use it.** Do the steps in order and skip none. Replace every word in
`<angle brackets>`: `<branch>` is a short kebab-case name for your work
(`its-dice-sound`); `<key>` is the board row's key, copied exactly from `pnpm
task:prod`; `$SCRATCH` is a folder outside the repository for your temporary
files (`SCRATCH=/tmp/its-<branch>; mkdir -p $SCRATCH`, or the scratchpad your
tool gives you). Each command you run starts a fresh shell, so put `WEB_PORT=…`
and the like in front of the command that needs them and do not rely on an
earlier `export`. If a command fails and this list does not say what to do,
STOP and tell John the command and the last lines it printed. Do not work round
a failing check, and do not loosen one to make it pass.

**Who lands.** Steps 1 to 5 are for every agent. Steps 6 to 8 (taking a
release, pushing to `main`, watching the deploy) are done only by the session
John has told, in this conversation, that it is the one that lands. If that is
not you, finish step 5 and hand over: your branch name, the head commit, the
ticket key, the one-line summary you would give the release, the specs you ran
(and on what: Mac, Linux image) and any Japanese you drafted. Do not take a
release number and do not push to `main`.

### 1. Ticket before any work

No file is touched, and no agent is started, before the work has a row on the
live board. A request made in conversation becomes a row first. Run these from
the main checkout, whose `.env` holds the live board token:

```sh
cd /Users/john/Projects/itsutsu
pnpm task:prod
pnpm task:prod add "<what a person gets, 120 characters or fewer>" --kind feature --detail "<what is wanted in John's own words, where to look, what done looks like>" --by "<your name>"
pnpm task:prod grade <key> --priority normal --effort medium
pnpm task:prod claim <key> --by "<your name>"
```

`--kind` is `feature`, `fix` or `chore`. The first command lists the board: if
a row already covers the work, use its key and skip `add`. Run `grade` only if
John said how urgent it is. If a command says a token is missing, STOP and tell
John; never paste or print a token. Never close or edit a row any other way:
`release:take:prod --done <key>` (step 6) is the only door to `done`.
[Work Starts With A Ticket, Board Gate]

### 2. Your own worktree, database and port

Never work in the shared checkout. Copy `.env` in BEFORE `pnpm install`, or the
Prisma client never loads it.

```sh
git -C /Users/john/Projects/itsutsu fetch -q origin
git -C /Users/john/Projects/itsutsu worktree add .claude/worktrees/<branch> -b <branch> origin/main
cd /Users/john/Projects/itsutsu/.claude/worktrees/<branch>
cp /Users/john/Projects/itsutsu/.env .env
pnpm install --frozen-lockfile
pnpm db:generate
grep -n "^ADMIN_EMAILS\|^RATE_LIMIT_RELIEF" .env
```

The last line must show `operator@example.test` at the END of `ADMIN_EMAILS`
and `RATE_LIMIT_RELIEF=20`; add what is missing. Ports are 6700 to 6799 only
(Itsutsu's block: 6700 is the main checkout's dev server, worktrees take 6701
upwards). A port is free when this prints nothing:

```sh
lsof -nP -iTCP:6701 -sTCP:LISTEN
```

If it prints a line, try 6702, 6703 and so on. Take three: `<web>` for the
site, `<db>` for your database and `<pw>` for step 4's Linux browser. Your own
throwaway database, so that nothing you run touches the shared one on 55434 or
another session's rows:

```sh
docker run -d --name its-<branch>-db -e POSTGRES_USER=itsutsu -e POSTGRES_PASSWORD=itsutsu -e POSTGRES_DB=itsutsu -p <db>:5432 postgres:17-alpine
```

Edit the worktree's `.env` so that `DATABASE_URL` AND `DIRECT_URL` both read
`postgresql://itsutsu:itsutsu@localhost:<db>/itsutsu` (migrations use
`DIRECT_URL`, so setting only one points two places at once). Then:

```sh
pnpm db:deploy
WEB_PORT=<web> pnpm dev
```

Run the server in the background. Stop it by process id (`lsof -nP
-iTCP:<web> -sTCP:LISTEN` shows it, then `kill <pid>`), never with `pkill` or
`killall`, which stop other sessions' servers. After a `git rebase` or merge
that changes `prisma/schema.prisma`, run `pnpm db:generate`, `pnpm db:deploy`
and restart the server, in that order. A `next dev` or Playwright run with no
`WEB_PORT` is a bug. [Three Things A Worktree Gets Wrong, Local Ports]

### 3. Make the change

- **Read the rule for the area first**, in AGENTS.md "Workspace Gates": the
  engine, a new game, dead ends and counts, XP columns, set-up heights, Just the
  board, the proxy, function size. `git grep -n "<name>"` and `ls <folder>`
  before creating a file: the one you think is new may exist (`src/proxy.ts`).
- **Every word a person reads goes through the phrase table, in English and
  Japanese.** The English is a key in `src/lib/i18n/phrases.<area>.constants.ts`
  (the area is the first word of the key). The Japanese is an entry for the
  same key in `src/lib/i18n/dictionaries/ja.drafted.<area>.constants.ts` with
  `text`, `back` (what it literally says, in English) and EITHER
  `review: { by: "agent", on: "<today>" }`, only after the `japanese-reviewer`
  agent has passed it, OR `ask: "Written by <you> on <date>; nobody has read it."`
  and no `review`. Never invent a `review`. Copy that belongs to a game, puzzle,
  opening, computer player or family is not a phrase: it goes in the sibling
  Japanese table beside it (AGENTS.md "Every Word Goes Through The Phrase
  Table" says which). Then run, and commit what they write:

  ```sh
  pnpm i18n:text
  WRITE_JAPANESE_REVIEW=1 DATABASE_URL=postgresql://x:x@127.0.0.1:1/none pnpm exec vitest run src/lib/i18n
  pnpm i18n:check
  ```

  `pnpm i18n:text` writes `src/lib/i18n/jaText.generated.json.br` and the second
  command rewrites the `docs/japanese-review*.md` sheets: neither is ever edited
  by hand. If `pnpm i18n:check` objects to a sentence, put the sentence in the
  phrase table; do not reword it until the check stops seeing English, and do
  not add an allowance or shorten a `PENDING_PATHS` list to get past it.
- **Pictures and generated files** are written by a command, never by hand.
  After a change to how a board, a puzzle, a party or casual game, or a Houseki
  game is drawn: `WEB_PORT=<web> pnpm screenshots:games` (or `:puzzles`,
  `:party`, `:casual`, `:houseki`), which takes the pictures, cuts the
  thumbnails and writes the stamp that `*Art.coverage.test.ts` compares. Run
  the stamp alone (`node scripts/board-art-stamp.ts`, `puzzle-art-stamp.ts`,
  `party-art-stamp.ts`, `casual-art-stamp.ts`, `houseki-art-stamp.ts`) only
  after you have looked at a picture and your edit to a fingerprinted file
  cannot change how anything is drawn. Also: `pnpm art:thumbs` after replacing a
  `public/art/games/*.jpg`; `pnpm games:added` once a new game's picture is
  committed; `pnpm data:pack` after the data behind `src/lib/packed/*.json.br`
  changed or a package holding it was bumped; `pnpm functions:size --record`
  only for a deliberate change in a server function's size (AGENTS.md
  "Function Size"). Do not edit the ten bot files in `LADDER_FINGERPRINT_FILES`
  unless the ticket is about the bots: any edit, a comment included, silences
  the measured ladder until it is measured again.
- **A new game, puzzle, party or casual game** is not finished until every item
  of AGENTS.md "New Game Gate" is true; its coverage tests name what is missing.
- **A package** (an `@johnmorrisdotca/…` library) is changed in its own
  repository, never here: `gh repo clone johnmorrisdotca/<name>`, read its
  `CONTRIBUTING.md`, `pnpm install --frozen-lockfile`, `pnpm check`, push to its
  `main`, watch its CI to success, set the version and its `CHANGELOG.md`, then
  either push the tag `vX.Y.Z` or run `gh workflow run release.yml --repo
  johnmorrisdotca/<name> --ref main` (trusted publishing, no token), and wait
  until `npm view @johnmorrisdotca/<name> version --prefer-online` shows it.
  Here, `pnpm add @johnmorrisdotca/<name>@<X.Y.Z> --save-exact`, under its own
  ticket. [Engine Is Pure, each package's CONTRIBUTING.md]
- **A schema change** is step 9. **Nothing may run on a timer under about 15
  seconds**, repeat work per request, or wake the database on a schedule; a
  server call, a search or a replay inside something that repeats is a finding.

### 4. Check it locally

Everything in this step runs in your worktree. First the whole static gate,
with a database that does not exist, exactly as CI has none (a unit test that
forgot a stand-in passes here against a real database and fails there):

```sh
rm -rf .next
DATABASE_URL=postgresql://x:x@127.0.0.1:1/none pnpm quality:check
```

That is lint, the 500-line file gate (`pnpm loc:check`), `pnpm i18n:check`,
`pnpm typecheck` and the unit tests; about four minutes. One test file alone:
`DATABASE_URL=postgresql://x:x@127.0.0.1:1/none pnpm exec vitest run <path>`.

The local gate does not open a browser, and CI's browser suite decides whether
the deploy happens, so: grep `e2e/` for every old count, name, label and
address your change moves (`git grep -n "<old text>" e2e/`), then run the specs
for the area you touched, and the specs below if you changed a layout, a
width, a set-up screen, a board, a picture or a play page, on a PRODUCTION
build (`E2E_SERVER=start`), because that is what CI runs:

```sh
rm -rf .next && WEB_PORT=<web> pnpm build
WEB_PORT=<web> E2E_SERVER=start pnpm exec playwright test e2e/<one>.spec.ts e2e/<two>.spec.ts --output $SCRATCH/pw
```

Always `pnpm exec playwright test …`, never `pnpm test:e2e -- …` (pnpm passes
the `--` on and Playwright then runs the wrong files). The layout and sweep
specs: `e2e/set-up-steady.spec.ts`, `e2e/bare-board.spec.ts`,
`e2e/wide-mode.spec.ts`, `e2e/page-shape.spec.ts`, `e2e/page-width.spec.ts`,
`e2e/phone-overflow.spec.ts`, `e2e/phone-header.spec.ts`,
`e2e/game-pictures.spec.ts`, and for anything that loops over every puzzle
`e2e/puzzle-checks.spec.ts` and `e2e/puzzle-hints.spec.ts`. Do not edit source
while a run is going, and keep to one browser run at a time on the Mac. Your
own database means the run's setup may sweep it freely.

CI runs on Linux, and layout specs have passed on the Mac and failed there. Run
the layout specs a second time in Playwright's own Linux image, which draws
the browser in a container and reaches your server on the Mac:

```sh
V=$(pnpm exec playwright --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
docker run -d --rm --name its-<branch>-pw -p <pw>:<pw> --ipc=host mcr.microsoft.com/playwright:v$V-noble /bin/sh -c "npx -y playwright@$V run-server --host 0.0.0.0 --port <pw>"
sleep 15
PW_TEST_CONNECT_WS_ENDPOINT=ws://127.0.0.1:<pw>/ PW_TEST_CONNECT_EXPOSE_NETWORK='*' WEB_PORT=<web> E2E_SERVER=start pnpm exec playwright test e2e/<layout spec>.spec.ts --output $SCRATCH/pw-linux
docker rm -f its-<branch>-pw
```

(`--host 0.0.0.0` is needed: without it the container listens only inside
itself and the connection is reset.) Look at what you built at a phone's width
(390px) and a desk's (1280px), in light and dark. A green run of specs you
chose is not "the suite is green": only CI's run is, so say which one you
mean. [Running the end-to-end suite, Deploys Are Fast By Design]

### 5. Commit

```sh
git status --short
git add <path> <path>
git -c user.name="John Morris" -c user.email="john@johnmorris.ca" commit -m "<what changed and why, one line>" -m "Ticket: <key>"
git log -1 --format='%an <%ae>%n%B'
```

Read every line of `git status` first: each file must be yours. Stage by name,
never `git add -A` or `git add .`, and never `git stash` (the stash is one
stack for every worktree). One concern per commit. The last command must show
John Morris and no trailer, no session link and no "Generated with" line.
Temporary files live in `$SCRATCH`, never in the repository. If you are not
the landing session, STOP here and hand over (see "Who lands"); a branch
needs no push for that, because every worktree shares one repository.

### 6. Landing (the landing session only)

**6.1 One deploy at a time.** A push cancels the deploy still running, so
check the last one is finished:

```sh
gh run list --workflow vercel-deploy.yml --branch main --limit 1 --json status,conclusion,headSha
```

If `status` is not `completed`, STOP and wait for it (step 7); push about once
an hour with the ready work batched, and a fix for something broken live may
go sooner. Several finished features are several releases and ONE push.

**6.2 Bring the branch up to date and re-read the docs.**

```sh
git fetch -q origin && git rebase origin/main
pnpm install --frozen-lockfile && pnpm db:generate
git diff --name-only origin/main...HEAD
```

To land a branch another agent handed over, `git merge --no-edit <their-branch>`
into your worktree first, one branch at a time, oldest first, and run the lines
above after each.

Find each changed path in the map in `docs/DOCS_UPKEEP.md`, re-read the docs
it names, and fix a sentence your change made false in its own commit (step 5)
BEFORE taking the release: the tool commits only `package.json` and
`CHANGELOG.md`. After a rebase, list the files your branch added
(`git diff --name-status origin/main...HEAD`) and check none is a file `main`
deleted or moved. [Documentation Upkeep, A Merge Cannot Conflict With A File
That No Longer Exists]

**6.3 Take one release per feature, oldest first.** The tree must be clean.

```sh
GIT_AUTHOR_NAME="John Morris" GIT_AUTHOR_EMAIL=john@johnmorris.ca GIT_COMMITTER_NAME="John Morris" GIT_COMMITTER_EMAIL=john@johnmorris.ca pnpm release:take:prod --summary "<one line a player would read, lower case, continuing the dash>" --done <key>
GIT_AUTHOR_NAME="John Morris" GIT_AUTHOR_EMAIL=john@johnmorris.ca GIT_COMMITTER_NAME="John Morris" GIT_COMMITTER_EMAIL=john@johnmorris.ca pnpm release:take:prod --patch --summary "<a fix>" --summary "<another fix>" --done <key>
```

The first form is a minor (something a player would notice: a game, a page, a
capability) and takes exactly ONE `--summary`; the second is a patch (a fix, a
rewording, a refactor, a chore) and may take several. Use whichever fits each
feature, once per feature. It takes the next number, dates `CHANGELOG.md`,
commits both files with no trailer and closes the row `<key>`; it prints
`marked done`. Every release needs a `--summary`. Never write the version into
`package.json` or `CHANGELOG.md` yourself. If closing a row fails, the release
commit is still right: with a clean tree, run `pnpm release:take:prod --done
<key>` alone. [Every Landed Commit Bumps The Version]

**6.4 The one chain.** The gate, the fetch, the ancestor check and the push are
ONE command joined by `&&`: never `;`, never a pipe (a pipe's status is the
last command's, so a red gate pushed), never a push typed on its own.

```sh
rm -rf .next && test -z "$(git status --porcelain)" && DATABASE_URL=postgresql://x:x@127.0.0.1:1/none pnpm preflight:prod > $SCRATCH/gate.log 2>&1 && git fetch -q origin && git merge-base --is-ancestor origin/main HEAD && git push -q --atomic origin HEAD:main && echo "PUSHED $(git rev-parse HEAD)"
```

`pnpm preflight:prod` runs lint, sizes, unit tests, audit, the attribution
check, the English check, types and the build side by side, about two minutes.
The answer is the last line: `PUSHED <sha>` means it is on `main`. Anything
else means the chain stopped before the push, and nothing was pushed:

- **The tree was dirty:** `git status`, stage or remove, commit, and run it again.
- **The gate is red:** `tail -60 $SCRATCH/gate.log`. Take the release commit(s)
  back off with `git reset --keep HEAD~<number of releases you took>`, fix the
  cause in a new commit (step 5), and go again from 6.3. The number is free again.
- **`origin/main` moved** (the ancestor check failed): somebody pushed first. Take
  your release commit(s) off the same way, `git fetch -q origin && git rebase
  origin/main`, and go again from 6.2. A row already closed at a version that
  did not ship is John's to hear about.

### 7. Watch the deploy

A push to `main` starts `vercel-deploy.yml`: five check legs and fourteen
browser shards side by side, then, only if all pass, the `deploy` job. Nothing
is live until the `deploy` job succeeds, about fifteen minutes after the push.
Find the run by your commit:

```sh
SHA=$(git rev-parse HEAD)
gh run list --workflow vercel-deploy.yml --branch main --limit 10 --json databaseId,headSha -q ".[] | select(.headSha==\"$SHA\") | .databaseId"
```

It prints nothing for the first seconds after a push (wait 30 seconds, ask once
more) and nothing for ever if every changed file was Markdown or under `docs/`
(no run is started for those, and none is needed). With the number as `RUN`,
ask GitHub once a minute and stop at the FIRST failed job, not only at the
`deploy` job, because a red browser shard skips the deploy and looks like a
wait:

```sh
RUN=<run id>
while true; do
  JOBS=$(gh run view $RUN --json jobs -q '[.jobs[] | {id: .databaseId, name, status, conclusion}]')
  echo "$JOBS" | jq -e 'any(.[]; .conclusion=="failure" or .conclusion=="cancelled")' >/dev/null && break
  echo "$JOBS" | jq -e 'any(.[]; .name=="deploy" and .status=="completed")' >/dev/null && break
  sleep 60
done
echo "$JOBS" | jq -r '.[] | select(.conclusion=="failure" or .conclusion=="cancelled" or .name=="deploy") | "\(.id) \(.name) \(.status) \(.conclusion)"'
```

Run it from your worktree (`gh` needs a repository around it; outside one the
loop would wait for ever). If your tool cannot hold a command for that long,
run the loop in the background and read its output. Never ask faster than once
a minute.

- **`deploy completed success`:** go to step 8.
- **A job failed.** Read its log (the number is the first column above), fix
  forward, and do not retry blind:

  ```sh
  gh api --allow-escape-sequences repos/johnmorrisdotca/itsutsu/actions/jobs/<job id>/logs | perl -pe 's/\e\[[0-9;]*m//g' > $SCRATCH/job.log
  grep -n -E "[0-9]+\) \[chromium\]|[0-9]+ failed|Error:|error TS|FAIL" $SCRATCH/job.log | head -40
  ```

  A real failure gets a new ticket (step 1), a new worktree (step 2), the fix
  and a `--patch` release, and the chain again: never a force-push, never a
  revert pushed over a running deploy. `gh run rerun $RUN --failed` is for a
  failure that is not yours: a spec in a file you did not touch that failed on a
  timeout or a network error, never an assertion about what you changed. Rerun
  once; a second red is real. A rerun repeats only the failed jobs, and a push
  repeats everything.
- **`deploy` failed with `api-deployments-free-per-day`:** the whole Vercel team
  is allowed 100 deployments a day. The refusal costs nothing and names its
  reset time. After that time, `gh run rerun $RUN --failed`, never a new commit.
  While the cap is spent, push nothing, and after it push a change with no
  migration before one that has one.
- **Cancelled** with no failed job: a newer push replaced this run (or a job
  hit its 30 minute limit, which also reads `cancelled`). Find the run for
  your commit again; do not push over it.

[A Killed Job Reports As Cancelled, Fewer Pushes]

### 8. Check it is live

`deploy completed success` means `vercel deploy --prod` finished. Check what
production is serving with ONE call that asks Vercel's API, not the site:

```sh
npx -y vercel@latest ls itsutsu --prod --scope spxis-projects-0d6306b4 --json --limit 1 2>/dev/null | jq -r '.deployments[0] | "\(.state) \(.meta.githubCommitSha)"'
```

It must print `READY` and the `$SHA` you pushed; the version is `jq -r .version
package.json` at that commit. A different sha means the `deploy` job has not
finished: go back to step 7. Do NOT read the version by loading `itsutsu.com`:
Vercel Bot Protection answers a plain `curl` with a 429 challenge since
2026-10-07, so it cannot tell you, and one page load is real server time on a
shared account. One call, never a loop, nothing faster than once a minute.
Then tidy up: stop your server by process id, `docker rm -f its-<branch>-db`,
and `git worktree remove .claude/worktrees/<branch>` once the branch has
landed. Tell John the version, the sha and the ticket. If you changed
production data or a migration, say so first.

### 9. A migration or a production data write

- **Rehearse on your own database** from step 2, with BOTH variables set
  inline: `DATABASE_URL=… DIRECT_URL=… pnpm db:migrate --name <what>`, then the
  same two variables on `pnpm db:drift:check`, which must print "This is an
  empty migration." Update `docs/DATA_MODEL.md`. Never apply an unmerged
  migration to the shared database on 55434, never pass the real database as a
  shadow database, and if `prisma migrate dev` offers to reset, the answer is no.
- **Additive only.** The deploy applies migrations before the new code is live,
  so the old code must keep working. Never drop or replace an index, column or
  constraint the live code reads in the same push; add the new one, and drop
  the old in a later push. Name any index over 63 characters yourself.
- **The deploy job applies it** (`prisma migrate deploy`); nobody runs migrate
  against production by hand. Before the push that carries a migration, and
  before ANY read or write of production data, John says yes in this
  conversation, and you say what you are about to run and against which
  database. A relayed "John said yes" is not a yes. Then, with `$DIR` a folder
  outside the repository:

  ```sh
  neonctl branches create --project-id calm-boat-93104880 --org-id org-old-wave-97887412 --name before-<what>-<yyyy-mm-dd>
  neonctl branches list --project-id calm-boat-93104880 --org-id org-old-wave-97887412
  URL=$(neonctl connection-string main --project-id calm-boat-93104880 --org-id org-old-wave-97887412)
  docker run --rm -v "$DIR":/out postgres:18-alpine pg_dump "$URL" -Fc --no-owner --no-privileges -f /out/itsutsu-<yyyymmdd>-<hhmmss>.dump
  cd /Users/john/Projects/umakuma && NAS_BACKUP_DIR=/volume2/docker/staging/itsutsu/backups pnpm db:backup:archive "$DIR"
  ```

  Delete the oldest `before-*` branch (`neonctl branches delete <name>` with the
  same two ids) so about three remain. `$URL` is used in that one command and
  never printed or saved. [Back It Up Before You Migrate It]

### 10. Never

- **No AI attribution anywhere**: no `Co-Authored-By` trailer, no "Generated
  with" line, no session link, no "Requested by", in a commit, pull request,
  ticket, release note, doc or code comment. Commits are John Morris's.
- **No pull request, issue, comment, email, Slack or Linear message, and no
  reviewer added, without John's word for that specific action.** Reading a
  tracker is fine; writing to one is not.
- **No push to `main` unless you are the landing session**, and no push past a
  red gate: no `;`, no pipe, no `--no-verify`, no force-push, no `--force`.
- **No `git add -A` or `git add .`**; no `git stash` or `git stash pop`; no
  `pkill` or `killall`; no scratch file inside the repository; never print,
  paste or commit a secret, a token or a connection string.
- **No deploying by hand**: no `vercel deploy`, no `--prebuilt` from the Mac
  (it ships the wrong Prisma engine and every database route answers 500), no
  `vercel env pull` (Sensitive variables pull as a placeholder), no `vercel
  remove`. Only a push to `main` deploys, and the workflow keeps the live
  deployment and the one before it.
- **No loading the live site to find out anything**: not in a loop, not for the
  version, not to "see if it is up". The checks are steps 7 and 8.
- **No polling or timer under about 15 seconds**, no work repeated per request,
  nothing that wakes the database on a schedule, no bulk play through the
  site's API (`pnpm bots:play` runs in process on your machine).
- **No money without John's yes**: no new paid service, plan, add-on, storage
  tier, larger runner, private repository running a workflow, or extra Neon
  branches beyond about three `before-*`. Every project shares one Vercel
  account with 100 deployments a day.
- **No production database access** without step 9's yes, and no `prisma
  migrate reset` on any database other people use.
- **No editing what a command writes**: `CHANGELOG.md`, the version in
  `package.json`, `jaText.generated.json.br`, `src/lib/packed/*.json.br`, the
  `docs/japanese-review*.md` sheets, the art stamps, the function-size baseline.
- **No changing `src/proxy.ts`'s decisions.** A change there only runs after
  the gate has already said yes.
- **No loosening a gate to get past it**: no new allowance, no shortened
  pending list, no trimmed comment, no deleted or skipped test, no `toHaveCount(0)`
  asserted before something that IS on the page has been waited for. Read what
  the gate is objecting to.
- **No guessing a board key**, and no work for which there is no row.
<!-- procedures:end -->

## Getting started

You need Node.js 24 (`.nvmrc`), pnpm 10 (never npm or yarn) and Docker for the
local database.

```bash
cp .env.example .env      # before installing: the Prisma client records it
pnpm install
pnpm local:db:up          # disposable Postgres in Docker, port 55434
pnpm db:deploy            # apply migrations
pnpm dev                  # http://localhost:6700
```

`WEB_PORT` overrides the port. `pnpm local:db:reset` throws the database away
and rebuilds it from the migrations. This is the single-person set-up; an agent
or a second checkout follows the checklist above, which gives each worktree its
own port and database. In a git worktree especially, copy `.env`
in before `pnpm install`: the install generates the Prisma client, and a client
generated before `.env` existed may never load it (`pnpm db:generate` fixes it
afterwards).

The variables that matter first, all described in `.env.example`:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | Postgres: pooled for the app, direct for migrations. The example points both at the local container |
| `AUTH_SECRET` | Signs sessions, embed tokens and the stop links in member emails, at least 16 characters. Without it the gate stays open in development and refuses everything in production |
| `ADMIN_EMAILS` | The operator's addresses. Locally, end the list with `operator@example.test`, which the browser suite signs in as |
| `ADMIN_TOKEN` | Lets local tooling and the browser suite act as the operator without Google |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_URL` | Google sign-in |
| `RATE_LIMIT_RELIEF` | `20` for the browser suite, which drives the site from one address. Ignored in production |
| `SUMILABU_BOARD_URL` and the `*_DEV_TOKEN`s | The shared features board and settings store, on the development project |

## What it does

### Forty-five games and three puzzles, in eight families

The site began as one game and is now forty-five board games and three puzzles,
grouped into eight families on `/games` (`GAME_FAMILIES` in
`src/lib/gomoku/families.ts`):

| Family | Games |
| --- | --- |
| Five in a row | 7 |
| Drops | 8 |
| Turn and take | 8 |
| Strange boards | 8 |
| Checkers | 6 |
| Territory and races | 4 |
| Small boards | 6 |
| Numbers | 3 |
| Logic puzzles | 3 |
| Cards | 8 |
| Table cards | 7 |
| Tiles | 3 |

No family shows more than eight games — a gate in `variants.coverage.test.ts`
holds that — and a game may also be listed on a second family's shelf for
discovery (`ALSO_LISTED_IN`), while it belongs to one. Party games is mostly a
shelf of such guests — games a group plays round one device, at
`/games/party` — with the party games of its own at home in it: Dots and
Boxes for two to six (`/games/dots-and-boxes`), Mancala for two, by Kalah's
or Oware's rules (`/games/mancala`), and Tenka, world conquest for two to six
on the classic world map or Europe (`/games/tenka`), a third kind of game
(`PartyKind`, `src/lib/party/`, see `docs/plans/party-games/README.md`). The
guests include Chinese Checkers for two, three, four or six
players passed round one phone (`/games/chinese-checkers/pass-and-play`),
Pair Go, Go for two teams of two taking turns (`/games/go/pass-and-play`),
and Block Five for four, each laying twenty-one shapes out from their own
corner of a twenty-square board, touching their own only corner to corner
(`/games/block-five/pass-and-play`). Halma for four, or two, racing corner to
corner (`/games/halma/pass-and-play`), is offered from Halma's own page. Each is
kept in the browser, never rated (`src/lib/gomoku/party/`; the two
races share `partyRace.ts`). Which shelves a game is shown on besides its home
is `src/lib/gomoku/familyShelves.ts`. The **Games** button
opens a browser over the board with each rule set spelled out, and picking one
starts a new game with those rules.

Every board game is a row in `VARIANT_SPECS` that the same engine plays; none
of them is a special case in the code. The tables below group them by how they
play, which is not quite how the families group them: the capture games sit
with the flips, and the toroidal, obstacle, twist and piece games sit on the
strange boards. The Numbers family is different in kind — see "Puzzles" below.

#### Puzzles

A puzzle is for one person: a grid, a few givens, and exactly one answer. It
is not a variant — the engine cannot play it, nobody is rated at it and no
`Game` row is written — but a kind of its own (`PuzzleKind`,
`src/lib/puzzles/`) catalogued beside the games through `GameKey`
(`src/lib/catalogue/gameKeys.ts`), with the same address shape
(`/games/number-place`, its `/rules`, `/family`, `/new` and `/play`) and the
same gates: `puzzles.coverage.test.ts` asks a puzzle what
`variants.coverage.test.ts` asks a game.

Everything that thinks runs in the browser. The generators, the uniqueness
checks and the difficulty ratings are ours: the six Numbers puzzles (Sudoku,
Jigsaw, Diagonal, Killer, Futoshiki and Skyscrapers) are Kazu 数, our own
open-source package (`@johnmorrisdotca/kazu`, reached through
`src/lib/puzzles/kazu.ts`; Futoshiki adds givens until it is a puzzle and then
takes away every one it does not need), and the rest are here (`hiddenStones/`,
`blackAndWhite/`, `bridges/`, `pictureLogic/`; Hidden Stones grows its regions
out from a placed answer and then tightens the grid until the solver counts
one), seeded so the same number makes the same grid in every browser,
and the solve page makes its puzzle after it has loaded (`ssr: false`). The
one thing the server does is `POST /api/puzzles/solved`: an O(cells) check
that a member's finished grid is a solution (`puzzleCheck.ts`), and the XP
writes a finished game makes — `puzzleSolved` (25, six a day) and the tour's
first-of-this-puzzle and first-of-the-family, so the eighth family can be
met. Nothing polls and nothing is timed on a server.

| Puzzle | Our version of | Sizes | Levels |
| --- | --- | --- | --- |
Names are the ones players search for, the kanji ours (数独 is Nikoli's mark
in Japan, so the Japanese name is ナンプレ); addresses kept their first slugs
(`/games/number-place`, `/games/more-or-less`, …) so links already sent work.

| Puzzle | Our version of | Sizes | Levels |
| --- | --- | --- | --- |
| **Sudoku** ナンプレ | Howard Garns's Number Place (1979), named Sudoku by Nikoli | 4×4, 6×6, 9×9, the 16×16 Giant and the 25×25 Colossus (1–9 then A–P) | easy, medium, hard, by what the solver needs: singles only, one guess, more |
| **Jigsaw Sudoku** 変形ナンプレ | Sudoku with irregular regions for boxes | 5×5, 6×6, 7×7, 9×9 | easy, medium, hard |
| **Diagonal Sudoku** 対角ナンプレ | Sudoku X: the two long diagonals count too | 6×6, 9×9 | easy, medium, hard |
| **Killer Sudoku** サムナンプレ | dashed cages with sums, next to nothing printed | 6×6, 9×9 | easy, medium, hard |
| **Futoshiki** 不等式 | a Latin square with more-than marks between cells; every given and mark is needed | 4×4 to 7×7 | easy, medium, hard, as Sudoku |
| **Skyscrapers** 摩天楼 | clues around the edge count the towers seen | 4×4 to 7×7 | graded by what a person sees at a glance |

**Logic puzzles** 理詰め (2026-09-28) is the shelf for grid puzzles that are not
a Number Place, opened with **Bridges** 橋 (`src/lib/puzzles/bridges/`): our
version of the island-and-bridge puzzle Nikoli first printed in 1990, under a
name of our own. Islands at 7×7, 9×9, 11×11 and 13×13, and 17×17, 21×21 and
25×25 on a second shelf of the set-up, are grown from an
answer and kept only when the solver finds that answer and no other (the big
boards are grown with longer runs and a level's own share of double bridges,
because grown like the small ones one layout in three hundred and seventy-five
at 25×25 has one answer); easy
yields to counting, medium needs the joining rule (no group of islands may be
closed off), hard needs a bridge tried. The answer and a run kept half way are
one drawing, a character a cell (`- = | H` for the bridges), which the server
checks in O(cells) without the solver (`bridges/check.ts`).

The second is **Picture logic** 絵解き (`src/lib/puzzles/pictureLogic/`), our
version of the grid picture puzzle known in English as the nonogram, under a
name of our own (several of its names are trademarks). A picture is drawn
from a seed out of whole shapes — a mirrored figure, hills under a sun, or a
heaped cloud — and its row and column clues are kept only when a solver that
never guesses finishes them, which proves the picture is the one answer; easy
yields to sliding each line's runs to its ends, medium needs a whole line read
at once, hard needs one square tried and followed. 5×5, 10×10, 15×15 and
20×20, then 40×40 and 50×50 on a second shelf of the set-up (easy and medium
only: every line of them is read without a guess, a trial round over thousands
of squares being too slow for a browser). A big board is a scene of four
pictures, one to a quarter, so that its hundred lines have clues worth
reading; it opens zoomed, and its clues stay at the top and left of its box as
it is moved. The givens are the two panels of clues (a run is one base-62
character, so a line of fifty has a place for its 50) and the answer is the
picture, checked in O(cells) against the clues (`pictureLogic/check.ts`).

The third is **Suido** 水道 (2026-10-01, `src/lib/puzzles/suido/`), our version
of the pipe-turning puzzle known as Net or NetWalk: a square of pipe pieces that
can only be turned, a pump, and water drawn flowing along the pipes as they
join. The boards, their one answer, the check and the drawing are
**Suido**, an open-source package at github.com/johnmorrisdotca/suido
(`@johnmorrisdotca/suido`, pinned in `package.json`); what is the site's own is
here: a level is a target for the package's rank among boards of the same size
(easy 20, medium 50, hard 80), the board and its answer are the package's own
code (a drains board's spare pieces written as dealt, so one board has one
answer), and drains or network is kept in the seed (`NETWORK_SEED_BLOCK`),
as a Futago's is. 5×5, 7×7, 9×9 and 12×12; the answer and a run kept half way are
the board as it stands, which the server checks in O(cells) with the package's
`checkSuidoAnswer` (`suido/check.ts`).

Suido has FIXED LEVELS (2026-10-01) beside the boards it makes, as Tsunagi does:
256 at each of thirteen sizes, 5×5 to 14×14 and three long boards, 5×7, 6×10 and
8×14, easy to hard, the same board for everybody, in blocks of sixteen that open
as the one before is solved. They are the package's own (`@johnmorrisdotca/suido`
1.1.0, each size a file fetched only when asked for) and come with twists, each
named in a chip under the board: several pumps, locked pieces (a padlock; they
will not turn), walls, edges that join (a dashed rim), a single path from an
inlet to an outlet, and drains. The set-up (`/games/suido/new`) opens on the
levels and "Make a board" (`?mode=make`) is the set-up it was. A level is a
seed in a block of its own (`SUIDO_LEVEL_SEED_BLOCK`, `suido/seed.ts`), so every
run, solve, race and address that carries a seed carries the level, and a solve
is found by its board, never its number (`server/suidoRecords.ts`). A size is one
whole number: a square's side, or for a long board its width and height in two
digits each, 507 being 5×7 (`suido/sizes.ts`). A level has no hint and no clock,
so its fastest times are one race run apart. Tsunagi's level screens and Suido's
are the same components (`LevelPicker`, `LevelChips`, `LevelFastestTable`,
`useSizeShelves`); what is each game's own is how a solved level is marked, and
its words. Suido has a second set of levels beside them (2026-10-06, package 1.5.0),
chosen with a pair of chips on the set-up as Tsunagi's Classic and Portals are:
**Big pieces**, sixty-four levels with 2×2 big pieces among the ordinary ones, easy
to hard across every size from 5×5 to 20×20 in four blocks of sixteen, numbered
across the sizes and named by a seed in the second half of the level block
(`suidoSetOfSeed`). The rules page draws a guide to every piece with the package's own
pictures (`SuidoPieceGuide`, plan in `docs/plans/suido/README.md`).

**Pencil puzzles** 鉛筆 (2026-10-05, `src/lib/puzzles/pencil/`, plan in
`docs/plans/pencil/README.md`): Shikaku, Akari, Loop, Hitori, Cross Sums and Regions (known elsewhere as Slitherlink, Kakuro and Fillomino), from Kazu 1.3.0 (`@johnmorrisdotca/kazu`, pinned in `package.json`), on a shelf
of their own, each at four levels, easy to extra hard (the site's first extra hard) and at four sizes. Kazu makes each board with exactly one answer, checks a finished one and
draws it as SVG; what is the site's own is here: a board is a string of marks, a
character a cell, so a kept run, the scrubber and the
finished page work as they do for a Number Place, and a press on the drawing is read
from where it lands (`pencil/geometry.ts`). Seven games in all with Jirai: Shikaku, Akari, Loop, Hitori, Cross Sums and Regions. The server's one job is the O(cells) check
(`pencil/*.ts`, `puzzleCheck.ts`). **Jirai** 地雷 (`@johnmorrisdotca/jirai`, `src/lib/puzzles/jirai/`) is
its fourth card: Minesweeper that needs no guess, its neighbours and shape settings of the one card.

**Meikyuu** 迷宮 (2026-10-02, `src/lib/puzzles/meikyuu/`, plan in
`docs/plans/meikyuu/README.md`): a maze to draw a line through with a finger or the
mouse, from its start to its goal, in 1,024 fixed levels, 256 to each of four sizes (small,
medium, large, huge) and every shape from squares to a heart, and 1,536 tall ones (six sizes of 256, two columns to three rows) for a phone held upright, which lie on their side on a wide screen. The mazes, their
rules and the playable board are **Meikyuu**, an open-source package
(`@johnmorrisdotca/meikyuu`, pinned in `package.json`), fetched in the browser
only; what is the site's own is here: a level is its place in its size, the seed
is that number, the answer is the line as one character a step (`meikyuu/steps.ts`)
which the server walks on the maze (`meikyuu/check.ts`), and a half-drawn run is
drawn again on the board as a finger draws it. It sits in Numbers, the shelf with
room (Logic puzzles is full). Its level screens are Suido's and Tsunagi's
(`LevelPicker`, `LevelChips`, `LevelFastestTable`), with no locks and no hint.

**Tobiishi** 飛び石 (2026-10-05, `src/lib/puzzles/tobiishi/`, plan in
`docs/plans/tobiishi/README.md`): peg solitaire, in 81 named levels: nine boards (the
English cross, a triangle, the European board, a diamond, a heart, a star, a hexagon,
a wide and a tall rectangle), three goal holes on each, at three lengths (the jumps in
the shortest way: 3, 6 or 9). The engine, the boards and the named challenges are
**Tobiishi**, an open-source package (`@johnmorrisdotca/tobiishi`, pinned in
`package.json`); what is the site's own is here: a length is the puzzle's size, a level
is its place in the length, the seed is that number, the givens are the level's name
(`english:centre:3`), the answer is the run of jumps at four characters a jump
(`tobiishi/way.ts`), and the server replays it on the level's own board and accepts any
legal run that leaves one peg in the goal (`tobiishi/check.ts`). The board is drawn by
the package and played by a tap, a drag or the keyboard (`TobiishiBoard`). It is at home
in Numbers and is shown on the Small boards shelf as a guest (`ALSO_LISTED_IN`); its
level screens are Meikyuu's, with no locks and no hint.

Tsunagi 繋ぎ, our Numberlink (`src/lib/puzzles/tsunagi/`, the levels and rules
**Tsunagi**, an open-source package, `@johnmorrisdotca/tsunagi` 1.6.0), has
fifteen sizes, 4×4 to 15×15 and then 20×20, 25×25 and 30×30, shown four tiles at a
time (the last shelf is moved back so it is full: 15, 20, 25, 30). 256 levels at each of
5×5 to 9×9, 192 at 4×4, 128 at 10×10 and at 12×12 to 15×15, 64 at 11×11 and at the three
biggest, in blocks of sixteen. 13×13 to 15×15 arrived with 1.2.0 (2026-10-01): a board of
at most sixteen lines, proved to have one answer by a solver that learns from
its dead ends, and played on a phone with the zoom pad that starts at 10×10. The three
biggest (1.5.0, 2026-10-05) have 20 to 80 lines, are made by taking clues away, and are
looked at through the same box: its pad, the wheel, the edge nudge as a line is dragged near it,
and two fingers pinching and dragging (`TsunagiViewport`); a finger moving through a cell redraws
the cells that changed and each pair's own line, and nothing else (`TsunagiGrid`).
A second set of **levels with portals** sits beside the first (5×5 to 10×10, 12×12 and
15×15, thirty-two each, chosen by "Portals" in the set-up's options): a portal is two rings
alike, and a line that goes into one comes out of the other going the same way. A record
keeps a level by one number, its seed, so a portal level's seed is 1,000 and its number
(`levelSeed`, `setOfSeed`), and every page that shows a level shows its number in its set
(`fixedLevelName`). Each size's levels are a file a browser fetches only when a board of that size
opens; a server reads only their boards, never the answers (the package's
`layouts` entry, `tsunagi/layoutsModule.ts`), to name which level a kept solve was
and to check a solve against the level it names: with the three biggest sizes the answers
would have been 0.3 MB more in every page's function. A unit test or a spec that plays a
level reads the whole of it through `tsunagi/levelsModule.ts`.

The fourth is **Hidden Stones** 隠し石 (`src/lib/puzzles/hiddenStones/`), which
moved here from Numbers on 2026-10-01 because there is no number in it: the
one-star form of Star Battle, played daily as Queens (LinkedIn's name), one
black stone in every row, column and region, no two touching. 5×5, 7×7, 9×9
and 10×10 (made at 6×6 and 8×8 too, not offered); easy yields to reasoning
alone, hard needs a stone tried.

The fifth is **Black and White** 白黒 (`src/lib/puzzles/blackAndWhite/`),
moved from Numbers the same day for the same reason: our version of Takuzu /
Binairo, half of each colour in every line, never three alike, no line
repeated. 6×6, 8×8, 10×10 and 12×12, graded by what a person sees at a
glance.

**Cards** 札 (2026-09-29) is the shelf for games played with the site's own
deck (Toranpu's, below, and `src/components/cards/`: faces and backs drawn by us,
the backs tiled with the Itsutsu stones), opened with **Solitaire** ソリティア
(its rules from Toranpu's `klondike` entry, its deals and check in
`src/lib/puzzles/solitaire/`): Klondike, turning one card or three, as often
through the stock as you like, three times or once. A deal is the shuffle of its
seed; a winnable deal is the first from its seed that our solver wins in a fixed
number of tables, and any deal is dealt as it falls. The answer and a run kept
half way are the moves, two characters a carry, which the server replays from
the deal (`solitaire/check.ts`). Why it is a puzzle kind and not a new one is in
`docs/plans/cards/README.md`. Beside it, the family card games — **Crazy
Eights** クレイジーエイト, **Go Fish** 魚釣り, **Big Two** 大老二 and **President**
大富豪, and **Gin Rummy** ジンラミー for two — are party games (`src/lib/cardGames/`), one table for all of them round
one device (`src/components/party/cards/`), a computer in any empty seat and
every hand kept hidden between people; see `docs/plans/family-cards/README.md`.
The deck and every card game's rules and computer player are **Toranpu**
トランプ, an open-source package at github.com/johnmorrisdotca/toranpu; the
site installs it from that repository's release tarball (`package.json` names
the version) and imports it by name (`@johnmorrisdotca/toranpu`), and `src/lib/cards/` and
`src/lib/cardGames/` forward to it, keeping the site's own copy, shelf order and
party-table typing.
**Table cards** 場札 (2026-10-01) holds the rest of the table's card games,
split off Cards so neither shelf passes eight games: the trick-taking ones,
**Hearts** ハーツ, **Spades** スペード, **Euchre** ユーカー and **Oh Hell** オーヘル,
with **Cribbage** クリベッジ, **War** 戦争 (the one card game with no choice in it)
and **Hitotsu** 一つ, the match-the-colour game with a deck of its own, beside
them. It replaced Tricks (2026-09-30) and Colour cards (2026-09-30), which are
`FAMILY_ABSORBED` into it; it is at `/games/table-cards`.

**Tiles** 牌 existed for one day (2026-10-01) as the shelf for the games played
with tiles, and was dissolved the same day: Mahjong Solitaire and the cube are
in Logic puzzles, **Mexican Train** 列車 (dominoes, two to eight round one
device, `docs/plans/dominoes/README.md`) in Party games. `tiles`, `mahjong`
and `cubes` are `FAMILY_ABSORBED` into `logic` and `dominoes` into `party`, so a
member paid a first game under any of those keys keeps it.

**Mahjong Solitaire** 牌合わせ (2026-09-29, `src/lib/puzzles/mahjong/`):
take matching pairs of free tiles off a stacked layout — Torii, Fuji, Castle,
the classic 144-tile Turtle, or the 288-tile Wall and 576-tile Palace of two
and four sets — alone against the clock, or two to four taking a
pair a turn round one device, with computers for empty seats. Every deal is
laid pair by pair in reverse, so it can be cleared; the answer and a kept run
are the moves, which the server plays through to check. The tiles are our own
Japanese-style SVG. See `docs/plans/mahjong/README.md`.

The **Cube** 立方体 (2026-09-30, `src/lib/puzzles/cube/`): the Rubik's Cube, 2×2 to 7×7 (the 6×6 and 7×7 on the set-up's second shelf), drawn in
CSS 3D by **Kyuubu** キューブ (`@johnmorrisdotca/kyuubu`), a framework-free package
with a thin React wrapper and its own repository (github.com/johnmorrisdotca/kyuubu).
The site installs it from a GitHub release's tarball, pinned in `package.json`;
a change to it is a commit and a new version there, then a one-line bump of that
address here. Drag a sticker to turn its
layer, drag around the cube to look, wheel over a sticker to turn its row
(Ctrl its column, Shift its face), or type the notation. A scramble is the
seed's random turns, fifteen seconds' look comes before the clock, and the
answer and a kept run are the turns, which the server makes again from the
scramble (`cube/check.ts`). Whole-cube turns are looks and are not counted.
A cube dealt fresh is seen scrambling as the look begins (its last ten turns
turn, quickly, the rest are made at once: Kyuubu's `scramble`), and a kept
solve's replay says the move it stands at, in large type and in words in the
reader's language (`moveName`), lists the moves as buttons that follow it and
take it anywhere (arrow keys, Home and End), and turns the layers as the
scrubber moves, going on and each undone going back, a long jump catching up on
its last few moves (`scrubPath`). Both are props, `animateScramble` and
`animate`, on unless a consumer turns them off, the way a word's replay's motion
is; a device that asks for less motion sees neither. A drag that begins on the
seam between two layers turns both, and so do two fingers on two neighbouring
layers (a wide turn, told to `onTurn` one layer after the other).
On a 2×2 or 3×3, **Show me how** gives the next step of the beginner's method
(Kyuubu's `solveSteps`) and turns it on request; a solve that used it is kept
as `guided` (`solveHelp.ts`): solved, no points, off the fastest tables. The
method is taught at `/learn/cube`, a stage at a time with a cube to practise
each on (`src/lib/learn/cubeMethod.ts`, `cubePractice.ts`).

**Word games** 言葉遊び (key `word-games`; Other until 2026-10-01, Solo games for
a day; `other` is `FAMILY_ABSORBED` into it) holds the games made of letters:
Gomoji, Kumimoji, Koushi and Superghost. Tsunagi went to Logic puzzles. It is kept
off the set-up screen for now: **Gomoji** 五文字, a hidden word of four, five or six letters
found on a board eight rows tall (eight or nine squares across), each guess
coloured letter by letter: easy gives eight guesses, medium seven and hard six
at every length, a kana word's free grey word being one of easy's and medium's
rows; a Futago's two words a row more and a Yotsugo's four three more; and
Strict at any level holds each guess to the letters already found
(`src/lib/puzzles/gomoji/layout.ts`). Head start, at easy only, greys as many
keys as the word is long before the first guess, none of them in the word,
for one help's points (`src/lib/puzzles/gomoji/headStart.ts`). Two other
ways to play one word, chosen on the set-up in every language but Pop culture:
**Nige** 逃げ, where no word is hidden until the guesses leave only one
(`src/lib/puzzles/gomoji/dodge.ts`), and **Sakasa** 逆さ, where every row must
be filled without typing the hidden word (`src/lib/puzzles/gomoji/backwards.ts`),
each in a seed block of its own with a daily game at every length. Its word
lists, and the rules every word game shares (marking a guess, scoring, kana
marks, romaji), are Kotoba's (`@johnmorrisdotca/kotoba`,
github.com/johnmorrisdotca/kotoba), each list an entry point of its own so a
page fetches only what it plays: English words from SCOWL; French and German
from real dictionaries, Lexique and LanguageTool's German dictionary, with
every hidden word also in Wiktionary and never an English borrowing; kana from
JMdict. The daily words' pools (`src/lib/puzzles/dailyWords/`) stay here: they
are the record of what each day served.
It is ONE game in the catalogue, with one card, one front door at
`/games/gomoji` and one rules page: its language (English, Français, Deutsch,
日本語 かな) and its word list (Everyday, or Pop culture in English) are chosen
on its set-up and carried in its addresses (`?language=french`, `?list=pop`),
as a language or a word list is a setting of a game, never a game of its own
(`src/lib/catalogue/gameSettings.ts`). Underneath, each is still the kind it
was stored as — `gomoji`, `gomojiMot`, `gomojiWort`, `gomojiKana`,
`gomojiPop` — with its own runs, solves, fastest times and days' words, and
the four front doors they had until 2026-09-28 lead on for good to the same
page under `/games/gomoji` (`src/lib/catalogue/formerAddresses.ts`).
Its **Pop culture** list 五文字・流行 hides a pop-culture word of three to seven letters and
shows its category as the clue. Its answers are one list kept by hand
in Kotoba (`scripts/pop-corpus.txt` there);
any English word of the length may be guessed too, from SCOWL, with the
three- and seven-letter guesses in a file of their own fetched only when such
a puzzle is played (`src/lib/puzzles/gomoji/popWords.ts`). Its five lengths
are two shelves of four on its set-up screen (`shelves`, `sizesOffered`).
Beside them, **Kumimoji** 組文字, our own solo take on the anagram-grid race
games: a hand of seven or eleven letter tiles laid out as one crossword on a
table with no board, which grows and zooms to fit (`tableView.ts`) and turns
a quarter at a press of Turn with every tile kept upright (`turn.ts`), drawing
one more tile whenever the hand is used and the grid is sound, until the bag
is used: Short (forty or fifty tiles), Medium (half the set) or Full (all of
it), from one set or, in English, two (`kumimojiTileCount`). The bag is drawn
from the 144-tile letter mix (`TILE_MIX`), with a few wild tiles at Easy and
Medium, and laid out once as a crossword before it is dealt, so every game can
be finished; any SCOWL word of two to fifteen letters counts
(`scripts/tile-words.mjs`), and the list is fetched only when a game opens. In
Japanese the tiles are the 45 base hiragana (`JAPANESE_TILE_MIX`, `kana.ts`),
each playing as its voiced and small forms, and the words are JMdict's
(Kotoba's `scripts/word-lists-ja.mjs`). Help, chosen on the set-up screen, arranges the
hand into a word at a hint's price (`help.ts`). Diagonals, chosen there too,
reads every diagonal run of three or more tiles as a word as well, and lets a
diagonal word join the crossword (`runsOf`, `groupsOf` in `grid.ts`); it is
carried with the game everywhere its language is, and the generator lays the
proof crossword to the same rule.

Every Gomoji has a word a day at each length it offers, the same for everybody
and new at midnight UTC: "Today's 4", "Today's 5" and, in kana, "Today's 3", a
button each on its page and its set-up, and the past days at
`/games/<slug>/daily` (open to anybody; a day's fastest finds, at
`/daily/<day>`, are for members). A day's word is drawn from a frozen copy of
that length's answer list (`src/lib/puzzles/dailyWords/pool.*.data.ts`),
every word once in a shuffled cycle before any comes round again, and no word
twice inside a year across the seam between cycles. A pool is never edited, so
a later word list can never rewrite a day already played: a new length's pool,
or a newer list from a cycle yet to begin, is written by
`node scripts/daily-pools.ts`, and `dailyPools.test.ts` fails the build for a
length with no pool and for a pool that has changed.

Every finished puzzle a member solves is kept (`PuzzleSolve`), so a puzzle's
page shows the fastest solves at each size and level (`/standings`) and a
member their own (`/me`). Two members can race one grid (`PuzzleRace`, at
`/games/<slug>/match/<id>`): the host's browser makes the puzzle and posts it
whole, the guest takes the other seat by a link, each presses Start and the
site keeps both clocks from its own stamps, and the faster correct solve wins
`raceWon` (50 XP) on top of the solve. A seat started and not finished within
two hours reads as given up, decided when the race is read; nothing polls,
and the race page reads again when a browser comes back to it or presses
Refresh. See `docs/plans/numbers/NUM-05-race-a-friend.md` and
`docs/DATA_MODEL.md`.

A puzzle can be played on a countdown, chosen on its set-up: no clock (the
default), Tortoise 亀 5:00, Fox 狐 3:00 or Rabbit 兎 1:00
(`src/lib/puzzles/puzzleClock.ts`). It is the same clock read the other way
round, so it starts on the first entry and stops when the puzzle is paused;
it is in the address, the kept run and the kept solve, and each clock has
its own fastest table. At nought the puzzle ends unsolved and is kept as it
stood, paid `puzzleEnded` like a word whose guesses ran out. Tsunagi and
Kumimoji keep their own measures and offer none, and a race is never on one.

#### Lines of stones

The eleven the site started from. Each is five in a row with one thing
changed.

| Game | What changes | Inspired by |
| --- | --- | --- |
| **Gomoku** 五目並べ | Five or more wins. Choose who opens, or draw lots. Line length 4, 5 or 6. |  |
| **Tournament Gomoku** 競技五目 | Exactly five wins; an overline (長連) does not. Black opens. |  |
| **Renju** 連珠 | Black may not make a double three (三三), double four (四四) or overline. White may, and white's overline wins. Forbidden points are marked ✕ and cannot be played. |  |
| **Omok** 오목 | The double three is forbidden for both sides. Overlines win. |  |
| **Caro** Cờ ca-rô | Exactly five wins, and not if an enemy stone shuts it in at both ends. |  |
| **Ninuki-renju** 二抜き連珠 | Flank a pair of enemy stones to capture it. Five in a row wins, and so does capturing five pairs. |  |
| **Connect6** 六子棋 | Black opens with one stone, then two stones a turn. Six in a row wins. |  |
| **Sannuki-renju** 三抜き連珠 | Ninuki-renju where a flanked triple is captured as well as a pair. Fifteen stones win; so does five in a row. Our name for the pair-and-triple rule. | Keryo-Pente |
| **Misère Five** 逆五目 | Five in a row loses. A full board goes to the opener. |  |
| **Toroidal Five** 輪王五目 | Five in a row on a board with no edges: left joins right and top joins bottom, so a line may run off any side and continue from the far one. Every intersection is a centre one. |  |
| **Obstacle Five** 石場五目 | Five in a row across six dead squares nothing can use and two hotspots that count as either colour. Drawn from the game's seed, so both players see the same board. |  |
| **Scattered Rocks** 乱石五目 | Five in a row around twelve rocks and two hotspots, laid from the game's seed anywhere but the centre and there from the first move. 15×15 only. |  |
| **Rockfall** 落石五目 | Five in a row on an open board until the eighth stone, when twenty rocks and two hotspots fall onto every point still empty. A hotspot that would finish a line by itself is lost, so the fall never decides a game. 15×15 only. |  |

Each is a row of data in `VARIANT_SPECS` — the line rule per colour, the
shapes each colour is forbidden, whether stones capture, stones per turn, a
pinned line length, and which openings it offers. The engine reads the spec and
never switches on a variant's name, so adding a game is adding a row and its
copy.

**Renju's forbidden points need reading ahead.** A *three* only counts if the
point that would turn it into an open four is itself a legal move, which means
asking the same question one stone deeper. `src/lib/gomoku/rules/forbidden.ts`
does that recursion (bounded, erring towards forbidding), counts a straight
four as one four rather than two, and lets a five through even when the same
stone makes a forbidden shape. The analysis and the hints filter through it,
so black is never advised to play a point black may not play.

### Openings

An opening only shapes the first stones, to blunt black's first-move advantage.

| Opening | Rule |
| --- | --- |
| **Free** | Anywhere. |
| **Pro** / **Long Pro** | Black opens at tengen; black's second stone must leave the central 5×5 (7×7). |
| **Swap** | Player 1 places black, white, black; Player 2 picks a colour. |
| **Swap2** | As Swap, or Player 2 adds white and black and hands the choice back. The World Championship rule. |
| **RIF** | Renju's classic start: tengen, then inside the 3×3, then inside the 5×5, after which white may swap. |
| **Sakata** | The RIF start and swap; then the fifth stone must land inside the 7×7, and there is only one of it. |
| **Tarannikov** | The first five stones land inside the 1×1, 3×3, 5×5, 7×7 and 9×9 in turn; after each, the other seat may swap. |

Yamaguchi, Soosyrv-8 and Taraguchi-10, and the fifth-move pair in full RIF, all
rest on black offering several candidate fifth moves for white to prune. That
mechanism is not built yet; the strategy guide for renju describes each of them.

A swap opening pauses the game for a decision, and the decision is a timeline
entry like a move, so it can be taken back. A game's opening is stored with it
(`Game.opening`). Shared games between two devices may use the free, Pro or
Long Pro opening but not the swaps, because a seat token is a colour and a swap
would move the colour between devices.

#### Small boards, drops and twists

Games that are not gomoku, played by the same engine. Each pins its own board
size, and the settings it fixes are shown greyed rather than hidden, so the
rules stay visible.

| Game | What it is | Rules it pins | Inspired by |
| --- | --- | --- | --- |
| **Drop Four** 落とし四目 | Play anywhere in a column and the stone falls to the bottom, as if the board were upright and magnetic. Four wins. | 7×7 or 9×9, four in a row | Connect Four |
| **Twist Five** 回し五目 | Place a stone, then turn one of four 3×3 quadrants a quarter. Five anywhere wins after the turn; five for both is a draw. | 6×6, five | Pentago |
| **Twist Four** 回し四目 | The small twist game on four 2×2 quadrants. | 4×4, four | Pentago |
| **Trap Three** 罠三 | Four in a row wins; making exactly three of your own loses on the spot. | 5×5, four | Squava |
| **Square Four** 四角四目 | Four pieces each: place them, then slide one a step per turn. A line or a 2×2 square wins. | 5×5, four | Teeko |
| **Tic-tac-toe** 三目並べ | Three in a row. | 3×3, three |  |
| **Wild tic-tac-toe** 自由三目 | Place either colour; a line of either wins for whoever completes it. | 3×3, three |  |
| **Notakto** 黒三目 | Every stone is black; three in a row loses. | 3×3, three |  |
| **Maker and Breaker** 作り手と壊し手 | The mover places either colour. Black, the Maker, wins on any five of one colour; white, the Breaker, wins on a full board with none. Our name for the game published as Order and Chaos. | 6×6, five | Order and Chaos |

**Two games of our own**, with the same engine and a queue of pieces that
both players share:

| Game | What it is | Inspired by |
| --- | --- | --- |
| **Domino Five** 二連五目 | Gomoku where every piece is a domino of two stones, black-black, white-white or one of each. Both players draw the same random run and see the next three. Five wins for its colour whoever laid it, so a white-white domino in black's hand is a gift to the other side. Nothing fits, and the turn passes, on the record. |  |
| **Block Five** 積み五目 | The same with the seven four-square shapes, two black and two white each, rotated and flipped as you like, and six single stones of your own colour per player to fill gaps. As in a two-player falling-block match, both sides get the same sequence. | the seven tetromino shapes |

**The drop family** grows seven ways, each a row in the table with one flag
set, and each with a random element fixed by a seed stored with the game so a
replay reproduces it:

| Game | The one rule that changes | Inspired by |
| --- | --- | --- |
| **Ring Drop** 輪落とし | The left and right edges join, so a line may wrap. | Connect Four |
| **Hole Drop** 穴落とし | One random square is dead: stones fall past it and no line runs through it. | Connect Four |
| **Hot Drop** 熱点落とし | One random hotspot counts as either colour, and one hole counts as nothing. A stone counts only for its own side, so one dropped into the gap of the other side's line blocks it. | Connect Four |
| **Clear Drop** 消し落とし | A full bottom row disappears and everything drops a row, as in the falling-block game. | Connect Four |
| **Giveaway Drop** 譲り落とし | Making four loses. You may not play on top of the opponent's last stone while another column has room. A full board goes to the opener. | Connect Four |
| **Edge Drop** 縁寄せ | Gravity from all four edges: a stone must rest on an edge or against another stone. | Connect Four |
| **Wormhole Drop** 穴通し落とし | Two random squares are the mouths of a wormhole: a line that reaches one continues from the other. | Connect Four |

#### Games where no line is ever read

The flipping games, the races, Hex, checkers and Go: they keep the board and
the record and nothing else. Every one of them still returns a new `GameState`
from the same engine — what changes is what the engine is asked at the end of a
move.

| Game | What it is | Board |
| --- | --- | --- |
| **Reversi** リバーシ | Bracket a run of the other colour and it turns. Most discs at the end wins. Inspired by Othello. | 8×8 |
| **Classic Reversi** 古式リバーシ | The 1880s rule: the players lay the first four discs themselves, one a turn, before any flipping starts. | 8×8 |
| **Anti-Reversi** 逆リバーシ | Everything turns as usual, and the *fewer* discs wins. You may not decline a move that is there. | 8×8 |
| **Mini Reversi** 小リバーシ | The flipping game small, and it may grow mid-game if both agree: the position moves to the centre of the next size up. | 4×4, 6×6, 8×8 |
| **Grand Reversi** 大リバーシ | More middle to fight over before anyone reaches an edge. | 10×10 |
| **Honeycomb** 蜂の巣 | Reversi on a hexagon of hexagons: six ways to bracket a run, six corners that never turn. | hexagon of hexagons |
| **Halma** ハルマ | A race: step, or jump chains over any piece, and fill the far corner first. Nothing is ever captured. | 16×16, 10×10, 8×8 |
| **Chinese Checkers** ダイヤモンドゲーム | Ten pieces, a six-pointed star, and the point opposite yours to fill. Jumps chain and turn corners. | 17×17 star |
| **Hex** ヘックス | Join your own two sides with an unbroken chain. A full board always has exactly one winner, so there are no draws — which is why the swap opening is offered. | 11, 13, 19 |
| **Checkers** チェッカー | Jump the other side's pieces off the board. Capturing is forced, a man crowned partway through a chain stops there, and a king moves both ways. | 8×8 |
| **Russian Draughts** ロシアチェッカー | Flying kings on 8×8: men take backward, any capture may be chosen, and a man crowned mid-capture takes on as a king. | 8×8 |
| **Pool Checkers** プールチェッカー | American pool: men take backward, kings fly, and you choose which capture to make. | 8×8 |
| **Brazilian Draughts** ブラジルチェッカー | The international rules on the small board: men take backward, kings fly, and the longest capture is compulsory. | 8×8 |
| **International Draughts** 国際ドラフツ | Men take backward, kings fly, and you must take the most you can. The FMJD's game. | 10×10 |
| **Canadian Checkers** カナディアンチェッカー | The international rules on 144 squares, with thirty men a side. | 12×12 |
| **Go** 囲碁 | Surround more of the board than the other colour. Groups share liberties, the ko rule forbids instantly retaking, two passes end it, and White takes 6.5 komi so it can never be a tie. | 19×19, 13×13, 9×9 |

Six of those are the checkers family, and they differ only in rules, never in
aim: whether a man may capture backward, whether a king slides any distance,
and whether you must take the longest chain or may choose. Worth knowing that
**English checkers is the only one of the six that has been solved** — weakly,
by Schaeffer's team in 2007, and it is a draw. The same board and the same
twelve men under Brazilian rules is a different game, and open.

The games where pieces MOVE rather than land have no natural end — two kings
shuffling is a game neither player can be made to stop — so those carry a
no-progress rule of their own: checkers by the draughts count of forty moves
each without a capture or a man's move, the races by whether anybody has got
nearer home over a window of play. See `rules/noProgress.ts`.

Twists and slides are part of the record: a twist is stored on the stone it
finishes, a slide stores where the piece came from, and a replay reproduces
both. The threat reading is switched off for the twist and sliding games,
because a line-by-line reading of a board whose stones move says nothing true.

### Rules pages and the learning shelf

Every game has a rules page at `/games/<game>/rules` in one template — Object,
Board, Play, House rules — generated from the same spec the engine plays by,
so the page cannot drift from the rules. Each carries a screenshot of the
game in progress when one has been taken (`pnpm screenshots:games` writes
them into `public/art/games/`) and links to the strategy guides that apply.

`/learn` holds the guides: threats, shapes and tempo for the five-in-a-row
family; Renju's forbidden points and openings; captures; two stones a turn;
the drop family's parity; the twist games; the small games; and the piece
games; and the cube's beginner's method (`/learn/cube`). Written to be
learned from, with the Japanese terms where the literature uses them. Both sections are linked from the header.

`/dice` is the dice roller, a tab of Games: up to ten dice from a d4 to a
d100, tapped to roll, with the exact odds, a history kept in the browser and
stats. It is Korokoro (github.com/johnmorrisdotca/korokoro: MIT, no
dependencies, its own README and a GitHub Pages demo), an ordinary dependency
from npm, `@johnmorrisdotca/korokoro`, at the version in `package.json`. A
change to the roller is a release of that package and a version bump here.
**Dice War** 賽合戦 (2026-10-01) is its game, a party game at home in Party games
(`src/components/party/diceWar/`, rules in Korokoro's `diceWar.ts`):
two to eight round one device, a computer in any seat, everybody rolls and the
highest total scores, a tie is war; see `docs/plans/party-games/README.md`.

### Players, ratings and records

Two numbers sit beside a player's rating, and they are kept apart on purpose.
**XP** is experience: earned by taking part in anything, it never goes down
and it sets a player's level (`src/lib/xp/`). **IP, Itsutsu Points,** is
ability: won by results alone, in every game and every puzzle. A game pays IP
when it ends (`payGameIp`), priced by `gamePoints` as the most that game can
pay (Gomoku on 15×15 is 100, Go on 19×19 is 200) times the share its result
earns, and stored on the game's row. Every game's page, every family's page
and `/points` show an IP board, this month and all time (`ipBoards.ts`).
Games finished before IP are priced by `pnpm ip:backfill`, in process.

Ratings began as a record kept for a NAME, when a name was the only identity
the site had. They now hang off the member who claims the name
(`Player.memberId`), and an anonymous seat is never rated. Every finished rated
game between two named players updates both records and exchanges rating
points:

| Tier | When | K |
| --- | --- | --- |
| Unrated 未定 | fewer than four rated games | 40 |
| Provisional 仮 | four to nineteen | 40 |
| Established 確定 | twenty or more | 20 |

Elo, starting at 1600, with a favourite by more than 400 points gaining
nothing for a win. Each game also keeps a ladder of its own
(`PlayerVariantRating`), shown at `/games/<game>/standings`, and `/champions`
names who leads each one. `/players` has five tabs — members, buddies, the
ladder, the computer players and the remembered records — and
`/players/<name>` is one page per person, whoever they are.

**Two rating pools, kept apart on purpose.** A game against a computer player
is rated in a pool of its own, so beating a program never moves where you
stand among people. Both are shown; neither is averaged into the other.

**Records from before this site.** Some members played for years on
ItsYourTurn and GoldToken, and some people are here only as a record kept
under their name. Those are not a different kind of person — they are a
different SOURCE, and a player's page counts every source they have, with a
control to narrow it to Itsutsu alone. Games and wins add up across sites;
ratings never do, because no two sites share a scale, so there is no combined
rating and the page says why rather than leaving a blank. Figures copied from
another site are marked as the snapshots they are, in a list as well as on a
page: they were written down once and do not move.

Tournaments are not built yet.

### The computer players

Seventeen of them, and they are members rather than a setting on a game: they
hold seats, appear in the record, and carry a rating that moves when you beat
them. Five are graded — **разряд**, **級**, **段**, **名人** and **国手**,
gentlest to strongest — and will play anything on the site. Six are
specialists who play one game or family well, each named in homage to a real
champion of it: **為乃木秀正** at Reversi, **Andrus Meritalu** at five in a
row, **Howard Monkton** at Halma and Chinese Checkers, **Marion Tinsdale** at
checkers and draughts, **本堂秀策** at Go and **吳一辰** at Connect6. And six are
characters with faces and home towns, each playing at an existing grade in a
style of their own: Mina Park, Kenji Arakawa, Li Wenjing, Amara Okafor, Ingrid
Solheim and Rafa Duarte.

**They think in your browser, not on the server.** A computer's move is worked
out by a web worker on the device of whoever is waiting on it, with two seconds
to think (`BROWSER_MOVE_MILLIS`), where a paid server function would have had a
quarter of one. Measured, that is most of a grade of strength, and nobody is
billed for it. How strong each grade really is, game by game, is measured by
the grades playing each other (`ladder.match.test.ts`) and shown on the About
page and each game's page.

A computer answers a seat that has been sitting on the noticeboard longer than
a day, so a posted game gets played whether or not anybody else is about. It
waits first on purpose: a seat answered the instant it is posted is not a
noticeboard, it is a button with extra steps.

### The backlog

`/backlog` is where a request lives once the conversation that raised it is
over. Every feature asked for and every fault reported is a row: a title, the
longer telling, who asked, its kind (feature, fix or chore), a priority and an
effort once somebody has graded it, and where it stands — **open**,
**in progress** (a claim with a six-hour lease), **done**, or **dropped**
(considered and passed over, kept so the answer need not be given twice). The
operator writes to it from the page; agents write to it with `pnpm task`.

Which moves are allowed is a table, not a convention: a proposal cannot reach
done without having been built, and a dropped item comes back as a proposal
rather than as work. `src/lib/backlog/backlog.ts` holds that table and every
other decision, purely; the row's select is built from it, and the rows
themselves live on Sumilabu's board, which refuses anything the table rejects
whatever calls it. `backlog.coverage.test.ts` is the gate — see AGENTS.md,
"Board Gate".

The other half is `/releases`: **every release so far**, parsed from
`CHANGELOG.md` at request time rather than kept a second time, with the edition
being served marked. The operator's page carries a card with both
counts — what is still wanted, and the latest release — and a link into it.

### Notes, messages and deadlines

**Private notes** live under the record on the local board and beside a
shared game. They stay in the browser and are never sent anywhere.

**A message with an emoji.** In a shared game a short message can ride along
with a reaction. It reaches the other side on the next poll, floats over
their board with the emoji, and stays in the log.

**Deadlines with grace.** A shared game can carry a per-move limit, from five
minutes to a week, and a penalty for missing it. The graceful penalty
forfeits the turn: the waiting player may claim it, which records a pass and
hands the move back, or simply keep waiting, which is the "pass it back". Three
forfeits in a row lose the game. The strict penalty loses the game at once.
The server owns the clock: it stamps every move and refuses a claim made
early. Both settings are chosen when the game is started and can be changed
until the first stone.

**Email** goes through Resend, in production only. It sends two things today:
a request for an invite from `/join`, which reaches the site's owner, and a
member's invitation to a friend. Game notices (your move, game over) are
written and switched off (`NOTICES` in `src/lib/mail/mail.constants.ts`).
Every send passes one sender and caps counted in the database
(`EmailSendCount`): fifty a day and a thousand a month for the site, five a
day per member. See [`docs/email.md`](docs/email.md).

### Are you still there?

If nothing has moved for two minutes during a game with a clock, a modal dims
the page and pauses the clock until someone taps it. Listening costs nothing:
each pointer, key or touch event only writes the time into a ref, and a timer
compares it with the clock once a minute.

### Handicaps

A handicap gives one colour the rules of a harder game while the other plays
the plain one, so a stronger player can give a weaker one a fair fight. Every
toggle is a restriction some variant already imposes on a colour:

| Toggle | Borrowed from |
| --- | --- |
| No double three 三三禁 | Renju, Omok |
| No double four 四四禁 | Renju |
| No overline 長連禁 (six never wins, and may not be made) | Renju |
| Exactly five 五連限定 | Tournament Gomoku, Renju |
| Open line only 両端開放 | Caro |
| One more in a row 六連 | A traditional gomoku handicap |
| One stone a turn 一手一子 | Connect6 |
| No captures 取り無し | Ninuki-renju |
| Second stone outside the central 5×5 or 7×7 | Pro, Long Pro |

Under the hood every rule the engine consults — line rule, forbidden shapes,
captures, stones per turn, line length, opening exclusion — is read through one
function, `rulesFor(settings, colour)`, which lays the handicap over the
variant's spec for that colour. A handicap can only tighten, never loosen. It
belongs to a colour, so the openings and swaps that move colours between seats
are switched off while one is set.

### The review

When a game ends, a review (感想戦) appears beside the statistics. It replays
the game under every other rule set with the same shape of turn and line and
reports where they would have parted: a stone Renju or Omok would have
forbidden, a winning overline Tournament Gomoku would not have counted, a five Caro
would have called shut in, a pair Ninuki-renju would have captured, or a game
another rule set would already have ended. It also says whether the winner
gave the game away along the route and still won, and — for named players —
where the result sits in their run of recorded wins.

### The board

Nine, thirteen, fifteen or nineteen lines. The 9×9 mini board keeps five in a
row, so a game finishes in a few minutes rather than half an hour. In freestyle
you choose who opens — black, white, or a draw of the lots (振り駒); the formal
rule sets keep black on move one, so that control disables itself.

Star blocks (星塞ぎ) seal the hoshi points and leave tengen open, which turns
the middle of the board into a fight over one intersection.

<img src="docs/images/mini-board.jpg" alt="The 9x9 mini board with the star points sealed" width="760">

### It tells you what you are walking into

Awareness is a lens on the position, never a rule. Turning it off changes what
you are told and nothing about what is legal — the engine never reads it.

<img src="docs/images/danger-warning.jpg" alt="A warning that a threat must be answered" width="760">

There are two different warnings, and the difference matters:

| | When it fires | What it means |
| --- | --- | --- |
| **受 Answer this** | A threat is already on the board | Block it this move or lose |
| **予兆 Something is forming** | The opponent could *build* an open three next move | Nothing is forced yet |

The second is one ply earlier than the first, and it is **off by default**. It
hands the defender a move they would otherwise have had to see coming, so it is
opt-in — and when it is on, both players get it on the same terms.

**敗着 — the losing move.** When a game becomes unwinnable, the record marks the
move that threw it away. That is rarely the move that just landed: ignoring an
open three is the mistake, but nothing is unstoppable until the open four
arrives, by which point the *opponent* is moving. So the blunder is attributed
to the losing side's last stone.

The reading is shallow on purpose. It sees immediate wins, unanswerable fours,
and the combined threats that follow from them, but it does not search. So
`lost` is reserved for positions one stone genuinely cannot save. Everything
short of that says *answer this*, not *it is over*.

### Clocks, odds and how the game went

Byoyomi (秒読み), the way professional go and renju are played: a main time,
then a number of short periods. Finish a move inside a period and you get the
whole period back, so a player in byoyomi can play forever as long as every
move is quick enough.

<img src="docs/images/clock-and-odds.jpg" alt="Clocks, a chance-of-winning bar and the early warning" width="820">

| Preset | Main time | Byoyomi |
| --- | --- | --- |
| Blitz 早碁 | 3 min | 3 × 10s |
| Rapid 速碁 | 10 min | 3 × 30s |
| Classical 持ち時間 | 30 min | 5 × 60s |

The chance-of-winning bar is an estimate from threats and shape, and is
labelled as one. The engine does not search, so it is a feel for the position
rather than a fact about it.

Afterwards, what actually happened — including two narrow, countable mistake
measures: **threats ignored** (you moved while the position was already
forcing and did not answer) and **losing moves** (you made a win unstoppable).

<img src="docs/images/game-stats.jpg" alt="Per-player statistics after a game" width="820">

### Hints, gifts and asking for advice

The engine will name a best move, on an allowance you can also **give to your
opponent** — a gift of a hint being a rather better way to be generous than
taking a move back. Or ask your opponent directly: they mark the point they
would play, and you decide what to do about it.

### The board can change size, if both players agree

A game that has run out of room is not always a game that has run out of ideas,
so the board can step up to the next size — and a game that is dragging with an
unused outer ring can step down. The stones keep their positions relative to
each other; the centre stays the centre.

It is proposed and agreed to rather than done, because it changes the game both
players are in. Nobody loses a turn either way.

Two rules hold it together, and both come from the same place — a stored game
is its settings plus its moves, and it has to replay to the position it
produced:

- **resizing never passes the turn.** A resize places no stone, so nothing in
  the record marks it; changing whose turn it was would make a replay alternate
  colours differently from the game that was played.
- **shrinking asks the record, not the board.** A ring can look empty and still
  hold a captured stone's move, or the `from` of a piece that slid inwards.
  Either would replay as a stone placed outside the smaller board, so the check
  is over `state.moves` — including each move's `from` — and not over the
  stones currently standing.

Games with a board size of their own — tic-tac-toe, the twist games, Trap Three
— cannot resize out of it, and neither can a board with obstacles, since those
are derived from the size.

### It looks like a board

Five surfaces — kaya, shin-kaya, washi, sumi, matcha — and five stone sets.
A Reversi board is felt instead: green, blue, red or black, chosen on a row of
patches under the set-up screen's preview or under the board mid-game, or the
reader's own wood (`FELTS` in `src/components/board/Board.constants.ts`).

<p>
<img src="docs/images/theme-kaya.jpg" alt="Kaya" width="150">
<img src="docs/images/theme-shinkaya.jpg" alt="Shin-kaya" width="150">
<img src="docs/images/theme-washi.jpg" alt="Washi" width="150">
<img src="docs/images/theme-sumi.jpg" alt="Sumi" width="150">
<img src="docs/images/theme-matcha.jpg" alt="Matcha" width="150">
</p>

Coordinates and move numbers can be turned on, so a finished game reads like a
printed record.

<img src="docs/images/won-game.jpg" alt="A won game with the winning line marked and move numbers shown" width="820">

### Nothing is lost

A game in progress lives in local storage, so a refresh, a closed tab or a
flat battery all resume where you were — including the undo history. Every
finished game is filed in the record and can be replayed stone by stone.

<img src="docs/images/record.jpg" alt="The game record with filters and sorting" width="820">

## How it is put together

The rules live in Narabe 並べ, the engine, and nowhere else: `engine.ts` and
the `rules/` modules it delegates to, an open-source package of its own at
[github.com/johnmorrisdotca/narabe](https://github.com/johnmorrisdotca/narabe)
(MIT, no dependencies, its own README and a GitHub Pages demo that plays every
game). The site depends on `@johnmorrisdotca/narabe` at a released version, the
tarball its repository attaches to each release, and the modules at the old
paths under `src/lib/gomoku/` re-export it, so nothing in the site had to change its imports. Every function takes a `GameState` and returns
a new one, so the same engine runs the board in your browser, replays a stored
game, and validates moves on the server. There is no second implementation of
"who has won".

A variant is a row in `VARIANT_SPECS` plus its copy, and the engine reads the
spec rather than switching on a variant's name. That is what lets forty-five
games share one engine — and `variants.coverage.test.ts` fails the build for a
game that is missing its tests, its copy, its family or its screenshot, so a
new game cannot ship half-finished.

A stored game is **a move list, never a board**. A board and a move list can
disagree; a move list replayed through the engine cannot.

| Directory | What lives there |
| --- | --- |
| `src/lib/gomoku/` | Engine, threat analysis, win estimate, notation, replay. Pure, no React. |
| `@johnmorrisdotca/narabe` | Narabe, the engine and the variant rules it consults: lines, forbidden shapes, captures, turns, openings; a dependency at a released version. `src/lib/gomoku/rules/` re-exports it. |
| `src/lib/clock/` | Byoyomi clocks. Pure, and driven by the wall clock rather than tick counts. |
| `src/lib/history/` | Reading and writing game history. |
| `src/lib/backlog/` | The features board: its rules, its copy, its starter set. Pure, apart from `backlogStore.ts`. |
| `src/lib/rating/` | Elo, the two rating pools, and what a list prints beside a name. |
| `src/lib/bots/` | The computer players as members: who they are, the seats they take, the moves they play. |
| `src/lib/legacy/` | Records kept from the sites people played on before this one. |
| `src/lib/auth/` | Members, invite codes, sessions, and the operator's roster. |
| `src/lib/social/` | Buddies, ignores, who is here, countries and days off. |
| `src/lib/phrase/` | The four-word credential: picking, hashing, taking a seat with it. |
| `src/lib/xp/` | Experience points: awards, the ledger, levels, the boards. |
| `src/lib/mail/` | Email through Resend, behind caps kept in the database. |
| `src/lib/i18n/` | The phrase catalogue, in English and Japanese. |
| `src/lib/sumilabu/`, `src/lib/site/` | The shared features board and the site settings, both on Sumilabu. |
| `src/components/board/` | The board and its themes. |
| `src/components/game/` | The local game, its session, settings and record. |
| `src/components/live/` | Games played from two devices. |
| `src/app/api/` | The HTTP API. |
| `e2e/` | Playwright specs, including the screenshot spec. |

## The API

Every route validates its input with Zod at the boundary, is rate limited, and
answers typed JSON. Sorting and paging follow one convention
(`src/lib/api/paging.ts`): `sort=<column>[:asc|desc]`, `limit`, and an opaque
`cursor` from the previous page. An unknown sort column is a `400` that names
what is accepted, and an unrecordable game is a `422` listing what was wrong.

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/games` | List games: filters, sorting, facets. Answers `{ pagination, next, items, facets }`. |
| `POST` | `/api/games` | Record a finished game from one screen, with its moves. |
| `POST` | `/api/games/live` | Start a shared game. Returns a token per seat. |
| `GET` | `/api/games/mine` | The games this browser and this member hold a seat in. |
| `GET` | `/api/games/:id` | One game with every move. |
| `DELETE` | `/api/games/:id` | Remove a game. Operator only: `Authorization: Bearer $ADMIN_TOKEN`. |
| `GET` `POST` `DELETE` | `/api/games/:id/moves` | Read the moves, play one, or take one back (hot-seat games only). |
| `PUT` | `/api/games/:id/settings` | Change a shared game's rules before its first stone. |
| `POST` | `/api/games/:id/sit`, `.../sit-as` | Take the open seat; take your own seat on somebody else's device with your four words. |
| `POST` | `/api/games/:id/resign`, `.../cancel`, `.../timeout`, `.../time` | End a game, call it off, claim a missed deadline, or give the other side time. |
| `POST` | `/api/games/:id/offer/accept`, `.../decline`, `.../withdraw` | Answer or take back a game offered to a person. |
| `POST` | `/api/games/:id/reactions`, `.../applause`, `.../verdict`, `.../hide` | An emoji during play; appreciation, a private verdict or hiding it afterwards. |
| `GET` | `/api/players`, `/api/members`, `/api/ladder` | Name autocomplete, the members directory, a game's ladder. |
| `PATCH` | `/api/me` | Your profile and preferences. |
| `GET` `PUT` `DELETE` | `/api/me/phrase` | Your four words: whether you have them, set them, remove them. |
| `GET` `POST` `DELETE` | `/api/buddies`, `/api/ignores` | Your buddy and ignore lists. |
| `POST` | `/api/messages` | A direct message to another member. |
| `GET` `POST` `DELETE` | `/api/session` | Sign in with an invite code or as the operator; sign out. |
| `POST` | `/api/invites/mine` | Invite a friend: one use, thirty days. |
| `GET` `POST` | `/api/invites` | The operator's invite codes. |

`GET /api/games` filters by `search`, `player`, `member`, `against`, `result`,
`outcome`, `pool`, `rated`, `verdict`, `variant` (a game's slug), `size`,
`from` and `to`.

```bash
curl 'localhost:6700/api/games?search=aki&result=black&sort=moves:asc&limit=5'
```

## Getting in

Reading is open and playing is gated. A visitor with no invite can read the
games: `/games`, every game's page, its rules, family and background, `/about`,
`/learn` and the dice roller at `/dice`. Everything else — playing, the players, the ladders, the record —
needs a signed session cookie, enforced in `src/proxy.ts` before a route is
reached, so a new endpoint is private by default rather than private only if
someone remembers to guard it. A reader with no session is answered the open pages from a copy kept
for an hour (`src/lib/stranger/`), so a crawler's visit costs no render. A visitor who knows nobody here can ask for an
invite from `/join`; the request is emailed to the site's owner, behind caps
of its own so a script cannot spend the site's email (`inviteRequest.ts`).

There are two ways through the door at `/join`:

| | How | Lasts |
| --- | --- | --- |
| **Player** | A three-word invite code | 30 days |
| **Operator** | An address in `ADMIN_EMAILS`, plus `ADMIN_TOKEN` | 1 day |

Both exchange what was typed for an HMAC-signed cookie, so neither the phrase
nor the token is presented again or stored by the client. An operator address
signing in with Google gets the operator's cookie with no token at all; the
token is for local tooling and the browser suite. Set `AUTH_SECRET` to turn the
gate on. Without one it cannot verify anything: in development it stays open,
which is what makes local work bearable, and in production it answers 503
rather than open the site.

Two switches sit in front of all of that. Who may sign up (invite only, open,
or closed) and a notice on the join page are site settings, kept on Sumilabu
and changed from `/admin`, beside how often a live board asks for the other
side's move (three seconds while that player is on the site, fifteen
otherwise, by default). `SITE_MAINTENANCE=on` shows everybody but the
operator a 503 from the gate itself.

### Invite codes

The operator mints codes from `/admin` or `pnpm invite`, and a member can
invite a friend with a one-use code of their own. They are three ordinary
Japanese words — `natsu-yagura-fune` — chosen so a code can be read down a phone and
typed back correctly: no long vowels, no doubled consonants, no `n` before a
labial, all screened by a test. Capitals, spaces and hyphens all normalise to
the same code.

Three words from 260 is about 24 bits, far less than a random id, so the safety
is not in the phrase alone:

- the redeem endpoint allows five tries a minute per address;
- a code is revocable, and revoking beats expiry and use count alike;
- redeeming exchanges the phrase for a cookie, so the phrase stops being the
  credential the moment it is used.

Every rejection — unknown, revoked, expired, spent — answers identically, so a
guesser learns nothing from which one they hit.

### Rate limits

`src/lib/api/rateLimit.ts`, following UmaKuma. Writes are far tighter than
reads because a write costs a database row. The store is per-instance, so
limits are approximate under serverless fan-out; that is a deliberate trade
against needing Redis on the hot path.

## Who gets in

Google is the front door; an invite code is the side door. `signIn` in
`src/lib/auth/google.ts` admits any verified Google address — it proves
identity only — and `/api/session/google` then decides membership: an
`ADMIN_EMAILS` address gets the operator's cookie, a `Member` row gets a
member's cookie (name and picture included), and anyone else is sent back to
`/join`, where their Google identity waits for an invite code. Redeeming a code
while a Google identity is waiting creates the `Member` row: the first sign-in
is the registration, and from then on Google alone lets them in on any device.

A code redeemed with no Google identity waiting still makes a member, one with
no address. That member can add **four words** later (`src/lib/phrase/`): a
second credential, hashed like a password, picked by tapping words rather than
typing. It lets somebody sign in on a borrowed device, or take their own seat
at a game on somebody else's, by tapping their name and then their words.
Either credential may be added at any time; the last one may not be removed.
Sessions are one signed cookie either way (`src/lib/auth/session.ts`); signing
out clears it and Google's own cookies, so a shared phone asks again.

A member's seats are bound to their member id (`Game.blackMemberId` /
`whiteMemberId`) when they start, scan or sit at a game, so their games follow
the account; a phone with no session holds its seats by cookie.

## Games played from two devices

`POST /api/games/live` returns `blackToken` and `whiteToken`. **A seat token is
the seat**, whether or not anybody is signed in: whoever opens
`/games/:slug/match/:id/seat/<token>` plays that colour. That address claims
the seat into a cookie and sends the visitor on to the match at
`/games/:slug/match/:id`, so the credential is used once and never sits in the
address bar. The match without a claim is a spectator view, and it is never
shown the seat links.

`/games/:slug/match/:id/:move` is the position after that many moves, kept
current in the bar as play goes on, and the same address serves the game once
it is over — the address to send someone who should see that moment.
`/games/:slug/history` is that game's record, and `/games/:slug/me` is your
own games of it.

<img src="docs/images/shared-game.jpg" alt="A shared game showing a QR code for each seat" width="820">

Each seat gets a QR code and an `sms:` link, so a seat can be handed over
without any messaging infrastructure — no gateway, no stored phone numbers.

Every move is re-validated on the server: whose turn it is, whether the point
is free, whether the game is still running. The unique index on
`(gameId, number)` is the concurrency control, so two devices racing to play the
same move number cannot both succeed.

Seat pages carry `robots: noindex`, because a seat link is a credential.

### Your games

Nobody is stopped from clicking away from a game; instead `/play` lists the
seats this browser and this member hold, in the queue the turn-based sites taught:
**your move**, **their move**, **not started**, **lately finished**. A count of
games waiting on you sits beside "Play" in the header. "Yours" is decided by
the seat cookies on the request and the signed-in member's own seats and offers
(`GET /api/games/mine`).

A game may be posted **open**: its white seat goes on a noticeboard on the
games page (`openSeat`), and whoever answers first sits down
(`POST /api/games/:id/sit`, a conditional update so two takers cannot both
win). Whether a seat may **resign** is the host's choice (`allowResign`);
both options can be changed until the first stone.

A game with no move for `STALE_AFTER_DAYS` is flagged stale. Any seat holder
may resign a running game at any time (`POST /api/games/:id/resign`, seat
proved by token or cookie); the other colour wins, the record says
"by resignation", and the ratings move. Timed games additionally let the
waiting side claim a missed deadline.

### Reactions

Either player can send the other an emoji during the game: a cheer for a
move, a wince, a wave. The set is fixed, so nothing a stranger types is ever
shown to another player, and each one is tied to the move it answered.
Reactions ride along with the game on the same poll that carries moves, float
over the board for a few seconds, and stay in a small log underneath.
`POST /api/games/:id/reactions` takes a seat token and one of the listed
emoji, and is limited per seat.

### Inside a site that has its own sign-in

Seat tokens exist so a seat can be handed to somebody with no account. A host
that has its own should map its identities to seats and stop passing tokens in
the query string — `seatForToken` in `src/lib/history/liveGameRow.ts` is the
single place that decides which seat a request holds.

## Embedding the board

Use an iframe against `/embed`. It isolates CSS, JavaScript and React versions
completely, needs no shared build, and nothing the host sends can change the
rules.

<img src="docs/images/embed.jpg" alt="The embeddable board" width="320" align="right">

```html
<iframe src="https://your-host/embed?size=9&theme=sumi&stones=neon"
        style="border:0;width:100%;height:640px" title="Gomoku"></iframe>
```

Parameters: `size` (9/13/15/19), `variant` (any game's key, such as `renju`,
`dropFour`, `go` or `chineseCheckers`), `opening` (`free`, `pro`, `longPro`,
`swap`, `swap2`, `rif`, `sakata`, `tarannikov`), `obstacles` (`none` or
`hoshi`), `theme` (`kaya`, `shinkaya`, `washi`, `sumi`, `matcha`), `stones`
(`classic`, `jade`, `sakura`, `indigo`, `neon`), `coords=0`. Unknown values fall back rather than erroring — a host should not
be able to break the board by mistyping a parameter.

The board posts messages outward — `itsutsu:ready`, `itsutsu:resize`,
`itsutsu:move`, `itsutsu:result` — so a host can size the frame and react to
play:

```js
window.addEventListener("message", (event) => {
  if (event.data?.type === "itsutsu:resize") frame.style.height = `${event.data.height}px`;
});
```

Every one of those also goes out under its old `gomoku:` name, because the site
was called Gomoku when this interface was published and a host page is somebody
else's code on somebody else's server. Listen for **one or the other, never
both**, or you will count every event twice. New hosts should use `itsutsu:`.

### Embed tokens

The site is closed, so `/embed` needs a token of its own. The operator mints
one per host — from `/admin`, or `pnpm embed-token <label>` — and gets back
the whole iframe snippet to paste.

```html
<iframe src="https://your-host/embed?token=eyJraW5kIjoiZW1iZWQi…&size=9"
        style="border:0;width:100%;height:640px" title="Gomoku"></iframe>
```

Three facts shape that design:

- a cross-site iframe **cannot rely on cookies**, since browsers block
  third-party cookies, so the token travels in the URL and is checked on every
  request rather than exchanged for a session;
- `proxy.ts` verifies it on the Edge runtime, where Prisma cannot run, so the
  token carries its own HMAC proof instead of being looked up in a table;
- the embedded board **makes no API calls at all** — it is a local game — so a
  leaked token exposes a board and nothing else.

An embed token unlocks `/embed` and nothing else: `/`, `/history` and every API
route still refuse it, which is asserted by `e2e/embed.spec.ts`. Session
cookies and embed tokens are signed with the same key and separated only by a
`kind` field, so each side checks it — there is a test for pasting one in place
of the other.

Retiring a token is by expiry, or `EMBED_TOKEN_EPOCH` to invalidate every token
issued before a moment.

### Connecting an embed to the live data

The board stays local — a game played in an iframe is played in the browser and
never leaves it — but the embed can show what is happening on the server beside
it: how many games have been played, the most recent results, and one named
player's record.

```html
<iframe src="https://your-host/embed?token=…&size=9&stats=1&player=Akira"></iframe>
```

That is a wider grant than showing a board, so it is a **separate scope** on the
token rather than something every embed gets:

| Scope | Unlocks |
| --- | --- |
| `board` (default) | `/embed`, and nothing else |
| `data` | also `GET /api/embed/summary`, read-only |

A `board` token asking for the summary gets 404 — the endpoint does not
advertise itself to an embed that was never meant to reach it — and a token
minted before scopes existed carries none, so nothing gained a privilege by
being read with newer code. Neither scope opens `/`, `/history` or any other
API route, which `e2e/embed-data.spec.ts` asserts rather than assumes.

The summary is deliberately thin: finished games only, with no ids that grant
anything and no games still in progress, since a live game's id is half of a
seat link. Mint one with the checkbox on `/admin`, or
`pnpm embed-token <label> <days> <site> data`.

Framing is refused unless the host origin is listed in `EMBED_ALLOWED_ORIGINS`
(space-separated) — the token says *who may load it*, the CSP says *who may
frame it*, and a host needs both. Every route other than `/embed` refuses
framing outright.

If you want deeper integration than an iframe, `src/lib/gomoku/` is a pure
TypeScript module with no React or database dependency and can be imported
directly.

<br clear="right">

## Deploying

Production runs on Vercel with a Neon Postgres, the same shape as umakuma. A
push to `main` runs `.github/workflows/vercel-deploy.yml`: the checks (lint,
types, unit tests, audit and build, as five jobs side by side) and the browser
suite (fourteen shards, balanced by how long each file takes, side by side with them) — and only when BOTH pass,
`prisma migrate deploy` against the production database, the build, a check
that no server function has grown past its limit, the deploy, and the removal
of superseded deployments. Migrations run before the new code goes live and
are all additive, so the old code keeps working during the switch. A push of
only Markdown or `docs/` runs nothing. How fast that is, and how to keep it
fast, is in AGENTS.md, "Deploys Are Fast By Design". The `deploy` job is the
only thing that makes a version live, and it keeps the live deployment and the
one before it. Since 2026-10-07 the site sits behind Vercel Bot Protection set
to Challenge, so a plain `curl https://itsutsu.com/…` answers 429; what
production is serving is read from Vercel's API (the checklist's step 8), not
from a page.

One-time setup:

1. Create a Neon project and copy both connection strings: the pooled one is
   `DATABASE_URL`, the direct one is `DIRECT_URL`.
2. Create the Vercel project (`npx vercel link` from the repo, or the
   dashboard) and set in its production environment: `DATABASE_URL`,
   `DIRECT_URL`, `AUTH_SECRET`, `ADMIN_EMAILS`, `ADMIN_TOKEN`,
   `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`,
   the production Sumilabu tokens (`SUMILABU_BOARD_TOKEN`,
   `SUMILABU_SETTINGS_TOKEN`) and, if the board is to be embedded anywhere,
   `EMBED_ALLOWED_ORIGINS`.
3. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as GitHub
   Actions secrets (the two IDs are in `.vercel/project.json` after linking),
   and `MIGRATE_DATABASE_URL` and `MIGRATE_DIRECT_URL` for the migration step.
   Take those two from Neon: Vercel's sensitive variables pull as a
   placeholder.
4. Push to `main`.

`pnpm preflight:prod` runs the same checks the workflow does, locally and side
by side, and is the gate before every push.

The monthly JMdict refresh (JMdict's licence asks for one) runs in Kotoba's
repository since 2026-09-30, where the kana lists now live: a changed list is a
new Kotoba version, and this site takes it as a one-line bump of the package.
See `docs/plans/other/WORD-04-kana.md` for why it exists.

Every landed commit takes a version, and ONE FEATURE IS ONE VERSION:
`pnpm release:take:prod --summary "…"` takes the number, dates the changelog,
commits both and closes the board row it ships, immediately before the push.
Several features are several runs of it and then one push. See AGENTS.md,
"Every Landed Commit Bumps The Version".
`pnpm db:drift:check` compares the committed schema with whatever
`DATABASE_URL` points at and prints the SQL it is missing.

## Scripts

| Task | Command |
| --- | --- |
| Dev server (port 6700) | `pnpm dev` |
| Lint / fix | `pnpm lint` / `pnpm lint:fix` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test:unit` |
| End-to-end tests | `pnpm test:e2e` |
| Screenshots into `screenshots/` | `pnpm screenshots` |
| Rebuild `favicon.ico` from `icon.svg` | `pnpm favicon` |
| All gates | `pnpm quality:check` |
| Fix what can be fixed | `pnpm quality:fix` |
| File size gate on its own | `pnpm loc:check` |
| Local database | `pnpm local:db:up` / `:down` / `:reset` |
| Migrations | `pnpm db:migrate` (dev) / `pnpm db:deploy` |
| Prisma client / browser | `pnpm db:generate` / `pnpm db:studio` |
| Mint an invite code | `pnpm invite` |
| Dependency audit | `pnpm security:check` |
| English typed outside the phrase table | `pnpm i18n:check` |
| Write the Japanese the site reads / the packed data files | `pnpm i18n:text` / `pnpm data:pack` |
| Refuse a commit that credits an AI | `pnpm attribution:check` |
| Measure the server functions after `vercel build` | `pnpm functions:size` |
| Pictures of the games, puzzles and the rest, with their stamps | `pnpm screenshots:games` / `:puzzles` / `:party` / `:casual` / `:houseki` |
| The release gate, checks side by side | `pnpm preflight:prod` |
| Take a release (bumps the version, dates the changelog, closes a live board row) | `pnpm release:take:prod --summary "…" --done <row>` |
| Write to the features board from a terminal | `pnpm task` (dev board) / `pnpm task:prod` (live board) |

`pnpm quality:check` runs lint, the 500-line file size gate, typecheck and the
unit tests. See `AGENTS.md` for the conventions those gates enforce, and for
the four things that make an end-to-end run fail for reasons that are not in
the code — a stale dev server, two runs against one database, database litter,
and a test that races hydration.

## Documentation

| Document | For | Update it when |
| --- | --- | --- |
| This README | a first look, running it, the API, embedding, deploying | a feature, route, parameter or setup step changes |
| [`docs/CORE_CONCEPTS.md`](docs/CORE_CONCEPTS.md) | the ideas the code rests on | how games, seats, members, ratings, the computer players or XP work changes |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | how the pieces fit, and how a change ships | a service, a layer, the gate, the pipeline or a cost rule changes |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | every table and enum | any migration |
| [`docs/email.md`](docs/email.md) | what the site sends and its caps | anything about email |
| [`AGENTS.md`](AGENTS.md) | the rules and the gates | a rule is learned |
| `CHANGELOG.md` | what shipped, and when | every release, through `pnpm release:take` |

A change that makes one of these wrong updates it in the same pull request.
Each guide names the file that holds each fact, so a claim can be checked
against the code rather than trusted.
