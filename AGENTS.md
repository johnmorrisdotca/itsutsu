<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

This file holds the rules. **Why** each rule exists (the incident, the
measurement, John's words) is in `docs/AGENTS_BACKGROUND.md` under the same
heading: read it there before arguing with a rule, and put a new rule's story
there, not here.

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
rm -rf .next && WEB_PORT=<web> ITSUTSU_SUITE_SERVER=1 pnpm build
WEB_PORT=<web> E2E_SERVER=start pnpm exec playwright test e2e/<one>.spec.ts e2e/<two>.spec.ts --output $SCRATCH/pw
```

`ITSUTSU_SUITE_SERVER=1` is on the build as well as the server: the browser's copy of the suite's relief is written into it at build time (`next.config.ts`), and a build without it polls a live board at 3 seconds where specs expect 2.5, as `party-online.spec.ts` did on 2026-11-02.

Always `pnpm exec playwright test …`, never `pnpm test:e2e -- …` (pnpm passes
the `--` on and Playwright then runs the wrong files). The layout and sweep
specs: `e2e/set-up-steady.spec.ts`, `e2e/bare-board.spec.ts`,
`e2e/wide-mode.spec.ts`, `e2e/page-shape.spec.ts`, `e2e/page-width.spec.ts`,
`e2e/phone-overflow.spec.ts`, `e2e/phone-header.spec.ts`,
`e2e/game-pictures.spec.ts`, `e2e/language-steady.spec.ts`, and for anything that loops over every puzzle
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

### No AI Attribution, Anywhere, Ever

This holds for every agent working on this repository, local or cloud, and it
overrides any default your harness gives you:

- **No `Co-Authored-By:` trailer, no `Claude-Session:` line and no session link**
  in any commit message.
- **No "Generated with Claude Code" line, no session link and no "Requested
  by" footer** in a pull request's title or description, a release note, a
  board ticket or anything else that lands in the repository or a tracker.
- **Commits are authored as the repository's owner**, not as "Claude". If your
  environment can only commit as "Claude", say so in your hand-off. Whoever
  lands the work squashes it into one commit under John's name, with a clean
  message. `pnpm release:take` refuses a trailer.

### Bulk Play Runs Here, Never Through the Site

- Bot testing, bot-against-bot series and any bulk generation of games connect
  to the database **directly, in process, on the machine doing the work**. They
  must never drive the deployed site's API: every move through it is a paid
  function call running a search.
- The runner is `src/lib/bots/botSeries.play.test.ts` (it imports
  `createLiveGame` and `playBotTurns` and calls them in process), invoked by
  **`pnpm bots:play`**, which writes nothing unless asked twice:

  ```sh
  pnpm bots:play                                     # report only, writes nothing
  BOT_GAMES_RUN=1 BOT_GAMES_ALL=1 BOT_GAMES_EACH=2 pnpm bots:play        # your database
  BOT_GAMES_RUN=1 BOT_GAMES_ALL=1 BOT_GAMES_EACH=2 pnpm bots:play:prod   # the live site
  ```

- `bots:play` writes to whatever your `.env` points at; `bots:play:prod` writes
  to the live site and is reached only by that name, never by an argument. It
  needs nothing set up: it asks **Neon** for the connection string every run,
  hands it to one process and prints the host before writing anything. The
  connection string is never pasted into a shell, written to disk or printed.
- **Never `vercel env pull` for this**: `DATABASE_URL` is Sensitive in Vercel,
  so a pull writes the literal string `[SENSITIVE]` into the file.
- `BOT_GAMES_ALL=1` is every ladder grade against every other across three
  unalike boards; without it, only the specialists at their own game.
  `BOT_GAMES_EACH=N` is games per pairing; colours alternate, so use an even
  number. Two per pairing is 80 games and about eighty minutes on one machine.
- It is a `.test.ts` run under vitest because `@/` aliases do not resolve in a
  plain node script. `--disable-console-intercept` stays in the pnpm script, or
  vitest swallows the report.
- **The games it writes are rated** (`liveGame.ts` calls `recordResult` only
  for a rated row); two programs make a computer-pool game, which never touches
  where a person stands.
- Before writing, it prints how many games the database it reached already
  holds. Read that line: **check which database you actually reached** by the
  row count, never by the command line (`.env` has silently overridden an
  inline `DATABASE_URL` here).
- **Rehearse locally first.** The engine's `GameSettings` and
  `LiveGameSettings` are two types, neither a superset of the other.

### The Gate Is `src/proxy.ts`

- Next 16 renamed the middleware convention: the file that decides who gets
  into this site is `src/proxy.ts` and there is no `middleware.ts`
  (`node_modules/next/dist/docs/` says so). `proxy.ts` already exists and holds
  the invite gate, tested by `proxy.test.ts`.
- **Look before you write**, whatever you are about to create: a file you
  believe is new may be sitting there.
- **The gate's decisions are not yours to touch.** Additions belong on paths
  that already let the request through: wrap the `NextResponse.next()` a
  decision has already arrived at, never the deciding.
- **The sanctioned exceptions are narrow, its-own-secret credentials for
  specific paths, not sessions**, and there are two, both in
  `src/lib/auth/ownCredentials.ts`:
  - The embed token for `/embed` and `/api/embed/`, checked by its own function
    (`verifyEmbedToken`). It grants nothing beyond letting the request continue
    to the route, which re-checks the same secret plus the embed's `data`
    scope, and it never removes a way through that already existed: a wrong or
    missing credential falls through to the ordinary session check.
  - The stop link every member email carries (`src/lib/mail/mailStop.ts`), for
    `/stop/<token>` and `/api/mail/stop`. It must work without signing in
    (Canada's anti-spam law). The token names one member and one kind of
    email, is checked by `verifyStopToken`, and the page and route re-check it
    and can do nothing but switch that member's email off or back on. The page
    reads the language of the member its token names, and a language asked for
    there (`?lang=`) is remembered on the yes side of the decision
    (`rememberLanguage` wraps the `next()`); it decides nothing.
  - Neither exception is shuttered for maintenance.
- **The open pages are answered from a kept copy, after the gate's yes**:
  `strangerRewrite` inside `carryOn` rewrites a reader with no session to
  `app/stranger/[[...path]]`. It wraps the `next()` a decision had already
  reached, reads no database, and can only send a request to a page it was
  already allowed to read. See "Open Pages Are Kept For Strangers".
- The board token for `/api/backlog` and `/api/backlog/[id]` is gone, and so
  are those routes: `pnpm task` talks to Sumilabu with a token of Sumilabu's,
  the page writes through Server Functions under the operator's session, and
  `proxy.test.ts` pins that a bearer token on the old addresses opens nothing.
- A NEW exception needs the same shape as the embed token (a caller that
  cannot hold a session, a dedicated check, granting no more than "continue",
  and a wrong credential falling through to the ordinary session check) and the same reasoning stated beside it.

## Workspace Gates

### File Size Gate

- Code files under `src/` must stay at or below 500 lines.
- Gate command: `pnpm loc:check`, run as part of `pnpm quality:check`.
- If a file approaches the limit, split by responsibility (`components/`, `lib/`, domain modules) rather than adding flags or nesting.
- `*.constants.ts` and `*.test.ts` are reported when long but do not fail the
  gate: the limit is there to catch a file doing too many jobs.

### Types And Constants Pattern

- Shared `type` and `Props` declarations live in adjacent `*.types.ts` files (for example `board.types.ts`), not inline in components.
- One constants module per component group (`Board.constants.ts`), not one per component.
- Domain values (`Stone`, `RuleVariant`, `GameStatus`) are compared through the constants in `src/lib/gomoku/gomoku.constants.ts`, never inline string literals. Display text for domain values comes from `STONE_DISPLAY` / `RULE_VARIANT_DISPLAY`.

### Every Word Goes Through The Phrase Table

- **New visible text goes into `PHRASES` in English and Japanese.** The English
  is a key in the file for its area, `src/lib/i18n/phrases.<area>.constants.ts`
  (nav, rules, setup, xp and so on, the first word of the key); a new area is a
  new file and one line in `i18n.constants.ts`, and `phrases.coverage.test.ts`
  fails a key said twice or a file nobody joined. A component reads it with
  `useSpeaker()`, a server page with `say`.
- **Copy that belongs to data** (a game's rules, a level's name) gets a sibling
  table per language typed `Record<Locale, …>` beside the data, never a second
  copy of the data. For a game's words that sibling is
  `src/lib/i18n/dictionaries/` (`variants.ja.*`, `openings.ja`, `bots.ja`,
  `families.ja`, `attribution.ja`): a line is `["日本語", "literal English"]`
  and an entry carries a `review` stamp. Readers ask `variantCopy`,
  `openingCopy`, `botProfile`, `familyBlurb` and `gameCopyFor` for the
  speaker's locale, never the English table directly. The English row stays in
  its own file, allowed in `ALLOWED_FILES` as the English half of a pair, and
  only while the coverage tests hold a Japanese line beside every line of it.
- **A name is not copy**: a game's, family's or colour's Japanese name is its
  `kanji`, and a computer player's name and `native` are not translated.
- **A word is never edited in a hashed or stamped file, for a translation or
  anything else; its Japanese sits beside it.** `opponent.constants.ts` and
  `analysis.constants.ts` are hashed by the measured ladder's fingerprint
  (`ladderFingerprint.ts`). A puzzle's words are the same pair: `puzzleCopy`
  reads its tagline, origin and rules, and the tables its screens are made of
  (`mazeWords.ts`, `gridWords.ts`, `cardWords.ts`) lay a Japanese overlay from
  `src/lib/i18n/dictionaries/puzzles.ja.*` over the English table, which stays
  in its own file because the pictures' stamp hashes several of them
  (`puzzleArtFingerprint.ts`). The screens' sentences are phrases (`pset.*`,
  `pword.*`, `pgrid.*`, `pmaze.*`, `pkumi.*`, `pcard.*`, `puzzle.*`).
- **A refusal is a key and its values, never a sentence (ENJA-13).** A route, a
  library or a puzzle's check that says no names the phrase (`err.*` for the API
  and the tables, `chk.*` for why a puzzle's check will not take an answer) and
  fills its gaps: `badRequest("err.name.short")`, `refuse(409, "err.sit.taken",
  undefined, { reason })`, `no("chk.noMoveMade")`, `said("err.game.limit", { count,
  limit })`. The answer keeps its shape and its status: `error` is still the
  sentence in English, for a script, a test and a log
  (`src/lib/api/refusal.ts` reads it from the catalogue, so no route types
  it), and `code` and `values` are the key the page says in the reader's
  language (`refusalText`, `refusalOr`, `sayRefusal` in
  `src/lib/api/refusalText.ts`; a page must not show `body.error` directly). A
  key inside a value is said the same way (`Not solved: {reason}`), and a
  schema's `message` is a key too (`issueCode` reads it). A new game's check
  says `no("chk.<game>.<why>")`, never `speaker(DEFAULT_LOCALE).say(…)`
  (`src/lib/api/refusal.test.ts`).
  - **Operator-only routes are the exception**: `src/app/api/admin` and the
    five routes beside it that `currentAdmin` shuts (members, invites,
    invites/[code], site, embed-tokens) are listed in `EXCLUDED_PATHS` in the
    gate and answer in English through `operatorRefusal`, as the Admin pages
    do. The proxy says its two refusals the same way and leaves what it
    decides alone.
  - **A check from a package has no key:** Kazu's six, Awase and Kumimoji give
    a `reason` in the package's English, and a page shows it as it came, until
    those packages take their words as an option.
- **The Japanese is drafted with `back`, and the `japanese-reviewer` agent
  checks it before the change lands.** A phrase that no reader has passed does
  not ship. The process, and each ticket's part in it, is
  `docs/plans/en-ja-everywhere/README.md`.
- **A reader is given the Japanese as text alone, and `pnpm i18n:text` makes
  it.** The authored files (`dictionaries/`, `xpAwardCopy.ja.constants.ts`,
  `levelNames.ja.constants.ts`) keep every sentence beside its `back`, `review`
  and `ask`, and only the review sheets and the tests read them. The site runs
  on one generated, Brotli-packed file, `jaText.generated.json.br`, read off
  disk and never imported (see Function Size): **after editing any Japanese,
  run `pnpm i18n:text` and commit the file**, or `jaText.coverage.test.ts`
  fails with that instruction (on a merge, run it again rather than resolving
  the generated file by hand).
- **Code reads the words through `jaText()`** (`src/lib/i18n/jaText.ts`) and
  never imports an authored file or a generated one: a server build reads them
  itself, and a browser is handed them as a prop of `JaLocale` only when the
  reader's language is Japanese, so no `back` reaches any browser or page
  function (`jaText.coverage.test.ts` holds both halves). `next.config.ts`'s
  `turbopack.resolveAlias` for `jaText.server` keeps the words out of a browser
  build. A new table of Japanese copy beside data adds its text to
  `jaText.types.ts` and `jaText.build.ts` in the same change.
- **The root layout draws `JaLocale` for every language** and never a different
  component for another: a different component at the same place makes React
  rebuild the whole page when the language is chosen.
- **The gate is `pnpm i18n:check`** (`scripts/check-i18n-strings.mjs`). It reads
  every `.ts` and `.tsx` file under `src/` and fails on a JSX sentence, on a
  prose attribute (`title`, `aria-label`, `placeholder`, `alt`, `label`), and on any
  string literal that reads as English: a ternary's branches, an object's
  values, a list of rule bullets, an API's refusal. It runs in `quality:check`,
  as its own lane in `scripts/preflight.mjs` and as a step of the `static` leg
  of `verify`. It does not count a thrown `Error`, a console line, a path, a
  class name, a test or the phrase catalogue itself.
- **What is allowed without a phrase is written in the script with its reason**:
  the brand (Itsutsu, XP), a format's name (SGF, PDN), board coordinates, the
  operator's own pages (admin and the board), names copied from other sites'
  records, and tables of boards and word lists. Anything else is a phrase.
  **Tables of copy that belong to data** (what each XP award is called, the
  hundred level names) are listed in `COPY_TABLES` in the script, each with its
  reason and where its Japanese is, and a coverage test holds every row
  answered in both languages; a table is added there only by a ticket that
  writes its Japanese beside it. Never add an allowance because the gate is in
  the way (see "Nothing Answers What It Cannot Answer").
- **The pending list is empty and stays empty.** `PENDING_PATHS` in the script
  holds nothing, and `src/lib/i18n/inlineEnglish.coverage.test.ts` fails if a
  path is ever put back. A new path is never the way out of a red gate: the
  text goes through `PHRASES`.
- **Dates, numbers, lists and counts follow the reader, with no `Intl` and no
  locale typed in.** The months, weekdays, thousands mark, list joins and date
  shapes of each language are one table, `src/lib/i18n/format.constants.ts`,
  and the `Speaker` carries them: `say.day(key, style)` and `say.month(key)`
  ("6 Oct 2026", "2026年10月6日"), `say.number(n)`, `say.list(items)` ("a, b and
  c", "a、b、c"), `say.words(n)`. A moment in the reader's own zone is
  `LocalTime` or, for a bare day after hydration, `readerDay` in `ui/when.ts`.
  **A count is a phrase pair**, `count.move.one` and `count.move.other` in
  `phrases.count.constants.ts`, read with `say.count("count.move", n)`.
  English has a singular; the Japanese counts with a counter word (3手, 5人,
  2局) and answers both forms alike. The gate also fails on `.toLocale*String(` (any locale, typed or the runtime's),
  on a plural made by hand (`n === 1 ? "game" : "games"`, `+ "s"`), and on
  `countText(n)` with no locale (each counts against a pending path like a
  sentence). A new language is a row in `FORMATS`, which
  `format.test.ts` demands of every offered one.
- **It is a sweep, not a parser**: it tells prose from code by function words
  and short capitalised phrases, so it can miss a one-word lower-case label and
  can flag a code word. Do not reword a sentence until it stops looking like
  English to turn the gate green.

### Engine Is Pure

- Game rules live only in the engine, Narabe (`@johnmorrisdotca/narabe`, an open-source package in its own repository, github.com/johnmorrisdotca/narabe): `src/engine.ts` there and the `src/rules/` modules it delegates to (winning lines, forbidden shapes, captures, turn length, openings), each unit tested beside its source. The site depends on it at a released version, the tarball the repository's release workflow attaches to a `v*` tag; a change to a rule is a commit there, a new version and tag, and a one-line bump of that URL here. The package ships its source and tests beside the build, so the gates below read them from `node_modules`. The site reaches it through the modules at the old paths, `src/lib/gomoku/engine.ts`, `gomoku.constants.ts`, `gomoku.types.ts` and `rules/*.ts`, which re-export it; a rule is changed in the package, never in a re-export. Components and hooks never inspect the board to decide outcomes; they call the engine.
- Every engine function returns a new `GameState` and leaves its input untouched.
- A rule variant is a row in `VARIANT_SPECS` (Narabe's `src/constants.ts`, reached through `gomoku.constants.ts`) plus its copy in `variants.constants.ts`. Words for players never go in the package: `gomoku.constants.ts` keeps the site's own (`STONE_DISPLAY`, `DRAW_LIMIT_DISPLAY` and the rest). The engine reads the spec and never switches on a variant's name. Analysis (`threats.ts`, `analysis.ts`) is advisory and sits above the engine: it filters through the rules, never the other way round.
- Anything that asks "may this colour…" reads `rulesFor(settings, stone)` in `rules/handicap.ts`, which lays the handicap over the variant's spec. Never read `VARIANT_SPECS[...].lineRule`, `.forbidden`, `.captures` or `.stonesPerTurn` directly for a colour.

### New Game Gate

**A game is not done until all of these are true.** They are enforced by
`src/lib/gomoku/variants.coverage.test.ts`, which runs in `pnpm test:unit`.
None is optional.

- **It is tested.** At least one unit test under `src/lib/gomoku/` names the
  variant and exercises the rule that is new (the capture size, the wrap, the
  losing condition). Riding the shared simulation loop is not a test.
- **It survives the simulator.** Narabe's `src/simulation/` plays every variant
  automatically, and its `checks.ts` / `scan.ts` restate the rules by hand as
  an independent check. A new mechanism means extending the checker too.
- **It is a solid game, not a rule.** Play it out before it ships: it has to
  end, either side must be able to win, and it must not be decided in the
  opening by a move anyone would find. A forced win, or a game random play
  cannot finish, is a puzzle: say so on its rules page or leave it out.
- **It has a screenshot.** `public/art/games/<variant>.jpg`, from
  `pnpm screenshots:games`. Regenerate after any change to board or branding.
- **It says where its stones sit.** `grid` on its `VARIANT_SPECS` row: `lines`
  for a game drawn on the crossings (gomoku, go), `cells` for one drawn in the
  squares (tic-tac-toe, Othello, checkers). Declared, never inferred.
- **It has full copy.** `RULE_VARIANT_DISPLAY` needs a label, a kanji name, a
  tagline, an origin, board advice, and at least three rule bullets;
  `rulesPageFor` must fill every section. If the game is our version of a
  published game, set `inspiredBy` (see `RULES_ATTRIBUTION`).
- **It reads in Japanese.** `VARIANT_COPY_JA`
  (`src/lib/i18n/dictionaries/variants.ja.constants.ts`, one file per family,
  `Record<RuleVariant, …>`) holds the tagline, the origin, one line for each
  English rule bullet and the board advice, each as `[日本語, literal English]`
  with a `review` stamp, in the words of
  `docs/plans/en-ja-everywhere/TERMS.md`; the game's name is its `kanji` and is
  not repeated. A new opening is a row in `openings.ja.constants.ts`, a new
  computer player one in `bots.ja.constants.ts`, a new family one in
  `families.ja.constants.ts` (its blurb; its name is its kanji).
  `variants.coverage.test.ts` and `gameCopyJa.coverage.test.ts` fail for a
  game, opening, program, family or shelf reason without them, for a line with
  no back-translation, and for a rules page that does not read in Japanese from
  top to bottom. A sentence the rules page builds from the game's spec rather
  than its copy is a `rulespage.*` phrase.
- **It belongs to a family.** Add it to `GAME_FAMILIES` in `families.ts`. That
  family is its one HOME: its family page, its siblings, the family's counts
  and figures, and the XP for a family all read the home. It may also be shown
  on another family's shelf for discovery, through `ALSO_LISTED_IN`, with the
  reason beside it: the same game, never a copy, saying "also under" its home
  wherever it is shown. A shelf is not a complete list: list only what a
  person looking there would want to find.
- **It decides its names on other sites.** `GAME_ALIASES` in
  `src/lib/legacy/gameAliases.ts` turns a source site's name for a game into a
  link; `NO_GAME_HERE` names the ones with no game here, each with its reason.
  `src/lib/legacy/gameAliases.coverage.test.ts` (the alias gate) fails when a
  recorded name is in neither, when a record uses a name one of our games goes
  by without leading to it, or when a name is in both.
- **It has an end-to-end test.** One Playwright case that opens the game and
  plays the move that shows its rule working. The gate greps `e2e/` for each
  game's key or address.
- **It says the day it arrived.** `pnpm games:added` dates every game from the
  day git first added its picture, into
  `src/lib/catalogue/gameAdded.data.ts` (a `Record<GameKey, …>`), and the
  Everyone feed announces each day's new games in one line. Run it once the
  picture is committed. `gameAdded.coverage.test.ts` fails the build for a game
  with no date.
- **Its words are read at every end.** Its copy (set-up, play, every ending:
  win, loss, give up, out of time, draw, its finished page and its record) has
  been read on a real screen at a phone's width and a desk's, and uses the
  words in `docs/plans/plain-english/GLOSSARY.md`. Text built from data counts
  too. `src/lib/i18n/plainEnglish.coverage.test.ts` fails the build on any
  label the glossary retired, read from the glossary itself.

**A puzzle is not a variant, and has a gate of its own.** A puzzle is a
`PuzzleKind` under `src/lib/puzzles/`, never a row in `VARIANT_SPECS`. The
catalogue joins the kinds through `GameKey`
(`src/lib/catalogue/gameKeys.ts`), so a puzzle is in a family, has a front door
at `/games/<slug>` with `/rules`, `/family`, `/new` and `/play` under it, a
picture (`pnpm screenshots:puzzles`, stamped by `puzzleArt.coverage.test.ts`)
and a browser test, and `puzzles.coverage.test.ts` asks it every question above
in its own terms, plus that its generator makes a puzzle with exactly one
answer at every size and level it offers, in a browser's time, and that
`checkSolution` refuses a wrong grid. The six Numbers puzzles (Number Place,
Jigsaw, Diagonal, Sum Cages, More or Less, Towers) are made, solved and checked
by Kazu (`@johnmorrisdotca/kazu`, github.com/johnmorrisdotca/kazu), reached
through `src/lib/puzzles/kazu.ts` and the one-line re-exports at their old
paths; a change to how one is made is a commit there, a new version, and a bump
here only after `kazu.test.ts` shows every puzzle made as before, because a
kept solve, a race and a day's puzzle are made again from kind, size, level and
seed. Everything that thinks about a puzzle runs in the browser; the server
checks a finished grid in O(cells) and pays. Reasoning:
`docs/plans/numbers/README.md`.

**Nor is a party game, and it has a gate of its own too.** A party game is a
`PartyKind` under `src/lib/party/`: a table of two to six round one device,
kept only in that browser, or on several devices as a table on the server
(`docs/plans/party-online/README.md`); never rated. Each is joined into
`GameKey`, lives in Party games (a family no award counts:
`RECORDED_FAMILIES`), has a front door, rules and a table at
`/games/<slug>/pass-and-play`, waits on My games through its row in
`PARTY_KIND_TABLES`, and `party.coverage.test.ts` plays its rules out at every
table it offers and asks it every question above in its own terms. How to add
the next one: `docs/plans/party-games/README.md`.

**Nor is a casual game, and it has a gate of its own too.** Karakuri's games
are `CasualKind`s under `src/lib/casual/`: one person, a level at a time,
played by `@johnmorrisdotca/karakuri` on a canvas in the browser. Each is
joined into `GameKey`, lives in the Karakuri family (one no award counts:
`RECORDED_FAMILIES`, with a page of its own at `/games/karakuri`, answered by
the game page's route to spare the server function a route), has a front door,
rules, a set-up of its levels and a play page at `/games/<slug>/play?level=N`,
waits on My games through `CasualCards`, and is kept for offline play. It is
never rated and earns no points and no XP: what it remembers (the levels won
and the one in progress) is in the browser's storage and nowhere else, and
`casual.coverage.test.ts` fails the build if anything under `src/lib/casual/`
or `src/components/casual/` reaches for the database or an API. Its board is
`CasualBoardClient` (`ssr: false`, so the package is in no server function).
How to add another: `docs/plans/casual-games/README.md`.

**Nor is a Houseki game, and it has a gate of its own too.** Houseki's games
are `HousekiKind`s under `src/lib/houseki/`: gem and stone puzzles for one
person, a level at a time, played by `@johnmorrisdotca/houseki`. Each is joined
into `GameKey`, lives in the Houseki family (one no award counts:
`RECORDED_FAMILIES`), has a front door, rules, a set-up and a play page, waits
on My games through `HousekiCards`, and is kept for offline play. It is played
in the browser and kept there until it is finished; a won level or Daily is
worth points, so the browser sends the finished game's save and
`housekiVerify.ts` plays it again through the package before it counts
(`HousekiWin`, one row for each thing won). A lesson and a free game earn
nothing and are never sent. It earns no XP. `houseki.coverage.test.ts` plays
every level's recorded winning plan through that check. How to add another:
`docs/plans/houseki/README.md`.

**A language or a word list is a setting of a game, never a game of its own.**
A new language or corpus for an existing game is a choice on that game's set-up
(as Kumimoji chooses English or Japanese), with one card, one front door and
one family entry; records, fastest tables and kept runs may stay apart
underneath. A word puzzle's list in any language comes from a real dictionary
of that language, with a frequency count only ranking it;
`wordLists.coverage.test.ts` in Kotoba (`@johnmorrisdotca/kotoba`, where the
lists live) holds the words that got through.

**Every board is the same board, and a preview is always a live one.** The
wood, the rim, the coordinates and the shadow are `BoardFrame`, and `Board` and
every puzzle grid (`PuzzleBoard`: white paper inside the same wood) are drawn
inside it. A size picture is `BoardSizeMark` in `BoardPicker`, nothing else.
The set-up screen's preview is the live board at the chosen size, for a puzzle
(`PuzzleBoardPreview`) as for a game (`BoardPreview`), in the one box
`SET_UP_PREVIEW_BOX`. Held by `boardFrame.coverage.test.ts` and
`boardSizeMark.coverage.test.ts`. Before a new kind of thing that draws a
board, a size or a preview ships, find the component that already draws it and
use that.

Inside that frame, Tsunagi's board is the package's own drawing and nothing of
the site's: `TsunagiGrid` lays `tsunagiDrawing(layout, { surface: true })` on
`PuzzleBoard` and brings only the colours for the wood (`tsunagiBoardLook`),
the words and the pressing. A spec finds what is on the board by the drawing's
own classes (`.tsu-line`, `.tsu-marble`, `.tsu-bridge`). Held by
`tsunagiOneDrawing.coverage.test.ts`.

**And nothing on the set-up screen changes height when something is chosen**,
on a phone or a desk. A family, a game and a board size are one tile
(`PICK_TILE`, fixed width and height); a shelf shows at most eight games and a
game or puzzle offers at most four boards (`picker.test.ts`); the games' panel,
the preview's caption and the line naming the game each keep the room their
longest wording takes; and a puzzle's own settings sit under a heading below,
where a game's opponent is. `e2e/set-up-steady.spec.ts` presses every family,
game and board at three widths and fails if the chooser ends anywhere else.

**Anything a person plays is kept until it is finished, and waits in My
games.** A new kind of play answers, before it ships: what happens when the
player leaves half way, and where do they find it again? A puzzle is kept
through `useSolve` → `useKeptRun` (one write when it is paused or left, none
while it is played) and listed by `MyPuzzleRuns`; held by
`idleWatch.coverage.test.ts` and `e2e/puzzle-kept.spec.ts`.

### Every Game In Progress Offers The Same Controls

A front door with a game in progress is `GameInProgressOffer`: **Continue →**
and a labelled **New game** that says what happens to the one in progress.
Under the board is one row, `GameEnding` (`src/components/play/`): **Resign**
against somebody or something that can win, **Give up** for a game played
alone, **New game** beside it, each asking in place before it ends anything.
Resume is only for a clock. A new kind of play draws these, never its own; the
words are `GAME_ENDING_COPY` and the gate is `gameEnding.coverage.test.ts`.
What is not yet on them, and why, is `docs/plans/game-controls/README.md`.

### Nothing Is A Dead End

**Any number that refers to games links to a page showing exactly that set of
games.** If you see a name of a game, it is clickable; if you see a W/L/T
record for this site, each number is clickable. Before a page that lists games
or players is done, walk this list by eye:

- **Every game's name leads to that game**, through `GameName`, to the game's
  own page: the address `gamePath` in `slugs.ts` builds, the one place that
  builds it (the front door, with the rules, the record and the ladder each
  one document under it). A name in a list is a reference to the game, not an
  instruction to start one.
- **Every count of games leads to those games**, through `GameCount`, filtered
  to exactly what was counted: that player, that game, how it went, and which
  ladder was counting.
- **Every player's name leads to their page**, through `PlayerName`.
- **Every opponent you are shown offers what you would want to do about them:**
  invite, challenge, buddy, ignore.
- **Every page a link lands on says what it was narrowed to**, and lets it be
  taken off. `/history` says so in chips above the filter bar.

**A count must link to the set it counted, not a set that contains it.** A
ladder's record is RATED games in ONE POOL; a player's own page counts every
finished game either way. The filters that keep the promise exactly: `player`,
`outcome`, `pool`, `rated`, and the game in the path.

**The one exception.** A figure from another site (an ItsYourTurn record) has
no game here to open. Those do not link, and must not; say it with
`of={{ here: false }}` rather than by leaving the link off, so the exception is
a decision in the source.

**Enforced by `src/components/games/gameLinks.coverage.test.ts`** (in
`pnpm test:unit`), which fails the build when a page prints a game's name with
nothing behind it, prints a record as a string, or shows a table of records
without saying whose games it is counting. It checks the RULE rather than the
import: a name already inside a link passes. A select's `<option>` and a game
named inside a sentence (a hover note, a page title, a line of advice) are not
links; both are exceptions in the test with their reason written beside them.

**And a game named in a list shows its picture.** A card, a row or a table
cell that names a game draws that game's board beside the name, through
`GameThumb`, and a family's icon is drawn on every page that shows a family.

**Every picture is one of three sizes: small for tables and lists, regular, and
large = 2× regular.** Regular is the set-up page's board tile, 70px, and stays
on the set-up tiles and chips, /games and a family's cards, and the family icon
heading a game page's panel. Small is half of it, 35px, for every table, ledger
and row of a list. Large is the doorstep's board. Both are written from regular
in `PICTURE_PX` (`games.constants.ts`), `/ 2` and `* 2`, never as numbers of
their own. `GameThumb`, `FamilyMark`, `BoardSizeMark`, `OpeningMark`,
`SeatMark` and the rated tiles' icons each take
`size: "small" | "regular" | "large"` and read their side through `pictureBox`;
no per-surface class or pixel count. A label under a picture is one language on
one line, through `OneName`, except on the set-up screen's tiles (one fixed
box, `PICK_TILE`), where a name too long for a family's width takes a second
line in room every tile keeps (`OneName wrap`), never cut short.
**Enforced by `src/components/games/gamePictures.coverage.test.ts`**, which
fails the build for a name with no picture near it, for a picture at any size
but the three, for a picture drawn at a size other than its file is classified
for in `SURFACE_SIZES` (a new file that draws a picture fails until it is
classified), and for a retired per-surface size coming back. A page title, a
heading or a sentence naming a game, and a picture that must differ from its
file's size, are exceptions written there by line, with their reason.

**A word beside its kanji is drawn by `Paired`, `OneName` or the speaker's
`pairName`, never by hand** (no hand-written `font-mincho` span next to an
English word): English and its kanji for an English reader, the Japanese once
for a Japanese one. `src/components/games/handPairs.coverage.test.ts` fails on
a hand-written span the speaker did not decide, and each file it allows (a
glyph drawn as a picture, the site's name in a sentence, the operator's pages)
is listed there with its count and why none of its spans is a pair.

### Every Game Offers Just The Board

- `BareBoard` (`src/components/layout/BareBoard.tsx`, with `bare.ts` and the
  `data-bare` rules in `globals.css`) is the mode: the page's column becomes a
  modal holding the board, the scrubber where the game has one, and only the
  presses play needs; Close sits top right and Esc leaves. Every play page
  offers it (board games, puzzles, Gomoji, Tsunagi, Kumimoji, every party
  table), and a new kind of play is not finished until it does; a coverage
  check holds it (board row every-game-offers-the-just-the-board-mode). The
  same goes for the desktop board size (Regular, Large, Full), remembered per
  kind of device.
- **The modal has no dead half, and a wide board is laid out wide.** Whatever
  holds a board's column (`data-bare-board`) is one column in the modal, so
  hidden side matter leaves no empty column. A board wider than it is tall
  declares itself (`data-scale-wide` on that column; Tenka's map is the one,
  and `boardScale.ts` says which others were judged and why not): on a desk
  nothing sits beside it at Regular, Large or Full (it is the page's width at
  Regular and past it at the other two), and the modal is as wide as the map,
  as large as the window's height allows.
- Set-up furniture goes once play starts: a table's colour choice is one small
  control, the place's marble and "Change colour", that opens the picker when
  asked (`PartySeatColour`).
- **Nothing in the modal scrolls on a desk**: from a laptop's width the board
  is sized from the window's height, and what would run past its foot goes
  beside it inside the modal (a puzzle's controls in the column they take at
  Large and Full, the practice board's and Block Five's side column, a live
  game's whose turn and move being made, Mexican Train's hand
  (`data-bare-beside`), a card table's seats).
- **The stylesheet's `:has()` rules have a shape.** Never `:has(…) > *`,
  `:has(…) > :not(…)`, or `[data-testid=…]` beside a `:has()` or a sibling
  combinator: each restyles every element it could match on every change. A
  neighbour is found as a sibling (`board ~ :not(board)`, `:has(~ board)`),
  never as "the child of whatever has a board"; `globals.css` says why above
  the first of them, and a new rule is measured on
  `/games/mahjong/play?size=26` before it ships.
- Held by `boardScale.coverage.test.ts`, `e2e/wide-mode.spec.ts`, and the
  survey in `e2e/bare-board.spec.ts`, which opens every play at 1280×800 and
  1920×1080 and fails on a scroll or an empty column;
  `bareSurvey.coverage.test.ts` holds its list to the catalogue, so a new play
  joins it.

### Nothing Moves When The Language Does

The board and the presses stay where they are when the language changes; only
the words around them change.

- **Reserve room by what the longer language needs, never fix a size.** A
  minimum, not a width, so a longer translation wraps or grows and is never cut
  off: `ROOM_FOR_A_WORD`, `ROOM_FOR_TWO_WORDS`, `ROOM_FOR_TWO_LINES` and
  `ROOM_FOR_THREE_LINES` in `ui.constants.ts`, and `min-h-[2lh]` on a line of
  words over something that must stay put (a status line, a note, a hint). A
  press that holds its place in a row names its room (`ControlButton`'s `wide`).
  Where a desk's width holds the words on one line in both languages, the room
  is dropped there (`md:min-h-0`, `lg:min-h-8`): the modal of Just the board
  has no height to spare.
- **A heading is never shorter than one of its own lines, and the kanji beside
  its word never makes it taller** (`globals.css`, `line-height: 1` on the span
  and `min-height: 1lh` on the heading).
- **`e2e/language-steady.spec.ts` holds it.** It opens every play in
  `e2e/playSurvey.ts` (the list `bare-board.spec.ts` walks too, held to the
  catalogue by `bareSurvey.coverage.test.ts`), chooses Japanese by clicking the
  account menu's picker, then English again, and fails if the board moved, a
  press slid, words were cut off, the page scrolled sideways or anything did not
  come back. Each play is read at one of three widths and a few at all three
  (`LANGUAGE_STEADY_EVERY_WIDTH=1` runs every play at every width); the few
  also take large counters and long labels written into the page. A link inside
  a sentence is text, not a press, a name shortened with an ellipsis is cut on
  purpose, and the welcome toast stands on the window, not on the page.

### Playing Offline

The practice board, every pass-and-play table, the card and party games at one
device and every puzzle solved alone play offline once their page is kept.
`public/sw.js` (the keeper) does that, registered by `OfflineKeeper` in the
root layout, in a production build only.

- **A page is asked of the network first, always**; the kept copy answers only
  when the network does not. Pages are kept from answers fetched anyway, on
  first visit, and only the pages a game is found and played from
  (`KEPT_PAGE`). `/api/` is never answered from the device.
- **A new kind of play** that runs in the browser is kept if its address is
  under `/games/<slug>/play` or `/pass-and-play`; anywhere else, add it to
  `KEPT_PAGE` and to `keptGamesFrom` (`src/lib/offline/offlineKeeper.ts`),
  which the games list's "Ready offline" marks read.
- **"Keep every game offline"** on /games (`KeepAllOffline`) keeps the whole
  list in `offlineGameAddresses` at once, one page at a time, paid once when
  pressed and never on a visit. A new kind of play belongs in that list, and
  `offlineKeeper.test.ts` fails if a game is missing from it.
- **Every spec but `e2e/offline.spec.ts` blocks the keeper**
  (`serviceWorkers: "block"` in `playwright.config.ts`), because a request a
  service worker makes is not one `page.route` sees.
- **A cache renamed** is a new `VERSION` in `sw.js`, and
  `offlineKeeper.test.ts` holds the page side's spelling to it.

### Every Table Of Players Shows XP, And The Programs Are Players

Every table of players' records shows XP, directly after the Rating column,
everywhere on the site.

- **A program earns from its games under the same rules as a person, and
  stands where its total puts it**: Level 1 at nought, like anyone. `awardXp`
  pays it from the same game-end writes; `levelShown` takes a total and
  nothing about what kind of member holds it; the board (`xpBoard.ts`) and
  the rungs (`levelMembers.ts`) list programs among everybody; the backfill
  replays their finished games too.
- **What only a person can earn is stated, in `XP_PEOPLE_ONLY`
  (`src/lib/xp/xp.constants.ts`)**: joined, dailyVisit, the four day-streak
  milestones, backFromAway, firstBuddy, buddyAdded, wonVsBuddy,
  challengeSent, challengeAnswered, rematchPlayed, forkPlayed, timeGiven,
  applauseGiven, nameSet, countrySet, bioSet, wordsSet, seatClaimedElsewhere.
  `awardXp` holds these back from a member with an engine name and says why
  (`peopleOnly`), and the backfill plans none for one. Everything else (a
  finish, a win, a first, a streak, an upset, a grade beaten, a family
  completed, a weekend game) is a fact about a finished game, and a program
  earns it. Do not invent new people-only awards: that is John's to ask for.
- **`RecordTable` draws the XP column unless a caller says `xp: false`**, and
  the only honest reason to is that the rows are not players (a person's
  by-game breakdown, a per-site total). The column sits directly after
  Rating. The one dash left is a name nobody has claimed.
- **A table built from rating rows reads the total in one query per page**,
  never one per row: `xpByMemberId` in `src/lib/xp/xpOfMembers.ts`, over the
  page's member ids, already decided by `xpShown`.
- **A player's page opens with their name, their record, and their standing**
  (level number and name, the total, the distance to the next rung) through
  `MemberLevel`, for a program as for a person.

**Credit for another site is experience too, and it is kept apart.**

- **Two totals, three columns.** `Member.xp` is Itsutsu only: `awardXp` is its
  one writer. `Member.xpImported` is the credit for a kept record, written
  only by `importedXpPay.ts`. `Member.xpEverywhere` is the sum, a column
  because the board pages, ranges and ranks over an index. Both writers move
  `xpEverywhere` in the same update, and the payer's runner checks all three
  against the ledger before and after it writes.
- **The deploy window drifts it, and the runner repairs that first.**
  `vercel-deploy.yml` runs `prisma migrate deploy` before the new build is
  live, so for those minutes the OLD `awardXp` moves `xp` and not
  `xpEverywhere`. The payer's runner RECONCILES before it pays: it lists every
  member whose `xpEverywhere` is not `xp + xpImported`, and with the run asked
  for sets exactly those rows back from their own current values, reads again,
  and refuses to pay while any still disagrees. One authorised run of
  `node scripts/xp-imported-prod.mjs` repairs and pays together. Any later
  migration that adds a column the old code cannot keep has the same window,
  and needs the same step.
- **Imported awards are their own types** (`IMPORTED_XP_TYPES` in
  `importedXp.constants.ts`), never an `XpEventType`, and the backfill's ledger
  check leaves them out. Their subject is `stake@figure=points`, so a second run
  pays nothing, grown figures pay the growth, and a record that now comes to less
  is reported, never clawed back.
- **The amounts John approved** are the site's own prices: ordinary games 25 and
  wins 50 with no daily cap, tournaments at 1.5 times, a year on a site at a
  year's price with 10,000 at five and 25,000 at ten (counted only with a hundred
  games there), and the milestones at one game read from the record's by-game
  detail. Anniversaries of membership pay the same year awards here. Games come
  from a class's `record`; milestones from its `detail`, which understates where
  `detailComplete` is false (the safe direction).
- **Eligibility is one function**, `importedXpEligible`: there is no
  verification in this code, so every curated record is eligible.
- **"On import" means the payer runs after the import.** A record is imported by
  a commit to `legacyPlayers.data.ts`; its last step is
  `XP_IMPORTED=1 pnpm exec vitest run src/lib/xp/importedXpPay.play.test.ts`
  (and `node scripts/xp-imported-prod.mjs` for the live site, with John's word
  and a Neon branch first).
- **Showing it.** `/xp` and the rungs offer Everywhere 通算 / Itsutsu only 五
  beside People / Computers / Everyone, remembered on `xpScope`. Wherever a total
  includes imported credit, `ImportedXpNote` says how much, for how many games,
  and where (the games count drawn with `here={false}`). The level badge beside
  a name everywhere else reads `xpForBadge` in `xpScope.ts`, which is Everywhere;
  the directory's XP order reads the same column, so a table sorts by what it
  prints.

**Enforced by `src/components/players/xpColumn.coverage.test.ts`** (in
`pnpm test:unit`), which fails the build when a `RecordTable` switches the
column off without being named there with its reason, when a table that draws
the column never fills it, when a hand-built table with a Rating heading has no
XP heading after it, when the player's page draws the standing anywhere but
under the figures, or when the standing rule, the board, the rungs or the
awarder keep programs out again. **And by `src/lib/xp/xp.coverage.test.ts`**,
which holds every priced award to one side of the people-only line (a new award
is sorted the day it is priced) and holds every imported award to its own side:
no shared type, no write to `Member.xp`, no place in the Itsutsu ledger check.
Every exception is a line with a reason beside it.

### Show The Data, Not The Way To It

- A page about a thing shows the thing rather than a link to where the thing is
  kept: the ladder belongs on the game's page, and so do the last few games. A
  link is the way to MORE of something already on the page, never the page's
  answer to the question it exists to answer.
- **An empty table is data.** An empty panel shows its headings and its shape,
  says plainly that nobody has played this game here yet, and offers the way in
  as a link (BE THE FIRST TO PLAY). It does not hide itself, and it does not
  replace itself with a sentence apologising for the absence.
- **For a signed-out reader** "be the first to play" goes to `/join`. Word it
  as an invitation that says what the site wants from them; do not reuse the
  signed-in label.
- **"Reading is open" means the GAMES, not the people.** A stranger reads the
  catalogue, every game's page, its rules, family and background, `/about` and
  `/learn`; the players, the ladders, the champions, XP, the record and
  anything naming a member need an invite (a member's page carries their whole
  name in its address and some members are children). The line is enforced by
  `OPEN_PATTERNS` in `src/proxy.ts`.
- A panel that would show a stranger members shows the shut state instead
  (`GameLadder`'s "who is winning … needs an invite", with its "No invite? Ask
  for one" beside it), never a table with the names left out.
- A page that is open to strangers must be checked with no session.

### Open Pages Are Kept For Strangers

**What is kept.** The pages `OPEN_PATTERNS` and its siblings let a stranger
read, as listed by `strangerRouteFor` (`src/lib/stranger/strangerRoutes.ts`):
`/`, `/join`, `/about` and its chapters, `/learn` and its guides, `/games` and
its cards and list views, `/games/<slug>` with its rules, family and
background, `/privacy`, `/terms`, `/thanks` and `/dice`. A request for one of
them with no session cookie, no Google sign-in cookie, in English (the site's
default), and with no query that changes the page, is rewritten by the gate to
`/stranger/<the same address>`: one optional catch-all route
(`src/app/stranger/[[...path]]`), `force-static`, `revalidate = 3600`, which
draws the same page function the live route does (`strangerPages.tsx`) and
keeps the result. The address in the reader's bar never changes. Inside it a
cookie and a header read as empty, so `currentSession()` says nobody and
`currentLocale()` says English. A member, the operator, a reader with a stale
cookie, a reader of Japanese, and anybody on an address that reads its query
are answered live.

- **A kept page never reads a request.** No `cookies()`, `headers()` or
  `searchParams` of its own in what `strangerPages.tsx` calls, and a thing that
  must differ for a reader (a stamp that says when a form was drawn, where to go
  after sign-in) is asked for in the browser, as `AskForInvite`'s `stampOnOpen`
  and `JoinForm`'s `nextFromAddress` do. `strangerCache.coverage.test.ts` holds
  the route's shape; reading the page as a stranger with no session is the check
  for the rest.
- **Only the language the copy is in is kept.** A reader of Japanese is
  answered live. A second kept language is a second tree with its own root
  layout (`next/root-params`), not a flag.
- **A new open page is added in three places or it stays live:** the gate's
  list (`proxy.ts`), `strangerRouteFor`, and `strangerPageFor`. Only slugs the
  site has are kept; a page that reads its query is `READS_QUERY` and kept only
  with none.
- **Read the pathname with `useSitePathname`**, never `usePathname`: inside a
  copy the server may say `/stranger/…` where the browser says `/…`
  (`strangerPath.ts`). Held by `strangerCache.coverage.test.ts`.
- **Freshness is the hour,** plus the tags the data already carries (the door
  clears with the site's settings, `SITE_SETTINGS_TAG`). A count a copy shows
  can be an hour old; that is accepted. The home page's "here
  now" is cached for an hour in `siteNumbers`.
- **The suite's own build answers every open page live unless a request asks**
  (`x-itsutsu-kept-copy: 1`, `ASK_FOR_KEPT_COPY`), as `strangerCatalogueStats`
  is not kept there: a spec seeds a game and reads the page as a stranger in
  the same minute. `e2e/stranger-cache.spec.ts` sends the header and proves a
  stranger gets the copy, a member does not, and each language gets its own.
- **Measure before and after** with a production build: send a request with no
  cookie and another with `Cookie: itsutsu_session=x` (a stranger the gate must
  answer live) and compare the server's CPU and the database's statements.

### Back It Up Before You Migrate It

The production database is Neon project `calm-boat-93104880` ("itsutsu"),
Postgres 18 in `aws-us-east-2`, on Neon's Free plan (re-read with `neonctl`
if the numbers matter to a decision). Its `main` branch is **not protected**,
so nothing at the Neon end refuses a destructive operation. Point-in-time
recovery reaches back **six hours** only. The plan allows 10 branches a
project, so keep about three `before-*`; it pauses a project that uses its 100
compute-hours in a month, so nothing may wake the database on a timer. Full
dumps on the DiskStation (DS1) are kept indefinitely and are the copy that
lasts.

**Before any migration or data write against production:**

1. **Take a branch first** (`neonctl branches create … --name
   before-<what>-<yyyy-mm-dd>`; the commands for steps 1 to 4 are in the
   checklist's step 9).
2. **Delete the oldest `before-*`, so about three remain.** `neonctl branches
   list` with the same two ids shows them and when each was made.
3. **Take a full dump to the DiskStation.** Production is Postgres 18 and
   Homebrew's `pg_dump` is 17, which refuses a newer server, so the 18 client
   runs in a container (`postgres:18-alpine`). `$URL` comes from
   `neonctl connection-string main` with the same ids, and goes into that one
   command and nowhere else.
4. **Archive it with UmaKuma's script** (`pnpm db:backup:archive "$DIR"` there,
   with `NAS_BACKUP_DIR=/volume2/docker/staging/itsutsu/backups`): it copies to
   DS1 over ssh, proves arrival by SHA-256, never overwrites, and deletes the
   local copy only once the checksum matches; nothing prunes the folder on DS1.
5. **Say what you are about to run, and to which database, before running it.**
   Verify which one you are actually connected to by counting rows: an inline
   `DATABASE_URL` is silently overridden by `.env`.
6. **Never pass the real database as `--shadow-database-url`.** Prisma drops
   and recreates a shadow database.
7. **If `prisma migrate dev` offers to reset, the answer is no.** "Applied to
   the database but missing from the local migrations directory" means a
   migration file is on a branch that has not merged yet. The fix is to merge
   that branch, never to reset a database other people are using. Never apply
   a migration to the shared database while its file lives only on an unmerged
   branch.

### Plans In The Repository

**A multi-ticket plan lives in `docs/plans/<plan>/`, one file per ticket, and
a board row that says `Plan: docs/plans/…` is implemented from that file.**
Read the plan, its folder's `README.md` and `BOARD_RULES.md` in full before
starting. The first is `docs/plans/board-convergence/`, which brings this
board and UmaKuma's to one contract; its README says which rows exist and
in what order to take them.

### Board Gate

The features board at `/backlog` is where a request lives once the conversation
that raised it is over.

- **The rules are pure and in one module.** `src/lib/backlog/backlog.ts` decides what a
  usable request is (`draftProblems`), what may follow what (`canMove`, `movesFrom`), and
  how a board is filtered and ordered. It returns new items and never writes to the one
  it was given.
- **The rows live on Sumilabu**, the one board every site shares, under Itsutsu's
  project. `src/lib/sumilabu/boardClient.ts` is the thin client every caller uses
  (`pnpm task`, `pnpm release:take --done`, and the page through `backlogStore.ts` and
  its Server Functions, `backlog.actions.ts`), and the service enforces the contract,
  `docs/plans/board-convergence/BOARD_RULES.md`: the caps, the table of moves, the lease
  and the claim condition. There is no `BacklogItem` table.
- **A status move is checked, not trusted.** The row's select is built from `movesFrom`,
  the page's Server Function asks `moveProblems` before it writes, and Sumilabu refuses
  anything its own table forbids.
- **An unreadable board is never an empty one.** `/backlog` and Admin show an alert when
  Sumilabu cannot be read, and `pnpm task` exits non-zero with the reason.
- **The gate runs in `pnpm test:unit`.** `src/lib/backlog/backlog.coverage.test.ts` fails
  the build when a status cannot be left or reached, when a status, kind, priority or
  effort is missing its label, kanji or blurb, or when a cap in code is not the
  contract's number.
- **The release history is parsed, never copied.** The same page lists every release,
  read from `CHANGELOG.md` at request time by `releasesFile.ts`. `releases.test.ts`
  parses the real file, and refuses a changelog naming a version newer than
  `package.json`. The build's tracer ships the file to the pages that read it, because
  `releasesFile.ts` names it in a string it can follow; never name it in
  `outputFileTracingIncludes`, which ships every package's changelog too
  (`changelogTracing.coverage.test.ts`). The operator reaches both halves from the Admin
  page.

Whether work is *taken* from the board is the site owner's rule to make, not this file's.

**WRITE THROUGH THE BOARD'S DOOR, NEVER AROUND IT.** Every check above lives on
Sumilabu, behind its API: the only writers are the client and Sumilabu's own
import. Never write rows any other way.

**Which board you reach is the safety property.** Every Sumilabu caller here works on
`itsutsu-dev` unless it is told otherwise (`sumilabuTarget`, and the Sumilabu block of
`.env.example`), the way `bots:play` stays on your own database. `pnpm task:prod` is the
live board, and a checkout's `.env` holds only the dev tokens, so nothing run from one
can reach it; the command that can is typed by name.

```
pnpm task                              what is open and who holds it, on itsutsu-dev
pnpm task:prod <command> …             the same commands, on the live board
pnpm task add "<title>" [--detail "…"] [--kind feature|fix|chore] [--by "<who>"]
pnpm task claim <key> --by "<who>"     open -> inProgress; a lapsed hold is freed, then taken
pnpm task release <key> --by "<who>"   inProgress -> open
pnpm task drop <key> --by "<who>"      -> dropped
pnpm task reopen <key> --by "<who>"    dropped -> open
pnpm task grade <key> --priority high|normal|low|none --effort small|medium|large|none
pnpm task edit <key> [--title "…"] [--detail "…"] --by "<who>"   not on a done row
pnpm task note <key> "<text>" --by "<who>"   a note, on any row, done included; `notes <key>` reads them
pnpm task history <key>                the revisions of a row's title and detail
pnpm task link <key> --parent <key|none> --by "<who>"
pnpm task link <key> --related <key> [--remove] --by "<who>"
```

A key resolves through Sumilabu's `GET tickets?key=`, and every write addresses the id.
`stamp` is retired: Sumilabu writes a stamp only when the release tool ships a row.

In progress is a claim with a six-hour lease (board convergence ITS-01), not
only a status: `claim` on a row somebody else holds is refused with their
name, and cannot be taken over inside the lease. A hold nobody has renewed
past six hours is free again (`claim` puts it back to open and takes it, both
under the claim condition), and `pnpm task`'s list prints it as STALE.

### Work Starts With A Ticket

Every piece of work has a row before the first file is touched: a feature, a
fix, a chore, a follow-up that a review or a failed run turns up, and each task
handed to a sub-agent. A request made in conversation becomes a row first; an
agent is never started on a task that has no row. Work that already shipped
without one gets a row after the fact, closed against the release that carried
it, so the board matches the changelog.

**How to write one** (`pnpm task:prod add` for the live board, `pnpm task add`
for the development board; see the Board Gate for the rest of the commands):

```sh
pnpm task:prod add "<title>" --kind feature|fix|chore --detail "<detail>" --by "<who>"
pnpm task:prod grade <key> --priority high|normal|low --effort small|medium|large
```

- **The title** is at most 120 characters (longer is refused) and says what a
  person gets, not how it is built: "Meikyuu can be coloured", not "add a
  palette module".
- **The detail** holds the rest: what is wrong or wanted, the constraints the
  owner gave in his own words, where to look, and what done looks like. A
  stranger reading only the row should be able to do the work.
- **One row per deliverable.** Two things that ship as two versions are two rows.
- **Grade it** when the owner says how urgent it is; leave it ungraded rather
  than guess.
- **The key** is the title's slug, cut short. Copy it exactly from
  `pnpm task:prod`; a typed guess closes nothing and the failure is quiet. Put
  the key in the prompt of any agent that works the row and in the commit body.
- **Never close a row by hand.** `pnpm release:take:prod --done <key>` closes it
  at the release that ships it; with `--done` and nothing else it closes at the
  release commit HEAD is, so a row can be closed after the fact from a checkout
  of that release.

**How a change ships** is the numbered checklist at the top of this file (and
the README), "Making a change and shipping it", with the reasons in "Every
Landed Commit Bumps The Version" below and the README's "Deploying". Two
habits: the local gate (`pnpm preflight:prod`) does not run the browser suite,
which gates the deploy, so grep `e2e/` for any count or name the change moves
before pushing; and after a push, watch the run's jobs for the first failure
rather than only the `deploy` job, because a red shard skips the deploy and
reads as a wait.

### Deploys Are Fast By Design

**A standing goal.** Every change to how this project is checked, built or
released is judged by one number as well as by whether it works: **how long
from `git push` to the site reading the new version.** The browser suite is the
critical path and the lever is SHARDS; there are fourteen (`e2e.yml`), and
`verify` is five parallel jobs. The deploy job itself is small steps and not
worth restructuring.

1. **Parallel by default.** A new check is a new lane in `scripts/preflight.mjs` and a
   new leg of the `verify` matrix, never another `&&` on the end of a chain.
   Two things run in sequence only when one reads what the other wrote (types
   and the build share `.next`, so they share a lane).
2. **Never run the same suite twice for one push.** `ci.yml` runs on pull
   requests only. Before adding a workflow, count the jobs one push starts.
3. **Keep the slowest shard short.** When it passes about eight minutes, add
   shards (free on this public repository) or rebalance the files. The one
   ceiling is GitHub's twenty concurrent jobs on a free account: five checks
   and fourteen shards are nineteen (the deploy waits for them rather than
   running beside them). A quick check is a step of an existing leg, as
   `pnpm i18n:check` is of `static`, never a leg of its own.
4. **Shards are balanced by time, not by count.** `e2e.yml` gives each shard
   the files `scripts/e2e-shard.mjs` deals it from `e2e/shard-times.json`
   (heaviest first, each to the lightest shard). Refresh the times from a run
   that was green first time: `gh run view <run> --log | node
   scripts/e2e-times.mjs > e2e/shard-times.json`. A new spec counts as a
   median one until then.
5. **Measure, don't guess.** Step timings of a run:
   `gh api repos/johnmorrisdotca/itsutsu/actions/runs/<run>/jobs` and read each
   step's `started_at`/`completed_at` (the REST field is `id`, not
   `databaseId`). Per-file test time: the gap between consecutive `[n/N]` lines
   in a shard's log. Prove a shard split with `playwright test --shard=N/M
   --list` before pushing it: every test in exactly one shard. Dividing by test
   instead of by file (`fullyParallel`) was measured no faster.
6. **A spec's wall time is paid on every release.** Wait on a condition, never
   on a clock, unless the clock IS the subject (the invite form's three-second
   stamp is).
7. **Follow the tools' own advice**: one Playwright worker per shard in CI and
   no caching of Playwright's browser download, package installs cached
   (`setup-node`'s `cache`).
8. **The suite runs against the production build**: each shard builds while its
   browser downloads, and `E2E_SERVER=start` points Playwright at `next start`.
   The reliefs the suite needs are refused in production except on a server
   started with `ITSUTSU_SUITE_SERVER=1`, which only `e2e.yml` sets and which
   Vercel ignores outright (`src/lib/suiteServer.ts` and its test). Locally,
   `pnpm dev` is still the server a spec runs against unless you build and
   set `E2E_SERVER=start` yourself.

### Fewer Pushes

This repository is public and its workflows run on standard GitHub-hosted
runners, which are free; `e2e.yml` says why they must stay on one (a private
repository or a larger runner would bill). A push starts nineteen jobs (five
checks and fourteen browser shards, then the deploy) against GitHub's twenty at
once, takes about fifteen minutes to reach the site, and spends one of the
Vercel team's hundred deployments a day, shared by every project. The count of
pushes is the cost.

- **Batch finished work into one push**: at most about one an hour while
  features are flowing. Several releases go out in one push (one feature, one
  version still holds, see "Every Landed Commit Bumps The Version"); a fix for
  something broken on the live site may go sooner.
- **Retry a flaky run with `gh run rerun <id> --failed`**, never with a new
  commit. A rerun repeats only the failed jobs; a push repeats everything.
- **Prose alone deploys nothing.** `vercel-deploy.yml` and `ci.yml` filter on
  `paths`: a push whose every file is Markdown or under `docs/` starts no run.
  `CHANGELOG.md` is the exception, because the site reads it at runtime. So an
  edit to this file can go in the next code push, or on its own at no cost.
- **One suite per push.** `ci.yml` runs on pull requests only, because the
  deploy already runs the whole gate on `main`. Before adding a workflow or a
  trigger, count the jobs one push starts.
- **Open a pull request only when you need its run**: a branch touching many
  routes, judged on a fresh database (see "Running the end-to-end suite"). Each
  push to an open PR is another full run.

### Function Size

Every function Vercel runs counts against the Functions Storage the whole
account shares, and each kept deployment carries a copy.

- **Jisho's words are fetched in the browser, on a tap, and nowhere else.** The
  kana Gomoji's "what this guess means" line (`guessMeaning.ts`) imports
  `@johnmorrisdotca/jisho/words` inside `typeof window !== "undefined"`, so no
  function carries it; `meaningLine.ts` imports its types only. A new use of
  Jisho follows the same shape.
- **The deploy job measures before it uploads.** `scripts/check-function-sizes.mjs`
  (`pnpm functions:size`) reads `.vercel/output/functions` after `vercel build`
  and fails any function over **39 MB**, or more than 20% and more than 5 MB
  over its size in `scripts/function-sizes.baseline.json`. The rules are in
  `src/lib/functionSizeGate.mjs`, tested beside it. The ceiling only ever comes
  down.
- **A deliberate change in size is recorded in the same commit**, with
  `pnpm functions:size --record` after a local `vercel build` (give it
  `.vercel/project.json` of `{"projectId":"local","orgId":"local","settings":{"framework":"nextjs","nodeVersion":"24.x","installCommand":"true"}}`;
  `pnpm dlx vercel@latest build --yes`).
- **Only the engine the site runs on.** Prisma's library engine on Vercel is
  `rhel-openssl-3.0.x`. `next.config.ts` includes that one file, never the
  client folder, and excludes the WebAssembly engines and the build machine's
  own. **In this build an include beats an exclude**, and an include is matched
  against every folder, not just the root: name one file by its full path, and
  measure after any change to either list.
- **A disk read names its folder.** `src/lib/serverFileTracing.test.ts` fails on
  `join(process.cwd(), variable)` and on a read rooted at the whole of `public`
  or `src`. Spell the folder out and join the variable part after it.
- **The pages' function carries only what a server reads.** Every page is one
  function. `src/lib/pageFunction.coverage.test.ts` reads what a page reaches
  from the imports and fails, by name, for each of these:
  - A client component is drawn on the server too, so a dynamic `import()` in
    one is compiled into the function: a word list or level file a browser
    fetches is imported inside `if (typeof window !== "undefined") { … }`, and
    the server reads it through a module of its own (`wordDataModule.ts` and
    its four siblings, all of them in `everyListModule.ts`) that a page imports
    only where it prints from that list.
  - A module that checks an answer (`prepareOnServer.ts`) needs every list, so
    it sits apart from the reads a page makes (`puzzleRaceChecks.ts` beside
    `puzzleRaces.ts`).
  - A client component names a plain value from a constants module, never from
    a request schema, or zod goes to the browser and into the function twice.
  - A file over 64 KB, or a game package (`@johnmorrisdotca/…`), that a page's
    server build reaches is written down there with what the server prints
    from it; a new party table is loaded with `dynamic(…, { ssr: false })`, as
    `yachtClient.tsx` is.
  - The build keeps one copy of what the root layout reaches but one for each
    group of pages of what only pages reach, so `layout.tsx` names
    `headerCounts.ts` and `SiteHeader.tsx`; measure before moving anything
    every page uses.
  - **A font cut into slices is never preloaded**: any `next/font/google` face
    but Geist and Geist Mono says `preload: false`.
- **The site's words are packed once per layer, and the Japanese not at all.**
  A module imported by both a server component and a client component is
  compiled twice, and a route handler's bundle holds its own copies on top;
  naming a module from the layout cannot make it one (a side-effect import,
  `turbopackChunking` and `turbopackServerSideNestedAsyncChunking` were tried
  and moved nothing). The Japanese is one file,
  `jaText.generated.json.br`, read off disk by `jaText.data.ts` the first time
  a reader of Japanese asks, by a path the tracer can follow, and imported by
  nothing (`pageFunction.coverage.test.ts` fails by name for an import, a path
  it cannot follow, a file that is not packed, or a page-reachable module
  holding more than 300 kana). The file is Brotli at its best setting
  (`src/lib/packed/pack.ts`); `pnpm i18n:text` leaves a file that already
  unpacks to the right text alone, since Brotli's bytes can differ between
  Node's builds.
- **Data a server needs is read from a packed file, never imported.** A big
  table a server reads sits in `src/lib/packed/` as a Brotli file, written by
  `pnpm data:pack` from the data the site already has, read by one reader that
  names the file literally
  (`join(process.cwd(), "src/lib/packed", "<file>.json.br")`) the first time it
  is asked and once for the life of the process, and imported by nothing else.
  Where a browser needs the same data (Suido's hashes, Tenka's outlines) it
  keeps its data module and `next.config.ts`'s `turbopack.resolveAlias`
  (`browser`) swaps the server's reader for it in a browser build, so the reader
  is imported by its `@/` address and no other way. Where only a server reads it
  (Tsunagi's boards, the kana lists) there is no alias, and a client component
  must not reach the reader. `packedData.coverage.test.ts` holds each file to its
  data, its one reader and its alias, and `pageFunction.coverage.test.ts` fails,
  naming the chain, when a page's server build imports the data again. A new row
  is a line in both.
- What is still compiled twice is the English: the phrase catalogue, the copy
  tables beside data (`variants.constants.ts` and the like) and
  `puzzles.constants.ts`; moving them is the next lever if the ceiling closes
  in, with the kana pools and Meikyuu's levels behind them.

### Every Landed Commit Bumps The Version

**`pnpm release:take` takes the number and commits it, immediately before
pushing, chained with `&&` so a refusal or a red gate stops the push:**

```sh
pnpm release:take:prod --summary "a new game a player would notice." --done <key> && \
  rm -rf .next && test -z "$(git status --porcelain)" && \
  DATABASE_URL=postgresql://x:x@127.0.0.1:1/none pnpm preflight:prod > "$SCRATCH/gate.log" 2>&1 && \
  git fetch -q origin && git merge-base --is-ancestor origin/main HEAD && \
  git push -q --atomic origin HEAD:main && echo "PUSHED $(git rev-parse HEAD)"
```

(The checklist at the top of this file, step 6, has the same chain with what to
do when it stops. `release:take` without `:prod` closes rows on the development
board.)

- A **minor** (the default) is something a player would notice (a game, an
  opening, a page, a capability) and needs EXACTLY ONE `--summary`, written
  for the person reading `/releases`, not for whoever picks the ticket up next.
- **One feature, one version.** The tool refuses a minor with a second
  `--summary`; **a patch may carry several**. Three features are three runs of
  the chain, oldest first (each run takes the next number), and then ONE push.
  That costs no extra deployment (Vercel counts the push, not the version), so
  this rule and the batching rule in `CLAUDE.md` do not pull against each
  other.
- A **patch** (`--patch`) is a fix, a rewording, a refactor or a chore, and
  **needs a `--summary` too**: every release writes its dated heading and at
  least one line, and the tool refuses a release without one.
- `--done <key>` ships a row on Sumilabu's board with the version just taken
  (board convergence ITS-04, and the Board Gate section above). **Rows on the
  live board are closed by `pnpm release:take:prod`.** Plain `release:take`
  closes on `itsutsu-dev` and says so: the key is not found there, the run
  exits non-zero, and the `&&` stops the push. `done` has no other door: the
  page and `pnpm task` cannot offer it, and a row already done does not move
  again. If closing a row fails, the release commit is still right: run
  `pnpm release:take:prod --done <key>` again with nothing beside it, on that
  release commit with a clean tree. It takes no number and closes the row at
  the release HEAD already is, and it refuses, closing nothing, when HEAD is
  not a release commit.
- **The tool commits the release; there is no commit step to remember.** It
  writes `package.json` and `CHANGELOG.md` and commits exactly those two, as
  `0.x.y — <first summary>` and no trailer of any kind.
- It refuses before writing anything if either file already has changes of its
  own, or a merge is still open. A write or commit that fails puts both files
  back and says so. If the gate goes red after it has committed,
  `git reset --keep HEAD~1` takes the release commit back off, leaves every
  other edit where it is, and the next run takes the same number again.
- `releases.test.ts` only refuses a changelog naming a version NEWER than
  `package.json`; nothing else forces a bump, so the bump is this rule. The
  version and the changelog are how the site's owner knows something shipped.
- **THE NUMBER IS NEVER WRITTEN ON THE BRANCH.** `pnpm release:take` fetches
  `origin/main` first and refuses outright if the version it would take is
  already there. Leave `package.json` alone on a branch; the tool claims a
  number once, right before pushing.

### Documentation Upkeep

- **`docs/DOCS_UPKEEP.md` maps every doc to the code it describes.** Before
  `pnpm release:take:prod`, list what the release changed
  (`git diff --name-only origin/main...HEAD`), find those paths in the map, and
  re-read the docs they name. Fix a sentence that is now false in the feature's
  own commit, since `release:take:prod` commits only `package.json` and
  `CHANGELOG.md`. Leave a doc that is still true alone.
- A rename or a removal (a route, a status, a script, a family) means grepping
  `README.md` and `docs/` for the old name.
- A new doc gets a row in the map in the same commit.
- Pages on the site are code and are held by their coverage tests; a count of
  the site is read from the site, never typed into a sentence.
- No doc, commit or pull request mentions Claude, AI or any assistant: no
  trailers, footers or session links.
- Outside data (the famous games' sources, the records kept from other sites)
  carries the date it was last checked.
- **A new rule goes in this file in one to three lines, under the heading it
  belongs to; its story (the incident, the measurement, John's words) goes in
  `docs/AGENTS_BACKGROUND.md` under the same heading.** A change to the
  procedures block is made in the README's copy too.

### Nothing Answers What It Cannot Answer

A gate, a name and a return value are all reports. When one will not fit, the
difficulty is information; do not satisfy the report instead of hearing it.

- **Never trim a gate's subject to pass it** (shaving comments to get under the
  500-line limit), and never route around it (putting the change in another
  module instead).
- **Prefer two functions over a name that covers both.**
- **A rule that cannot measure must not fire: silence is the safe answer, zero
  is the dangerous one.** Prefer null, undefined or a refusal over a value that
  happens to be in range. Where a value can mean both "this" and "nothing
  said", add a third state (a stored `flipped: false`; the board's grades are
  nullable for the same reason).
- When a gate objects, read what it is objecting to before making it stop.

## Stack

- Next.js 16 (App Router), React 19, TypeScript 5, Tailwind v4.
- Node 24.x, **pnpm** (never npm/yarn).
- Vitest for unit tests.

## Local Ports: 6700–6799

Itsutsu's block on this Mac is **6700–6799**, from the table in John's global
`CLAUDE.md` ("Local ports: one block of 100 per project"): the dev server on
6700, and every worktree's dev server and e2e server on the next free port from
6701 up. **Never a 66xx port**: 6600–6699 is Onibako's, whose Docker stack runs
live on this machine. The shared local Postgres stays on 55434, and a throwaway
Postgres container for a worktree (the checklist's step 2) takes a free port
from this block too, checked with `lsof -nP -iTCP:<port> -sTCP:LISTEN`, as does
the Linux browser of step 4. A `next dev` without a port is a bug: pass
`WEB_PORT` or rely on the package script's default.

## Scripts

| Task | Command |
| --- | --- |
| Dev server (port 6700, override with `WEB_PORT`) | `pnpm dev` |
| Lint / fix | `pnpm lint` / `pnpm lint:fix` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test:unit` |
| All gates | `pnpm quality:check` |
| The release gate, checks side by side | `pnpm preflight:prod` |
| English outside the phrase table | `pnpm i18n:check` |
| Rewrite the Japanese the site reads / the packed data | `pnpm i18n:text` / `pnpm data:pack` |
| Board and release rows (live) | `pnpm task:prod` / `pnpm release:take:prod` |
| End-to-end | `pnpm test:e2e` (or `pnpm exec playwright test e2e/<spec>.spec.ts`) |

### Running the end-to-end suite

- **`RATE_LIMIT_RELIEF=20` must be in your `.env`** (`.env` is gitignored, so a
  fresh clone or worktree has none; see `.env.example`). Without it the suite
  fails a dozen tests with 429s. The relief multiplies only the limits that
  exist to bound a cost, never the guessing paths, and never in production
  except the suite's own build (`ITSUTSU_SUITE_SERVER=1`, never on Vercel:
  `src/lib/suiteServer.ts`); tested in `src/lib/api/rateLimit.test.ts` and
  beside it.
- **The same relief also shortens a live board's poll outside production.**
  `next.config.ts` hands it to the browser as `LIVE_POLL_RELIEF`, and
  `pollEvery` divides whichever cadence the board is on by it, never faster
  than every two and a half seconds. There are two cadences: fifteen seconds
  (`POLL_MS`), and three (`POLL_FAST_MS`) while the player the board waits on
  was seen on the site in the last two minutes. That is the one exception to
  "no client polling faster than about fifteen seconds", and it stays that
  narrow: a game in play, a board looked at and awake, the other seat's member
  present, never a computer player. At the suite's relief both come out at the
  floor, so a spec that needs to see the choice reads `data-poll-hurrying` on
  the board. Both numbers are defaults the operator can change on Admin's site
  panel ("Live board, other player here", 2 to 15 seconds; "Live board,
  ordinary", never under 15), read once per board page through a tagged cache
  and never on the poll. The relief never applies on the live site (`pollEvery`
  refuses it in production before reading it, the suite's own build excepted),
  and `src/components/live/pollCadence.test.ts` fails if that refusal goes.
- **It does not touch the twenty-game cap.** The cap is twenty for every member
  everywhere; the suite's own operator is let past it outside production by
  being in `ADMIN_EMAILS`. `e2e/active-game-cap.spec.ts` reaches the real
  twenty with a member of its own.
- **The suite's server keeps the site's settings in its own memory, never on
  Sumilabu.** A server started with `ITSUTSU_SUITE_SERVER=1`
  (`playwright.config.ts` and `e2e.yml` set it; `suiteServerOwnsSettings` in
  `src/lib/suiteServer.ts` refuses it in production without the marker and on
  Vercel always) swaps the three calls at the bottom of the store for a Map on
  `globalThis`, and keys the settings cache by a random per-server id
  (`src/lib/site/siteSettingsBackend.ts`). A spec may change any site setting
  freely and must still put it back for the specs after it on the same server.
  A server you start yourself with plain `pnpm dev` still reads Sumilabu's
  shared `itsutsu-dev` store. A fresh server starts with nothing chosen. The real round trip is
  `e2e/sumilabu-settings.spec.ts`, on a key of its own that no setting reads.

Rule the first three out, in this order, before believing a failure is a code
bug; the fourth produces a false PASS, so suspect it when a browser test is
green:

1. **A stale dev server.** Running `pnpm build` in the same directory corrupts
   the Turbopack cache (every seat link answering 404). `prisma generate`
   rewrites the client on disk while a running `next dev` keeps the old one, so
   queries fail naming the new value as invalid (`Value 'open' not found in
   enum 'BacklogStatus'`); pages on that model 500 and a suite times out rather
   than failing: a schema change means restarting the server and
   telling the other sessions that share it. It lies in both directions, a
   false pass included, and waiting does not settle it: `kill` the server,
   `rm -rf .next`, start it again and wait for the port to answer. **Never
   conclude anything from a run in the seconds after editing source, and never
   edit source while a suite is running.**
2. **Two runs against one database.** The setup deletions of one race the
   fixtures of the other, and two Playwright runs share `test-results/` (the second deletes
   the first's traces and both report ENOENT on artefacts). Say in
   the shared channel before starting a full suite, and stop your own runs by
   task id, never `pkill -f playwright`. A migration applied to the shared
   local database puts it **ahead** of every worktree whose schema predates it;
   the only fix is the migration reaching `main` and the worktree rebasing,
   then `prisma generate`, then restarting its server. After rebasing PAST a
   schema change, dozens of `Property '…' does not exist` type errors in files
   you did not touch are a stale generated client: `pnpm db:generate`.
3. **Database litter.** `e2e/tidy.ts` clears abandoned seats, seeded members,
   the games a run left unfinished and the ones with nobody on either seat.
   Each spec removes what it made. A local database that has grown past the
   two-hundred-row list cuts pushes real rows off the end of them and fails
   lobby specs on each other's leavings, and a
   `Player` row keyed to a name outlives its game, so `PATCH /api/me` answers
   409 for that name. **A spec must not assert anything about a name, a count
   or a row it did not itself create.** Generate the name, seed the standing,
   clear the variant first. Do not write a failure off as litter without
   looking.
4. **A browser test that races hydration** (a false pass). A server-rendered
   control is a real control before React attaches; a choice made in that
   window is dropped, and a timer started on hydration does not exist yet for
   `page.clock`. Wait on the marker, never on an element:
   `{...readyMark(useHydrated())}` from `src/lib/ui/hydrated.ts` on the
   component, and `ready(page, testId)` from `e2e/support.ts` in the spec.
   Reach for this first.

**`Intl` in render is a bug; `Intl` in a handler is the only correct place for
it.** Node and Chromium spell things differently (`Intl.DisplayNames` called
while a client component rendered was the fault), so a list needing it is a
server prop. The "use this device's time zone" link in `ProfileForm.tsx` calls
`Intl.DateTimeFormat().resolvedOptions().timeZone` in its click handler, and
that is right: do not remove it.

**A branch that changes many routes gets its full run on a PULL REQUEST, not
on the shared machine.** `ci.yml` runs on `pull_request` against a throwaway
Postgres with its own concurrency group. Push the merge to a branch, open a PR,
read the run, and push to `main` only once you can tell a real regression from
the noise.

**The browser suite GATES THE DEPLOY** (`vercel-deploy.yml`:
`needs: [verify, e2e]`): a red suite stops it, whether the page is broken or
the spec is. A change that renames or re-measures something a spec asserts is
not finished until `e2e/` has been grepped for the old value.

**To run ONE spec without taking the database out from under every other
session:**

```sh
pnpm exec playwright test e2e/<one>.spec.ts --no-deps --output /tmp/<scratch>
```

- `--no-deps` skips the `setup` project, which is where `auth.setup.ts` sweeps
  the shared database; `--output` somewhere private keeps `test-results/` out
  of another run's way.
- The spec still needs a signed-in state: mint `.auth/admin.json` yourself with
  a throwaway script that posts to `/api/session`, never by running the setup
  project. Mint it as `operator@example.test` (listed in your worktree's
  `ADMIN_EMAILS`), never as a real address, and give that address a member row
  with `ensureMember` first, as the setup would.
- A spec that creates rows still creates them: read what it seeds before
  running it against a database holding real accounts (the profile specs
  `PATCH /api/me` on the operator's row).
- **A spec run this way has not been run by the runner**: it verifies the
  behaviour, and is not the same claim as a green suite. Say which one you are
  making.
- **Before any `--no-deps` run, confirm the listener on your `WEB_PORT` is your
  own worktree's process** (Playwright's `reuseExistingServer: true` runs
  against whatever is on the port): `lsof -i :<port>` and check the PPID is
  your checkout's; move ports if not.

### A Test That Does What A User Would Not Do

**A test that reaches its subject by a route no reader takes proves nothing
about the route they do take.**

- **Drive the control, not the mechanism.** If a reader clicks it, a test
  clicks it. A test that sets the cookie the click would have set has tested
  the cookie.
- **Never reload to make an assertion pass.** `e2e/language.spec.ts` reloads
  nowhere on purpose, and says so.
- **Test the way back, not just the way there.** For any remembered answer,
  setting it, changing it, and clearing it are three different tests.
- **A redirect to a cleaned-up address is what makes a client-side cache able
  to be wrong**: if you add one, drive it with a click. (The players filter is
  remembered on the account through the preferences registry, `memberFilter.ts`,
  and redirects nowhere.)

### A Merge Cannot Conflict With A File That No Longer Exists

It re-creates it, silently: **a branch that predates a move re-creates every
file that move deleted**, and a route handler's unit tests pass on the
resurrected file.

- **Rebase a branch onto main before finishing it, not after**, especially any
  branch touching `src/app/`, where this codebase moves addresses.
- **After merging a branch older than a move, list the files it added or
  changed and check each path still exists on main.** `git diff --name-status`
  against the merge base says it in one line.
- **Then prove the code is REACHED, not merely present.** Drive the real
  address (the one a link, a seat token or a redirect actually produces)
  rather than importing the module.

### Two More Ways A Clean Merge Is Wrong

- **A rename leaves dead links in files the rename never touched.** Grep the
  OLD name across the whole tree after the rename lands, not only the files
  the rename touched.
- **A generated artefact whose source another branch rewrites.** When a merge
  brings in a file that something else is DERIVED from, re-run the derivation
  rather than reading the diff (`pnpm art:thumbs` for the thumbnails cut from
  `public/art/games/<variant>.jpg`). Ask of any merge: **what in this tree was
  made out of a file this branch just changed?**
- `src/lib/record/boardArt.coverage.test.ts` hashes the files that decide how a
  board is drawn and compares it with the stamp `pnpm screenshots:games` leaves
  behind, so a board change FAILS the build until the pictures are re-taken.

### A Tolerant Assertion Enumerates What It TOLERATES

A test that accepts more than one answer must list the answers it accepts,
never the ones it rejects, as `e2e/seat-token-privacy.spec.ts` does:

```ts
if (made.status() !== 201) {
  expect([400, 404, 422]).toContain(made.status());
  return;
}
```

Never `expect(status).not.toBe(500)`, and never add a status that means
the test did not get far enough to look (401 here) to be accommodating. A green test must be a statement about the code, and "I could
not get far enough to look" is not one.

### A Fixture Must Make The Row It Signs In As

- `/api/session` with `kind: "admin"` mints a session and nothing else: no
  member row (`touchMember` returns early when there is none), so every route
  asking `currentMemberId()` answers 401 without one. The suite makes the row
  it authenticates as.
- **A fixture that repairs a missing row must not also edit a present one.**
  `ensureMember` is create-only, with a deliberately empty `update`; never use
  `seedMember` for this (it upserts and writes a name, a country and a bio).
- **The row it signs in as must be nobody's.** The operator is
  `operator@example.test` (`suiteOperator()` in `e2e/operator.ts`, overridable
  by `E2E_OPERATOR_EMAIL` within `@example.test`), its row is swept and remade
  each run, and `auth.setup.ts` refuses to start when that address is not in
  `ADMIN_EMAILS`: add it to the END of your `.env`'s list. A spec needing the
  operator's address reads `suiteOperator()`, never `ADMIN_EMAILS` or a literal.

### A Killed Job Reports As Cancelled, Not Failed

- `timeout-minutes` firing shows up as `cancelled` in `gh run list`, the same
  as a person pressing the button.
- **`concurrency: cancel-in-progress` on the deploy workflow means a push kills
  the deploy under it.** So after the last push of a session, check what
  production is serving rather than the run, once, with the `vercel ls` call
  of the checklist's step 8: it must print `READY` and the sha you pushed. It
  is a check, never a wait: not in a loop, not on a timer.
- The site is behind Vercel Bot Protection set to Challenge, so a plain `curl`
  answers 429. Do not try to get round the challenge with headers or a changed
  user agent, and do not load a page to check: a page load is billed server
  time.
- **To wait for a deploy, ask GitHub, and ask about the one job that deploys.**
  Poll the vercel-deploy run's `deploy` job once a minute with
  `gh run view <id> --json jobs`, and read that job's status rather than the
  run's (the run also carries the e2e job, which says nothing about whether
  the site is live). When `deploy` has finished, make the one call above.
- The `Remove superseded deployments` step in `vercel-deploy.yml` removes every
  deployment but the live one and the one before it (the instant rollback). It
  is not one to soften, skip or make optional.
- The two concurrency groups are deliberately opposite: `vercel-deploy.yml`
  cancels in progress (a superseded deploy is worthless); `ci.yml` keeps a
  group of its own per push (a superseded test run is evidence), and pull
  requests share a group per PR. GitHub keeps one running and one PENDING run
  per group, and a new run cancels the pending one whatever
  `cancel-in-progress: false` says: a CI run reading `cancelled` with no jobs
  was replaced, not stopped.

### An Absence Is Only Meaningful After A Presence Has Been Waited For

- `toHaveCount(0)` and `not.toContainText` pass the instant they are asked.
  **Wait for something that IS on the page before asserting that something
  else is not**: usually a sibling (the form the control would have been in,
  the list the row would have been in).
- **A skip is an absence too**: a spec that skips on database CONTENTS ("no
  computer players on this database") reports green and asserts nothing.
- **Do not add a remedy to this file and consider the matter closed; go and
  apply it, or say plainly that it is not applied.** Where `ready()` /
  `readyHere()` and `readyMark` are applied, spec by spec, is
  `docs/plans/e2e-ready-sweep.md`; a spec that waits through a helper
  (`openSetUpPage`, `startAndBegin`) waits.

### One Session Owns The Browser, And Verifies Rather Than Relays

- The database is the lock, not the port: every worktree shares
  `localhost:55434` and every Playwright run shares `test-results/`, so two
  runs on two different `WEB_PORT`s collide.
- One session owns the browser and hands it on; everybody else asks that
  session, including when it is urgent, and including when somebody else has
  just said it is free.
- **The holder is established by looking, not by asking**: `ps aux | grep
  playwright` says who is actually running, from which checkout.
- With a Postgres of its own per worktree (the checklist's step 2), the lock
  only matters for a run against the shared database on 55434.

### A Spec Should Bring Its Own World

- A spec must not assert anything about a name, a count or a row it did not
  itself create. A spec signed in as the suite's one member inherits every
  unfinished board other tests left behind: have the spec claim its own seats
  as a browser holding an invite and no account, so its queue holds exactly the
  games it created.
- A spec that skips on database CONTENTS reports green and asserts nothing:
  seed what the spec needs rather than skip, and never loosen an assertion
  until it passes.
- A green run is a statement about THAT DATABASE as much as about the code; it
  does not travel.

### A Scratch File In The Shared Checkout Is Somebody Else's Commit

- **Temporary files go in the session's scratchpad**, never in the repository.
  The one case that needs it is a runner that needs `@/` aliases and
  `server-only`, which only resolve under vitest from inside the project: put
  it in `src/`, run it, and **delete it in the same breath**, before anything
  else can stage it.
- **`git add -A` in a shared checkout stages other people's work in progress.**
  Prefer naming the paths you mean. If you do stage everything, read the list
  before committing: a file you have never heard of is somebody else's. (The
  checklist's step 10 says never `git add -A` at all.)
- **After merging a branch, check for files it added that you did not expect**:
  `git diff --name-status` against the merge base, read for additions as well
  as for paths that have moved.

### A Raw Control Byte In Source Makes The File Opaque

- **Write a control character as its escape, never as the byte**: `\0`, `\t`,
  `\u001f` (a NUL separator in a map key, `${type}\0${subject}`, is fine as an
  escape).
- **A grep that returns nothing on a file you know contains the thing is a
  fact about the file, not the pattern.** `file <path>` settles it ("data"),
  and `git diff --numstat` showing `-` for a source file is the same signal.

### Three Things A Worktree Gets Wrong Before Any Code Runs

- **A worktree installed before its `.env` is copied in gets a Prisma client
  that loads no `.env`, for its whole life** (the client records the `.env`
  path at `prisma generate` time, `relativeEnvPaths`, and `pnpm install`'s
  postinstall generates it). The symptom is `Environment variable not found:
  DATABASE_URL` in every vitest runner. Copy `.env` in BEFORE `pnpm install`,
  or run `pnpm db:generate` after. (In the main checkout an inline
  `DATABASE_URL` wins over the client's own `.env` load.)
- **`.auth/player.json` must be its own identity, never a copy of the admin
  state** (`seatsToSitAt` filters the stranger's seat out as the reader's own).
  Mint it by redeeming an invite, as `auth.setup.ts` does; the `--no-deps`
  route skips that setup, so it is on you.
- **The session scratchpad is shared between the agents of one session.**
  Prefix every scratchpad filename with something of yours, and never trust a
  generic name you did not just write.

### The Stash Stack Is One Stack For Every Worktree

- Worktrees are isolated; **the stash is not**: `git stash` from any worktree
  pushes onto the one stack the repository has. Never a bare `pop`; name the
  stash and `git stash apply <sha>`. (The checklist's step 10 says never
  `git stash` at all.)
- **A worktree with no `node_modules` fails `pnpm typecheck` with "next:
  command not found".** `pnpm install` there, once.
- **"A file changed under me" in a worktree is your own rebase pulling in a
  change that landed on main**, not another session in your directory. Read
  the diff before assuming an intruder.
