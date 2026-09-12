/**
 * Which release carried a row that was closed before the release tool could say.
 *
 * 109 of production's 189 done rows carry no `releasedIn`: they were marked
 * done by hand, before board convergence ITS-04 gave `pnpm release:take --done
 * <key>` the job of stamping the version and the instant as it closes a row.
 * `/releases` and `/backlog` read those two columns to say what shipped in
 * which release, so those rows say nothing.
 *
 * THE SCHEMA SAYS THIS CANNOT BE WORKED OUT, AND IT IS HALF RIGHT. Its
 * comment on `releasedIn` argues that the changelog "lists 126 releases and
 * dates none of them, so there is nothing for a date to fall between", and
 * that the releases that can be dated are "thirty-six that landed on one day,
 * which day granularity could not tell apart even if the dates were there".
 * Both sentences are true of the changelog read alone. Neither is true of
 * git: the commit that bumped `package.json` to a version is a measured
 * instant, to the second, for 175 of the 200 releases. So a timeline does
 * exist — it is just not in the file the comment was looking at.
 *
 * What still cannot be worked out is the other half, and it is why every
 * answer here is graded rather than returned flat. A row's `movedAt` is when
 * somebody CLOSED it, which for most of these rows is a sweep hours or days
 * after the work shipped, and for the ten rows `BACKLOG_SEED` carries as
 * already done is the instant the database was seeded. So the timeline cannot
 * PLACE a row. What it can do is REFUSE one: a release that went out after a
 * row was signed off did not carry it, and that is a fact, so the timeline is
 * used as a filter on the candidates and never as a reason to pick one.
 *
 * The evidence that actually places a row is textual. A changelog entry is
 * written in the same commit as the work, by the rule at the top of
 * CHANGELOG.md, and about the same request the row holds. `Grand Reversi
 * 大リバーシ, the flipping game on ten by ten` (the row) against `Grand Reversi
 * 大リバーシ: the flipping game on a 10×10 board, as ItsYourTurn had it`
 * (0.48.0) is not a guess. `A distraction-free mode that is remembered
 * between visits` against eleven entries that all mention a board is.
 *
 * Everything here is pure and returns new objects, the way the engine and
 * `backlog.ts` do. Nothing in this file reads a file, a database or git;
 * `scripts/derive-released-in.ts` gathers those and hands them in.
 */

/*
 * THE `.ts` ON THAT IMPORT IS DELIBERATE, and it is the one thing in this file
 * that looks like a mistake. `scripts/derive-released-in.ts` loads this module
 * by relative path and is run by `node` stripping types, and node's resolver
 * wants the extension it means — see tsconfig's own comment on
 * `allowImportingTsExtensions`, which is set for exactly this. Turbopack,
 * vitest and `tsc` all resolve it the same way, so nothing else changes.
 * The type import below needs no extension: a type import is erased before
 * node ever looks for a file.
 */
import {
  bestSharedRun,
  matchAgainst,
  rowWords,
  titleLength,
  wordWeights,
} from "./releasedInBackfill.words.ts";
import type {
  BackfillOptions,
  BackfillPlan,
  BackfillRow,
  BackfillTally,
  EvidenceRule,
  Mapping,
  ReleaseMoment,
  Unmapped,
} from "./releasedInBackfill.types";

/**
 * Exactly the four titles `e2e/backlog.spec.ts`'s `newTitle()` produces, each
 * followed by the run's clock as a base36 stamp.
 *
 * NOT LOAD-BEARING, deliberately. A litter row is refused by the ordinary
 * evidence rules anyway — no release entry is about it, because no release
 * carried it — so nothing here decides whether it is stamped. These patterns
 * only let a summary say "36 rows a browser test left behind, which `pnpm
 * backlog:cleanup-litter` sweeps" instead of listing 36 rows nothing could
 * place and leaving a reader to work out which of them matter.
 *
 * `scripts/cleanup-backlog-litter.ts` holds the same four patterns and is
 * self-contained by design. Two statements of one list is a cost, paid here
 * rather than by making a sweeper import from `src/`, and it is safe in the
 * one direction that matters: a pattern that drifts out of date changes a
 * word in a report, never whether a row is written.
 */
const LITTER_TITLES: readonly RegExp[] = [
  /^Keyboard shortcut for the scrubber [0-9a-z]+$/,
  /^A request the API will not finish [0-9a-z]+$/,
  /^A test request that walks the board [0-9a-z]+$/,
  /^A request somebody has picked up [0-9a-z]+$/,
];

/** Whether a row is one a browser test made and abandoned. */
export function looksLikeTestLitter(title: string): boolean {
  return LITTER_TITLES.some((pattern) => pattern.test(title.trim()));
}

/**
 * How much of a row's wording one release has to account for, and by how much
 * it has to beat the next best, before the answer is written to the board.
 *
 * Every one of these was set by running the real board and the real changelog
 * and reading what moved across the line, which is the only way to set them
 * honestly — and the direction of every choice is the same: a row nobody can
 * place stays empty. An empty column says "nobody established this", which is
 * what the schema comment asks for; a wrong version says something false in
 * the same place a true one would go.
 */
const CERTAIN_SCORE = 0.62;
const CERTAIN_MARGIN = 0.15;
const LIKELY_SCORE = 0.42;
const LIKELY_MARGIN = 0.08;
const POSSIBLE_SCORE = 0.25;

/** A title this much quoted by one note is that note's subject, whatever the words score. */
const QUOTED_RUN = 0.55;

/** How much more of the title the winner must quote than the next release, to have won on quoting. */
const QUOTE_MARGIN = 0.1;

/**
 * A quoted run only counts on a title long enough for the run to mean
 * something. Four words of a five-word title is a quotation; two words of a
 * three-word title is two words.
 */
const QUOTE_NEEDS_TITLE_WORDS = 5;

/**
 * HOW MANY DISTINCTIVE WORDS A `certain` NEEDS TO HAVE MATCHED, on top of the
 * score.
 *
 * The score is a ratio, and a ratio over a small denominator is not evidence
 * however high it goes. `Every game name on the About page links to its game`
 * reduces to two distinctive words once the site's own vocabulary is dropped,
 * both of which any linking release would use — and it scored a flawless
 * 1.000 against a release about something else, arriving at `certain` with
 * nothing behind it. That is the shape AGENTS.md calls a plausible value for
 * "I do not know", and a threshold on the ratio alone cannot see it, because
 * the ratio is genuinely 1.
 */
const CERTAIN_NEEDS_WORDS = 3;
const LIKELY_NEEDS_WORDS = 2;

/**
 * …UNLESS ONE OF THE MATCHED WORDS IS A FINGERPRINT, in which case two are
 * enough.
 *
 * A word this changelog has used in at most three of its 200 entries is not
 * a coincidence when a row uses it too. Measured on the real file, that line
 * separates the two cases the count alone could not:
 *
 *   champion    1 release    weight 0.500   ← `A champions page with a ladder`
 *   halma       1 release    weight 0.500
 *   wikipedia   1 release    weight 0.500
 *   gomoku      3 releases   weight 0.250
 *   ─────────────────────────────────────
 *   reversi     5 releases   weight 0.167
 *   ladder     12 releases   weight 0.077
 *   link       16 releases   weight 0.059
 *   name       35 releases   weight 0.028   ← `Every game name … links to its game`
 *
 * Both of those rows matched exactly two words at a score of 1.000. One of
 * them matched `champion`; the other matched `name` and `link`, which every
 * release about linking anything uses, and which placed it on a release about
 * something else. Rarity is what tells them apart, and the weights already
 * measure rarity, so this asks them rather than adding a rule of its own.
 */
const RARE_IN_AT_MOST_RELEASES = 3;
const RARE_WEIGHT = 1 / (1 + RARE_IN_AT_MOST_RELEASES);

/**
 * How long after a release a row may have been closed and still count as
 * carried by it.
 *
 * The rows in this working set were all closed well after their release, so
 * this is not about them: it is about not writing a rule that would be wrong
 * for a row closed by `release:take --done`, which stamps and closes in the
 * same pass and can land either side of the bump commit by a second.
 */
const CLOSING_GRACE_MS = 10 * 60 * 1000;

/**
 * Where each row belongs, with the evidence, or why it could not be placed.
 *
 * Rows are taken exactly as the board has them and nothing is written; the
 * caller decides what to do with a `certain`. A row that is not an unstamped
 * done row comes back unmapped rather than skipped, so a working set that was
 * gathered wrongly says so instead of quietly shrinking.
 */
export function planBackfill(
  rows: readonly BackfillRow[],
  releases: readonly ReleaseMoment[],
  options: BackfillOptions = {},
): BackfillPlan {
  const weights = wordWeights(releases);
  const mapped: Mapping[] = [];
  const unmapped: Unmapped[] = [];

  for (const row of rows) {
    if (row.status !== "done" || row.releasedIn !== null) {
      unmapped.push({
        key: row.key,
        title: row.title,
        reason: "not-an-unstamped-done-row",
        note: `Status is "${row.status}" and releasedIn is ${quoteOrNull(row.releasedIn)}; this backfill is for done rows with no release on them.`,
        best: null,
      });
      continue;
    }

    if (looksLikeTestLitter(row.title)) {
      unmapped.push({
        key: row.key,
        title: row.title,
        reason: "test-litter",
        note: "A row e2e/backlog.spec.ts created and left behind. No release carried it, so no release can be stamped on it; pnpm backlog:cleanup-litter is what this row wants.",
        best: null,
      });
      continue;
    }

    const placed = placeRow(row, releases, weights, options);
    if (placed.ok) mapped.push(placed.mapping);
    else unmapped.push(placed.unmapped);
  }

  return { mapped, unmapped };
}

type Placement = { ok: true; mapping: Mapping } | { ok: false; unmapped: Unmapped };

type Candidate = {
  release: ReleaseMoment;
  score: number;
  matched: string[];
  quoted: number;
  keyed: boolean;
};

/**
 * The releases that could have carried this row: the ones git can date, that
 * went out at or before the row was signed off.
 *
 * This is the timeline's whole contribution and it is a refusal, not a
 * choice. Filtering first rather than checking afterwards matters: `Away days
 * that hold a deadline open` tied 0.45.0 against 0.67.0 on wording and was
 * refused as ambiguous, when 0.67.0 went out nine hours AFTER the row was
 * closed and was never a candidate at all.
 */
function candidatesFor(row: BackfillRow, releases: readonly ReleaseMoment[]): ReleaseMoment[] {
  const closedBy = Date.parse(row.movedAt) + CLOSING_GRACE_MS;
  return releases.filter((release) => {
    if (release.at === null) return false;
    const at = Date.parse(release.at);
    return Number.isFinite(at) && at <= closedBy;
  });
}

function placeRow(
  row: BackfillRow,
  releases: readonly ReleaseMoment[],
  weights: ReadonlyMap<string, number>,
  options: BackfillOptions,
): Placement {
  const terms = rowWords(row);
  const eligible = candidatesFor(row, releases);
  if (eligible.length === 0) {
    return {
      ok: false,
      unmapped: {
        key: row.key,
        title: row.title,
        reason: "no-release-before-the-closing",
        note: `This row was closed at ${row.movedAt}, and git can date no release at or before that, so there is nothing it could have shipped in.`,
        best: null,
      },
    };
  }

  const scored: Candidate[] = eligible
    .map((release) => {
      const { score, matched } = matchAgainst(terms, release.notes, weights);
      return {
        release,
        score,
        matched,
        quoted: bestSharedRun(row.title, release.notes),
        keyed: release.notes.some((note) => note.includes(row.key)),
      };
    })
    .sort((left, right) => right.score - left.score || right.quoted - left.quoted);

  const best = scored.find((candidate) => candidate.keyed) ?? scored[0]!;
  const runnerUp = scored.find((candidate) => candidate.release.version !== best.release.version) ?? null;
  const margin = best.score - (runnerUp?.score ?? 0);
  const quotesTitle = best.quoted >= QUOTED_RUN && titleLength(row.title) >= QUOTE_NEEDS_TITLE_WORDS;
  const hits = best.matched.length;
  const fingerprints = best.matched.filter((word) => (weights.get(word) ?? 0) >= RARE_WEIGHT);
  const enoughWords = hits >= CERTAIN_NEEDS_WORDS || (hits >= LIKELY_NEEDS_WORDS && fingerprints.length > 0);

  let confidence: Mapping["confidence"] | null = null;
  let heldBackBy: string | undefined;
  if (best.keyed) confidence = "certain";
  else if (quotesTitle && best.score >= LIKELY_SCORE && hits >= LIKELY_NEEDS_WORDS) confidence = "certain";
  else if (best.score >= CERTAIN_SCORE && margin >= CERTAIN_MARGIN && enoughWords) confidence = "certain";
  else if (best.score >= LIKELY_SCORE && margin >= LIKELY_MARGIN && hits >= LIKELY_NEEDS_WORDS) {
    confidence = "likely";
    heldBackBy = describeShortfall(best.score, margin, hits, fingerprints.length);
  } else if (best.score >= POSSIBLE_SCORE) {
    confidence = "possible";
    heldBackBy = describeShortfall(best.score, margin, hits, fingerprints.length);
  }

  if (confidence === null) return fromCommitOrUnmapped(row, releases, best, runnerUp, options);

  /*
   * AMBIGUITY IS MEASURED ON BOTH MEASURES, not just the words. A quoted title
   * outranks a thin score, so the quote branch above can reach `certain` on a
   * margin of nothing — and if the runner-up quotes the title just as fully,
   * "the winner" is only whichever release the sort happened to put first.
   * Two releases that fit equally are not evidence for either, however
   * strongly they both fit.
   */
  const quoteMargin = best.quoted - (runnerUp?.quoted ?? 0);
  if (runnerUp !== null && !best.keyed && margin < LIKELY_MARGIN && quoteMargin < QUOTE_MARGIN) {
    return {
      ok: false,
      unmapped: {
        key: row.key,
        title: row.title,
        reason: "more-than-one-release-fits",
        note: `${best.release.version} (${round(best.score)}) and ${runnerUp.release.version} (${round(runnerUp.score)}) fit the words as well as each other, so neither is evidence.`,
        best: { version: best.release.version, score: round(best.score) },
      },
    };
  }

  /*
   * A version read off a changelog heading rather than a version bump can be
   * believed; the INSTANT beside it cannot. 0.113.0 to 0.120.0 shipped with no
   * bump at all and were written down a day later in one commit, and 0.2.0 to
   * 0.32.0 were written retroactively when versioning arrived. So a row placed
   * on one of those keeps its version and stops short of `certain`, because
   * `--run` writes `releasedAt` in the same breath as `releasedIn` and would
   * be writing an instant nobody measured.
   */
  const instantFrom = best.release.instantFrom ?? "version-bump";
  if (confidence === "certain" && instantFrom === "changelog-heading") {
    confidence = "likely";
    heldBackBy = `The wording places this in ${best.release.version} beyond doubt, but no commit ever bumped package.json to it — the instant is when the entry was WRITTEN, not when it went out, so releasedAt would be a date nobody measured.`;
  }

  return {
    ok: true,
    mapping: {
      key: row.key,
      title: row.title,
      releasedIn: best.release.version,
      releasedAt: best.release.at!,
      evidence: {
        rule: ruleFor(best, quotesTitle),
        quote: bestQuote(row, best.release),
        score: round(best.score),
        matchedWords: hits,
        rowWords: terms.length,
        runnerUp: runnerUp === null ? null : { version: runnerUp.release.version, score: round(runnerUp.score) },
        commit: best.release.commit,
        instantFrom,
        closedAt: row.movedAt,
      },
      confidence,
      ...(heldBackBy === undefined ? {} : { heldBackBy }),
    },
  };
}

function ruleFor(best: Candidate, quotesTitle: boolean): EvidenceRule {
  if (best.keyed) return "key-in-notes";
  return quotesTitle ? "title-in-notes" : "distinctive-words";
}

/** Which of the thresholds a candidate fell short of, so a reader need not work it out. */
function describeShortfall(score: number, margin: number, hits: number, fingerprints: number): string {
  const short: string[] = [];
  if (score < CERTAIN_SCORE) short.push(`score ${round(score)} under ${CERTAIN_SCORE}`);
  if (margin < CERTAIN_MARGIN) short.push(`only ${round(margin)} clear of the next release`);
  if (hits < CERTAIN_NEEDS_WORDS && fingerprints === 0) {
    short.push(`${hits} distinctive word${hits === 1 ? "" : "s"} matched and none of them rare, so ${CERTAIN_NEEDS_WORDS} were wanted`);
  }
  return short.join("; ");
}

/**
 * The last thing tried when no release's wording is about a row: a commit
 * message that names the key outright. The release is then the first bump at
 * or after that commit — the one that carried it out.
 */
function fromCommitOrUnmapped(
  row: BackfillRow,
  releases: readonly ReleaseMoment[],
  best: Candidate,
  runnerUp: Candidate | null,
  options: BackfillOptions,
): Placement {
  const naming = (options.commits ?? [])
    .filter((commit) => commit.message.includes(row.key))
    .sort((left, right) => left.at.localeCompare(right.at))[0];

  if (naming !== undefined) {
    const carried = firstReleaseAtOrAfter(releases, naming.at);
    if (carried !== null && carried.at !== null) {
      return {
        ok: true,
        mapping: {
          key: row.key,
          title: row.title,
          releasedIn: carried.version,
          releasedAt: carried.at,
          evidence: {
            rule: "commit-names-key",
            quote: `${naming.sha} ${naming.message.split("\n")[0]}`,
            score: round(best.score),
            matchedWords: best.matched.length,
            rowWords: rowWords(row).length,
            runnerUp: runnerUp === null ? null : { version: runnerUp.release.version, score: round(runnerUp.score) },
            commit: carried.commit,
            instantFrom: carried.instantFrom ?? "version-bump",
            closedAt: row.movedAt,
          },
          confidence: carried.instantFrom === "changelog-heading" ? "likely" : "certain",
        },
      };
    }
  }

  return {
    ok: false,
    unmapped: {
      key: row.key,
      title: row.title,
      reason: "no-release-names-it",
      note: `No release entry is about this row and no commit message names its key; the closest wording was ${best.release.version} at ${round(best.score)} of its distinctive words, which is not enough to call it.`,
      best: { version: best.release.version, score: round(best.score) },
    },
  };
}

/** The release note this row matched best, for quoting in the evidence. */
function bestQuote(row: BackfillRow, release: ReleaseMoment): string {
  const keyed = release.notes.find((note) => note.includes(row.key));
  if (keyed !== undefined) return keyed;
  let best = release.notes[0] ?? "";
  let bestRun = -1;
  for (const note of release.notes) {
    const run = bestSharedRun(row.title, [note]);
    if (run > bestRun) {
      bestRun = run;
      best = note;
    }
  }
  return best;
}

/** The first release taken at or after an instant — the one that carried that commit. */
export function firstReleaseAtOrAfter(releases: readonly ReleaseMoment[], at: string): ReleaseMoment | null {
  return releases
    .filter((release) => release.at !== null && release.at >= at)
    .sort((left, right) => (left.at ?? "").localeCompare(right.at ?? ""))[0] ?? null;
}

function quoteOrNull(value: string | null): string {
  return value === null ? "null" : `"${value}"`;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** How many rows landed at each confidence, and how many at each reason for not landing. */
export function tallyPlan(plan: BackfillPlan): BackfillTally {
  const reasons: Record<string, number> = {};
  for (const row of plan.unmapped) reasons[row.reason] = (reasons[row.reason] ?? 0) + 1;
  return {
    certain: plan.mapped.filter((row) => row.confidence === "certain").length,
    likely: plan.mapped.filter((row) => row.confidence === "likely").length,
    possible: plan.mapped.filter((row) => row.confidence === "possible").length,
    unmapped: plan.unmapped.length,
    reasons,
  };
}
