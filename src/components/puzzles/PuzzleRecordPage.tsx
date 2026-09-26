import Link from "@/components/ui/Link";

import { thousands } from "@/components/about/XpCurve";
import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { gamePath, setUpPath, standingsPath } from "@/lib/gomoku/slugs";
import { monthWords, weekWords } from "@/lib/history/recordMonth";
import { PUZZLE_RECORD_SORTS, puzzleRecordAsked, puzzleRecordHref, type PuzzleRecordAsked } from "@/lib/puzzles/puzzleRecordAddress";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { puzzleRecordOf, PUZZLE_RECORD_PAGE } from "@/lib/puzzles/server/puzzleRecord";
import { namesAndTagsOf } from "@/lib/xp/nameTagsOf";
import { shownName } from "@/lib/rating/shownName";

import { sizeWord } from "./puzzles.constants";
import { RecordSolvesTable } from "./RecordSolvesTable";

type Query = Record<string, string | string[] | undefined>;

/** A filter the record applied, said as a chip, and the address without it. */
type Chip = { key: string; label: string; without: string };

/**
 * /games/<slug>/history FOR A PUZZLE: every solve of it kept here, by everybody.
 *
 * The puzzle's record, the way a game's /history is the game's: newest first,
 * or the solved ones fastest first, narrowed by who, size, level and month.
 * Every time on a board of solves opens one row of it (`SolveTime`), every
 * points figure opens one member's rows of it (`SolvePoints`), and the size
 * and level of a fastest row open that size and level of it, fastest first.
 *
 * EVERY NARROWING IS SAID, AND CAN BE TAKEN OFF: a chip per filter, each a link
 * to the same record without it, so a link that filtered is never silent.
 *
 * Members only, as the record of a game is (`src/proxy.ts` leaves
 * `/games/<slug>/history` shut). A child's solves are listed as a child's
 * games are: to members, never to a stranger.
 */
export async function PuzzleRecordPage({ kind, query }: { kind: PuzzleKind; query: Query }) {
  const copy = PUZZLE_DISPLAY[kind];
  const asked = puzzleRecordAsked(kind, query);
  const me = await currentMemberId();
  const record = await puzzleRecordOf(kind, asked);
  const { names, tags } = await namesAndTagsOf([...record.solves.map((solve) => solve.memberId), ...(asked.member === null ? [] : [asked.member])]);
  const whose = asked.member === null ? null : asked.member === me ? "Your" : `${shownName(names.get(asked.member) || "A member")}'s`;
  const chips = chipsOf(kind, asked, whose);
  const pages = Math.max(1, Math.ceil(record.total / PUZZLE_RECORD_PAGE));

  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={`${copy.label} · Record`}
        kanji="棋譜"
        crumb={<GameTrail game={{ label: copy.label, href: gamePath(kind) }} steps={[{ label: "Record" }]} />}
        lead="Every solve of it kept here, by everybody. Open a time to watch that solve again, step by step."
      >
        <p className="flex flex-wrap gap-x-3 text-xs">
          <Link href={standingsPath(kind)} className="text-muted underline-offset-2 hover:underline">standings</Link>
          {me === null ? null : (
            <Link href={puzzleRecordHref(kind, { member: me })} className="text-muted underline-offset-2 hover:underline" data-testid="record-just-mine">
              just mine
            </Link>
          )}
          <Link href={setUpPath(kind)} className="text-muted underline-offset-2 hover:underline">play one</Link>
        </p>
      </PageTitle>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="puzzle-record" data-total={record.total}>
        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs" data-testid="record-narrowed">
            <span className="text-muted">Narrowed to</span>
            {chips.map((chip) => (
              <Link
                key={chip.key}
                href={chip.without}
                className="flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 hover:border-ink-soft"
                title={`Stop narrowing to ${chip.label}`}
                data-testid="record-narrowing"
                data-narrowing={chip.key}
              >
                {chip.label}
                <span aria-hidden className="text-muted">×</span>
                <span className="sr-only">— remove</span>
              </Link>
            ))}
          </div>
        ) : null}

        <p className="flex flex-wrap gap-x-3 text-xs" data-testid="record-sort">
          <span className="text-muted">Order:</span>
          {[PUZZLE_RECORD_SORTS.newest, PUZZLE_RECORD_SORTS.fastest].map((sort) =>
            sort === asked.sort ? (
              <span key={sort} className="font-semibold" aria-current="true">
                {sort === PUZZLE_RECORD_SORTS.newest ? "newest first" : "fastest first"}
              </span>
            ) : (
              <Link key={sort} href={puzzleRecordHref(kind, { ...asked, sort, page: 1 })} className="underline-offset-2 hover:underline" data-testid={`record-sort-${sort}`}>
                {sort === PUZZLE_RECORD_SORTS.newest ? "newest first" : "fastest first"}
              </Link>
            ),
          )}
        </p>

        {record.tally !== null ? (
          <p className="text-sm" data-testid="record-tally" data-points={record.tally.points}>
            <span className="font-semibold tabular-nums">{thousands(record.tally.points)} points</span> from{" "}
            {record.tally.puzzles} {record.tally.puzzles === 1 ? "puzzle" : "puzzles"}
            {asked.month === null ? "" : ` in ${monthWords(asked.month)}`}
            {asked.week === null ? "" : ` in ${weekWords(asked.week)}`}: each puzzle counts once, at its best, and the
            rows marked <span aria-hidden>★</span><span className="sr-only">with a star</span> are the ones counted.
          </p>
        ) : null}

        <RecordSolvesTable kind={kind} solves={record.solves} names={names} tags={tags} me={me} counted={record.tally?.counted ?? null} filtered={chips.length > 0} />

        {pages > 1 ? (
          <p className="flex flex-wrap items-center gap-3 text-sm" data-testid="record-pager">
            {asked.page > 1 ? (
              <Link href={puzzleRecordHref(kind, { ...asked, page: asked.page - 1 })} className="underline-offset-2 hover:underline" data-testid="record-newer">
                ← Previous
              </Link>
            ) : null}
            <span className="text-muted">
              Page {asked.page} of {pages}
            </span>
            {asked.page < pages ? (
              <Link href={puzzleRecordHref(kind, { ...asked, page: asked.page + 1 })} className="underline-offset-2 hover:underline" data-testid="record-older">
                Next →
              </Link>
            ) : null}
          </p>
        ) : null}
      </section>
    </Page>
  );
}

/** The chips for what the record was narrowed to, each with the address that takes it off. */
function chipsOf(kind: PuzzleKind, asked: PuzzleRecordAsked, whose: string | null): Chip[] {
  const off = (change: Partial<PuzzleRecordAsked>) => puzzleRecordHref(kind, { ...asked, ...change, page: 1 });
  const chips: (Chip | null)[] = [
    whose === null ? null : { key: "member", label: `${whose} solves`, without: off({ member: null }) },
    asked.size === null ? null : { key: "size", label: sizeWord(asked.size, kind), without: off({ size: null }) },
    asked.level === null ? null : { key: "level", label: PUZZLE_LEVEL_DISPLAY[asked.level].label, without: off({ level: null }) },
    asked.month === null ? null : { key: "month", label: `Finished in ${monthWords(asked.month)}`, without: off({ month: null }) },
    asked.week === null ? null : { key: "week", label: `Finished in ${weekWords(asked.week)}`, without: off({ week: null }) },
    asked.sort === PUZZLE_RECORD_SORTS.fastest ? { key: "sort", label: "Solved, fastest first", without: off({ sort: PUZZLE_RECORD_SORTS.newest }) } : null,
  ];
  return chips.filter((chip): chip is Chip => chip !== null);
}
