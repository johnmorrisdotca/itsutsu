import Link from "@/components/ui/Link";

import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { gamePath, setUpPath, standingsPath } from "@/lib/gomoku/slugs";
import { monthWords, weekWords } from "@/lib/history/recordMonth";
import { PUZZLE_RECORD_SORTS, puzzleRecordAsked, puzzleRecordHref, type PuzzleRecordAsked } from "@/lib/puzzles/puzzleRecordAddress";
import { PUZZLE_CLOCK_DISPLAY, PUZZLE_KINDS } from "@/lib/puzzles/puzzles.constants";
import { levelLabel, puzzleName } from "@/lib/puzzles/puzzleCopy";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";
import type { PuzzleClock, PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { puzzleRecordOf, PUZZLE_RECORD_PAGE } from "@/lib/puzzles/server/puzzleRecord";
import { namesAndTagsOf } from "@/lib/xp/nameTagsOf";
import { shownName } from "@/lib/rating/shownName";

import { KumimojiWallpaper } from "./KumimojiWallpaper";
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
  const asked = puzzleRecordAsked(kind, query);
  const me = await currentMemberId();
  const say = await currentSpeaker();
  const name = puzzleName(kind, say.locale);
  const record = await puzzleRecordOf(kind, asked);
  const { names, tags } = await namesAndTagsOf([...record.solves.map((solve) => solve.memberId), ...(asked.member === null ? [] : [asked.member])]);
  const whose = asked.member === null ? null : asked.member === me ? say.say("pset.rec.yourSolvesChip") : say.say("pset.rec.theirSolvesChip", { name: shownName(names.get(asked.member) || say.say("points.board.aMember")) });
  const chips = chipsOf(kind, asked, whose, say);
  const pages = Math.max(1, Math.ceil(record.total / PUZZLE_RECORD_PAGE));

  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={say.say("pset.rec.title", { name })}
        kanji={say.pairsWithKanji ? "棋譜" : ""}
        crumb={<GameTrail game={{ label: name, href: gamePath(kind) }} steps={[{ label: say.say("pset.rec.allSolves") }]} />}
        lead={say.say("pset.rec.lead")}
      >
        <p className="flex flex-wrap gap-x-3 text-xs">
          <Link href={standingsPath(kind)} className="text-muted underline-offset-2 hover:underline">{say.say("pset.link.leaderboard")}</Link>
          {me === null ? null : (
            <Link href={puzzleRecordHref(kind, { member: me })} className="text-muted underline-offset-2 hover:underline" data-testid="record-just-mine">
              {say.say("pset.link.justMine")}
            </Link>
          )}
          <Link href={setUpPath(kind)} className="text-muted underline-offset-2 hover:underline">{say.say("pset.link.playOne")}</Link>
        </p>
      </PageTitle>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="puzzle-record" data-total={record.total}>
        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs" data-testid="record-narrowed">
            <span className="text-muted">{say.say("pset.rec.filteredBy")}</span>
            {chips.map((chip) => (
              <Link
                key={chip.key}
                href={chip.without}
                className="flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 hover:border-ink-soft"
                title={say.say("pset.rec.stopNarrowing", { label: chip.label })}
                data-testid="record-narrowing"
                data-narrowing={chip.key}
              >
                {chip.label}
                <span aria-hidden className="text-muted">×</span>
                <span className="sr-only">{say.say("pset.rec.remove")}</span>
              </Link>
            ))}
          </div>
        ) : null}

        <p className="flex flex-wrap gap-x-3 text-xs" data-testid="record-sort">
          <span className="text-muted">{say.say("pset.rec.sort")}</span>
          {[PUZZLE_RECORD_SORTS.newest, PUZZLE_RECORD_SORTS.fastest].map((sort) =>
            sort === asked.sort ? (
              <span key={sort} className="font-semibold" aria-current="true">
                {say.say(sort === PUZZLE_RECORD_SORTS.newest ? "pset.rec.newestFirst" : "pset.rec.fastestFirst")}
              </span>
            ) : (
              <Link key={sort} href={puzzleRecordHref(kind, { ...asked, sort, page: 1 })} className="underline-offset-2 hover:underline" data-testid={`record-sort-${sort}`}>
                {say.say(sort === PUZZLE_RECORD_SORTS.newest ? "pset.rec.newestFirst" : "pset.rec.fastestFirst")}
              </Link>
            ),
          )}
        </p>

        {record.tally !== null ? (
          <p className="text-sm" data-testid="record-tally" data-points={record.tally.points}>
            <span className="font-semibold tabular-nums">{say.count("puzzle.count.point", record.tally.points)}</span>
            {say.say("pset.rec.tallyHead", {
              puzzles: say.count("count.puzzle", record.tally.puzzles),
              when: asked.month === null ? (asked.week === null ? "" : say.say("pset.rec.inWhen", { when: weekWords(asked.week, say) })) : say.say("pset.rec.inWhen", { when: monthWords(asked.month, say) }),
            })}
            {say.pairsWithKanji ? " " : ""}
            <span aria-hidden>★</span>
            <span className="sr-only">{say.say("pset.rec.withStar")}</span>
            {say.say("pset.rec.tallyTail")}
          </p>
        ) : null}

        {/* Your own finished crosswords as one picture, fetched on the press and drawn in your browser. */}
        {kind === PUZZLE_KINDS.kumimoji && me !== null ? <KumimojiWallpaper /> : null}

        <RecordSolvesTable kind={kind} solves={record.solves} names={names} tags={tags} me={me} counted={record.tally?.counted ?? null} filtered={chips.length > 0} say={say} />

        {pages > 1 ? (
          <p className="flex flex-wrap items-center gap-3 text-sm" data-testid="record-pager">
            {asked.page > 1 ? (
              <Link href={puzzleRecordHref(kind, { ...asked, page: asked.page - 1 })} className="underline-offset-2 hover:underline" data-testid="record-newer">
                {say.say("pset.rec.previous")}
              </Link>
            ) : null}
            <span className="text-muted">
              {say.say("pset.rec.page", { page: String(asked.page), pages: String(pages) })}
            </span>
            {asked.page < pages ? (
              <Link href={puzzleRecordHref(kind, { ...asked, page: asked.page + 1 })} className="underline-offset-2 hover:underline" data-testid="record-older">
                {say.say("pset.rec.next")}
              </Link>
            ) : null}
          </p>
        ) : null}
      </section>
    </Page>
  );
}

/** The chips for what the record was narrowed to, each with the address that takes it off. */
function chipsOf(kind: PuzzleKind, asked: PuzzleRecordAsked, whose: string | null, say: Speaker): Chip[] {
  const off = (change: Partial<PuzzleRecordAsked>) => puzzleRecordHref(kind, { ...asked, ...change, page: 1 });
  const chips: (Chip | null)[] = [
    whose === null ? null : { key: "member", label: whose, without: off({ member: null }) },
    asked.size === null ? null : { key: "size", label: sizeWordIn(asked.size, kind, say), without: off({ size: null }) },
    asked.level === null ? null : { key: "level", label: levelLabel(asked.level, say.locale), without: off({ level: null }) },
    asked.clock === null ? null : { key: "clock", label: clockWords(asked.clock, say), without: off({ clock: null }) },
    asked.month === null ? null : { key: "month", label: say.say("record.finishedIn", { when: monthWords(asked.month, say) }), without: off({ month: null }) },
    asked.week === null ? null : { key: "week", label: say.say("record.finishedIn", { when: weekWords(asked.week, say) }), without: off({ week: null }) },
    asked.sort === PUZZLE_RECORD_SORTS.fastest ? { key: "sort", label: say.say("pset.rec.solvedFastest"), without: off({ sort: PUZZLE_RECORD_SORTS.newest }) } : null,
  ];
  return chips.filter((chip): chip is Chip => chip !== null);
}

/** A clock as a chip says it: "Rabbit 兎, one minute", or "No clock". */
function clockWords(clock: PuzzleClock, say: Speaker): string {
  const shown = PUZZLE_CLOCK_DISPLAY[clock];
  if (shown.ms === null) return say.locale === "ja" ? "時計なし" : shown.label;
  return `${say.pairsWithKanji ? `${shown.label} ${shown.kanji}` : shown.kanji} ${shown.time}`;
}
