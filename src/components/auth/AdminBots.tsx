import { MemberKindBadge } from "@/components/auth/MemberKindBadge";
import { Paired } from "@/components/i18n/Paired";
import { PlayerName } from "@/components/players/PlayerName";
import { RecordTable, type RecordTableRow } from "@/components/players/RecordTable";
import { BOT_ALL_TIERS, BOT_PROFILES } from "@/lib/gomoku/opponent.constants";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import { MEMBER_KINDS } from "@/lib/auth/memberKind";
import { lastPlayedByMember } from "@/lib/history/lastPlayed";
import { fetchPlayedTallies } from "@/lib/history/playerRecord";
import { levelShown } from "@/lib/xp/levelShown";
import { tierFor } from "@/lib/rating/elo";
import { fetchComputerPlayers } from "@/lib/rating/players";
import { RATING_POOLS } from "@/lib/rating/pools";
import { gamesPlayed } from "@/lib/rating/shownRecord";

import { ADMIN_BOTS_COPY } from "./admin.constants";

/**
 * The computer players, on the operator's own page.
 *
 * WHY A TAB AND NOT A SECTION OF THE MEMBERS LIST. They were in that list,
 * badged as robots, among the people — and they are a different kind of row to
 * an operator: there is nothing to shut, no name to take off, nobody to write
 * to. What an operator wants of one is whether it is being played and whether
 * it is winning, which is four facts the members list does not carry. John:
 * "A Bots tab is good to split up Members from Bots."
 *
 * THE KEPT RECORDS ARE NOT HERE, and that is a decision rather than an
 * oversight — `ADMIN_BOTS_COPY.keptRecordsNote` says so on the page, because
 * the operator is the person most likely to go looking. They are PEOPLE whose
 * record from before this site is kept: the controls on the Members list are
 * the ones you point at a person, two rows do not make a tab, and the badge
 * already tells them apart. The split John asked for is people from programs.
 *
 * SERVER-RENDERED, AND ONLY WHEN THE TAB IS OPEN. A tab here is an address
 * (`/admin?view=bots`), so nothing on this page is fetched while the operator
 * is reading the Members list — which is what keeps the promise that the
 * Members list pays nothing for any of this. Three queries when it IS open:
 * the seven rows with their ratings, every finished game they have played, and
 * when each last played.
 *
 * THE SAME TABLE AS EVERY OTHER RECORD ON THE SITE, through `RecordTable`, for
 * the reason that component exists: five pages had invented five layouts for
 * the same five figures. An operator's page is not a reason to invent a sixth.
 */
export async function AdminBots() {
  const entries = await fetchComputerPlayers();
  /*
   * Easiest first, so the ladder reads itself — the order `BOT_ALL_TIERS` is
   * in, which is the order a player is offered them in. What comes back is
   * ordered by nothing useful: a computer player is never seen, so recency
   * sorts them by when their rows happened to be written.
   */
  const order: readonly string[] = BOT_ALL_TIERS;
  const shown = [...entries].sort(
    (a, b) => order.indexOf(a.botTier ?? "") - order.indexOf(b.botTier ?? ""),
  );
  const ids = shown.map((entry) => entry.id);
  const [tallies, lastPlayed] = await Promise.all([
    /*
     * Every finished game each has played, rated or not, in one query for
     * however many rows are on the tab — the same read the players page's
     * Computers tab and the members directory make, so all three agree about
     * the same bot. `entry.profile?.computer` is the RATED record alone, and
     * printing that under "played" is the fault 0.147.1 fixed: a bot with
     * thirty-six finished games and thirty-five unrated series runs showed 1.
     */
    fetchPlayedTallies(ids),
    lastPlayedByMember(ids),
  ]);

  const rows: RecordTableRow[] = shown.map((entry) => {
    const tier = (entry.botTier ?? "") as BotTier;
    const grade = BOT_PROFILES[tier] as (typeof BOT_PROFILES)[BotTier] | undefined;
    /*
     * The RATING comes from the computer-pool profile, which is a different
     * question from "how many games" and is right to answer only about the
     * rated ones. The ordinary rating would say they had never played at all:
     * a program never plays a person-against-person game, so that column sits
     * at its starting value for ever.
     */
    const computer = entry.profile?.computer ?? null;
    const when = lastPlayed.get(entry.id) ?? null;
    return {
      key: entry.id,
      // The grade as a hook for a test, so a spec can say the rows come out
      // easiest-first without reading names, which are copy and will change.
      attributes: { "data-tier": tier },
      subject: (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <PlayerName
              name={entry.name}
              memberId={entry.id}
              fallback=""
              className="font-medium"
              testId="admin-bot-name"
            />
            <MemberKindBadge kind={MEMBER_KINDS.robot} />
          </span>
          {/*
            THE GRADE AND WHEN IT LAST PLAYED, under the name rather than in
            columns of their own — `RecordTable` owns every column after the
            subject, deliberately, so that the figures cannot be spelled one
            way here and another way on the players page. The subject cell is
            the one slot a caller fills, and these two facts are about WHICH
            PLAYER this row is rather than about its record.
          */}
          <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted" data-testid="admin-bot-grade">
            {grade === undefined ? (
              tier
            ) : (
              <Paired en={grade.strength} kanji={grade.native ?? ""} kanjiClassName="font-mincho opacity-70" />
            )}
            <span data-testid="admin-bot-last-played">
              {/*
                Null is "no finished game", never a date — see
                `lastPlayedByMember`. A computer player's `lastSeenAt` is
                frozen at the moment its row was written, so this is the only
                recency it has, and printing that stamp instead would say every
                one of them had been here today.
              */}
              {when === null
                ? ADMIN_BOTS_COPY.neverPlayed
                : ADMIN_BOTS_COPY.lastPlayed(when.toISOString().slice(0, 10))}
            </span>
          </span>
        </span>
      ),
      record: gamesPlayed(tallies.get(entry.id)),
      /*
       * Every game this program has finished, in the pool it is the whole of —
       * a bot plays nothing else, so "this player, computer pool" is exactly
       * the set counted. `rated` is deliberately unset: "yes" would open a
       * shorter list than the number beside it promises, which is the dead-end
       * fault wearing a link.
       */
      of: { player: entry.name, pool: RATING_POOLS.computer },
      /*
       * THE RUN OVER EVERY GAME PLAYED, which is the set this row counts —
       * `Member.playedStreakKind`, read off the row `fetchComputerPlayers` was
       * fetching anyway, so it costs nothing. The three runs on the rating row
       * are over RATED games and would be described by the cell as a run over
       * every game, which they are not.
       */
      streak: entry.playedStreak,
      rating:
        computer === null || computer.ratedGames === 0
          ? null
          : { rating: computer.rating, pool: RATING_POOLS.computer },
      tier: tierFor(computer?.ratedGames ?? 0),
      /*
       * NO BADGE ON A PROGRAM, AND NOT BECAUSE IT IS A PROGRAM. `awardXp`
       * refuses a bot by name, so every one of these rows carries exactly
       * nought XP and `levelShown` answers null for all of them — the same rule
       * that keeps a badge off a member who has earned nothing. "Lv 1 · Insert
       * Coin" beside Meijin, who has played hundreds of games, would read as a
       * fact about its play and is not one; `xpBoard.ts` had this argument for
       * the leaderboard and settled it the same way.
       *
       * Wired rather than left out, so this table draws a level by the site's
       * one rule instead of by a local decision to have none. If a program ever
       * did earn a point the badge would appear, and it would be right.
       */
      level: levelShown(entry.xp),
    };
  });

  return (
    <section className="flex flex-col gap-3" data-testid="admin-bots">
      <p className="max-w-prose text-xs text-muted">{ADMIN_BOTS_COPY.lead}</p>
      <RecordTable
        subject={ADMIN_BOTS_COPY.player}
        rows={rows}
        columns={{ tier: true }}
        testId="admin-bots-table"
        rowTestId="admin-bot"
        /*
         * AN EMPTY TABLE IS DATA. A development database with no computer
         * players seeded yet still shows the headings and says why it is
         * empty, rather than hiding the shape of what this page keeps.
         */
        empty={<>{ADMIN_BOTS_COPY.empty}</>}
        caption={
          <p className="max-w-prose text-xs text-muted">
            {ADMIN_BOTS_COPY.ratingNote} {ADMIN_BOTS_COPY.keptRecordsNote}
          </p>
        }
      />
    </section>
  );
}
