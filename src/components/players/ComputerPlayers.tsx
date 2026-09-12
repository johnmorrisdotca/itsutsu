import Link from "next/link";

import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { CountryMark } from "@/components/players/CountryMark";
import { MemberKindBadge } from "@/components/auth/MemberKindBadge";
import { MEMBER_KINDS } from "@/lib/auth/memberKind";
import { PlayerName } from "@/components/players/PlayerName";
import { RATING_POOLS } from "@/lib/rating/pools";
import { RecordTable, type RecordTableRow } from "./RecordTable";
import { RowActions } from "@/components/ui/Controls";
import { BOT_ALL_TIERS, BOT_SPECIALIST_LIST } from "@/lib/gomoku/opponent.constants";
import { tierFor } from "@/lib/rating/elo";
import type { DirectoryEntry } from "@/lib/rating/players";

/**
 * The players that are programs.
 *
 * They are members like anybody else — their own rows, their own ids, their
 * own pages — so this is a section of the directory rather than a different
 * kind of thing. It exists because a reader looking for somebody to play
 * should be able to find them together and see at a glance which is which,
 * rather than picking them out of a list of people by their badges.
 *
 * THE SAME TABLE AS EVERY OTHER RECORD ON THE SITE, which is what changed
 * here. This was a list of bordered cards reading "9 played · 0W 9L 0D · 0.0%
 * · 1466" — the same five facts as the ladder beside it, in a line of text
 * instead of columns, with no headings at all. John: "Computer Players is
 * where it's really messed up ... not consistent." A reader comparing Kyu with
 * Dan had to read two sentences and take them apart; now they read down a
 * column, exactly as they do everywhere else.
 *
 * The Play button stays, as the row's action column. It is the thing somebody
 * came to this tab to do, and the rule that every opponent you are shown
 * offers what you would want to do about them does not stop applying because
 * the list became a table.
 *
 * The rating shown is the one earned against the computer players, because
 * that is the only pool they play in: a bot never plays a person-versus-person
 * game, so its ordinary rating would sit at its starting value for ever and
 * printing that would be worse than printing nothing.
 */
export function ComputerPlayers({ entries }: { entries: DirectoryEntry[] }) {
  /*
   * Easiest first, so the ladder reads itself. The directory hands them over
   * in the order they were last seen, which for players who are always
   * here means an order that changes with whoever moved last.
   */
  const order: readonly string[] = BOT_ALL_TIERS;
  const shown = [...entries].sort(
    (a, b) => order.indexOf(a.botTier ?? "") - order.indexOf(b.botTier ?? ""),
  );
  /*
   * The two halves of the list are two different claims, so the paragraph
   * counts them separately rather than saying one thing about all of them.
   * "Opponents that will play any game on this board" stopped being true of
   * everybody the day a player arrived who plays one.
   */
  const specialists: readonly string[] = BOT_SPECIALIST_LIST;
  const graded = shown.filter((entry) => !specialists.includes(entry.botTier ?? ""));
  const experts = shown.filter((entry) => specialists.includes(entry.botTier ?? ""));

  const rows: RecordTableRow[] = shown.map((entry) => {
    /*
     * Their figures come from the computer pool, which is the only one they
     * play in. Reading the ordinary ones would say they had never played,
     * however many games they had just finished — which is exactly what the
     * page said the first time somebody beat Kyu.
     */
    const computer = entry.profile?.computer ?? null;
    return {
      key: entry.id,
      // The grade, so a browser test can say they come out easiest-first
      // without reading the names — which are copy and will change.
      attributes: { "data-tier": entry.botTier ?? "" },
      subject: (
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <PlayerName
            name={entry.name}
            memberId={entry.id}
            fallback=""
            className="font-medium"
            testId="computer-player-name"
          />
          <CountryMark country={entry.country} className="text-sm" />
          <MemberKindBadge kind={MEMBER_KINDS.robot} />
        </span>
      ),
      record: computer ?? { wins: 0, losses: 0, draws: 0 },
      of: { player: entry.name, pool: RATING_POOLS.computer, rated: "yes" },
      streak: computer?.streak ?? null,
      rating:
        computer === null || computer.ratedGames === 0
          ? null
          : { rating: computer.rating, pool: RATING_POOLS.computer },
      tier: tierFor(computer?.ratedGames ?? 0),
      actions: (
        <RowActions>
          <ChallengeButton memberId={entry.id} label="Play" />
        </RowActions>
      ),
    };
  });

  /*
   * No panel and no heading of its own: this is the body of the Computers
   * tab, and the tab has already said what it is.
   */
  return (
    <section className="flex flex-col gap-3" data-testid="computer-players">
      {/*
        The count is read from the list rather than written into the sentence.
        It said "three opponents, at three strengths" and went on saying it
        while there were five, which is the kind of small untruth a page tells
        for months because nobody thinks of a paragraph as something that can
        go out of date.

        It stays ABOVE the table. It is the only thing on this tab that says
        what these players are and why their rating is kept apart, and a table
        cannot say either.
      */}
      <p className="max-w-prose text-xs text-muted">
        {graded.length} opponents that will play any game on this board, from the gentlest to the strongest
        {experts.length > 0 ? (
          <>
            , and {experts.length} that play one game each and are the strongest thing here at it
          </>
        ) : null}
        . They hold a seat like anybody else and their games count: beating one moves your rating, and losing to one
        moves it the other way. They keep a rating of their own, earned against each other and against the people who
        play them — kept apart from the ladder, so a game against a program never changes where you stand among the
        people.
      </p>
      <RecordTable
        subject="Player"
        rows={rows}
        columns={{ tier: true, actions: "Play" }}
        testId="computer-players-table"
        rowTestId="computer-player"
        empty={
          <span data-testid="computer-players-empty">
            No computer players are set up on this site yet.
          </span>
        }
        caption={
          <p className="text-xs text-muted">
            Each of them has a page of their own, the same as anybody else: follow a name to see what
            they have played, or the{" "}
            <Link href="/players" className="underline underline-offset-4">
              players
            </Link>{" "}
            page for everybody.
          </p>
        }
      />
    </section>
  );
}
