import Link from "next/link";

import { GameName } from "@/components/games/GameName";
import { PlayerActions } from "./PlayerActions";
import { RecordTable } from "./RecordTable";
import type { NamedMember } from "@/lib/auth/members";
import { playerKey } from "@/lib/rating/playerKey";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { matchPath } from "@/lib/gomoku/slugs";
import type { PlayerRecord } from "@/lib/history/playerRecord";
import type { TimeGiftRecord } from "@/lib/history/timeGifts";
import { playerPath } from "@/lib/rating/playerKey";
import { shownName } from "@/lib/rating/shownName";

/**
 * What somebody has done here: the games by kind, the last few of them, and
 * what they have done with the clock.
 *
 * This is the Itsutsu tab of a player's page. A member who also has a record
 * from before this site gets a tab per site beside it, and the same figures
 * are worked out the same way in every one of them.
 */
export function ItsutsuRecord({
  name,
  record,
  opponents,
  gifts,
  emptyNote,
}: {
  /**
   * Whose record this is, which the record itself does not carry.
   *
   * Threaded in rather than looked up because every number here is a link to
   * the games behind it, and "their games" needs a name to be their games.
   */
  name: string;
  record: PlayerRecord;
  /**
   * Who the opponents in Recent Games are, and what the reader may do about
   * them.
   *
   * "Every opponent you are shown offers what you would want to do about
   * them" is a rule on this repo's own checklist, and this list was the place
   * that quietly did not keep it: it named ten people and offered a link to
   * go and read about each of them. The decision a reader makes here is
   * whether to play somebody, and it was made two pages away.
   *
   * Empty when nobody is signed in, so a page nobody can act on costs no
   * lookup at all.
   */
  opponents?: {
    members: Map<string, NamedMember>;
    buddies: Set<string>;
    ignored: Set<string>;
    mine: string | null;
    signedIn: boolean;
  };
  gifts: TimeGiftRecord;
  /**
   * What an empty record means here, when it means something other than "not
   * yet". A kept record's is never going to fill up, and telling somebody
   * that a rating appears after their first game would be telling them to
   * wait for a game that cannot happen.
   */
  emptyNote?: string;
}) {
  if (record.games === 0) {
    return (
      <p className={`${PANEL_CLASS} text-sm text-muted`} data-testid="player-no-games">
        {emptyNote ?? "No finished games yet. A rating appears after the first one against another member."}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
        <h3 className={SECTION_TITLE}>By game</h3>
        {/*
          THE SAME TABLE AS EVERY OTHER RECORD ON THE SITE, which is what
          changed here. This had its own headings — "Won · Lost · Drawn" as ONE
          right-aligned column of three linked numbers, where the ladder and
          the members list give W, L and D a column each — and its own heading
          typography, a near-miss of the shared one. A reader going from a
          player's page to the members list met the same five facts drawn two
          different ways.

          NO RATING COLUMN, and that is a decision rather than an omission.
          These rows count EVERY finished game — rated or friendly, against a
          person or a program, both pools together — and no single rating
          belongs to such a row: a rating is one pool's rated games. The site's
          per-game ratings are on the /me record tab and the game's own ladder,
          where the rows are the right shape to carry them. A column of dashes
          here would say nothing while looking like an answer.
        */}
        <RecordTable
          subject="Game"
          rows={record.byVariant.map((row) => ({
            key: row.variant,
            subject: <GameName variant={row.variant} />,
            record: row,
            /*
              Every finished game of this one game, which is what "decided"
              means: the abandoned ones are not results and are not counted, so
              the link must leave them out too. No `rated` and no `pool` —
              unlike a ladder's row, this number really is all of them.
            */
            of: { player: name, variant: row.variant },
            /*
              And the run over exactly those games, worked out in the same pass
              that counted them. It is NOT the streak stored on the rating row:
              that one counts rated games, and this column does not. Two
              different numbers, and showing the stored one here would be a run
              the counts beside it cannot account for.
            */
            streak: row.streak,
          }))}
          columns={{ rating: false }}
          testId="player-by-variant"
          empty={<>No finished games here yet.</>}
        />
      </section>

      {record.recent.length > 0 ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
          <h3 className={SECTION_TITLE}>Recent games</h3>
          <ul className="flex flex-col divide-y divide-rule text-sm">
            {record.recent.map((game) => (
              <li key={game.id} className="flex items-center justify-between gap-3 py-1.5">
                <span>
                  <GameName variant={game.variant} /> · vs{" "}
                  {game.opponent ? (
                    <Link
                      href={playerPath(
                        game.opponent,
                        opponents?.members.get(playerKey(game.opponent))?.id,
                      )}
                      className="underline-offset-2 hover:underline"
                      data-testid="player-opponent"
                    >
                      {shownName(game.opponent)}
                    </Link>
                  ) : (
                    "anonymous"
                  )}
                </span>
                <span className="flex flex-wrap items-center justify-end gap-3">
                  <span className="font-mono text-xs tabular-nums">{game.outcome}</span>
                  <Link href={matchPath(game.variant, game.id)} className="text-xs underline-offset-2 hover:underline">
                    replay
                  </Link>
                  {/*
                    And what to do about the person, beside the game they were
                    in. `PlayerActions` decides who gets what — a kept record
                    and yourself get nothing, a program is offered a game and
                    not a friendship — so this only has to hand it the facts.
                  */}
                  <OpponentActions name={game.opponent} opponents={opponents} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {gifts.gaveIn > 0 || gifts.receivedIn > 0 ? (
        <p className="text-xs text-muted" data-testid="time-gifts">
          With the clock:{" "}
          {gifts.gaveIn > 0
            ? `gave the other side more time in ${gifts.gaveIn} game${gifts.gaveIn === 1 ? "" : "s"}`
            : "never needed to give time"}
          {gifts.receivedIn > 0
            ? `; was given time in ${gifts.receivedIn}, and went on to win ${gifts.wonAfterReceiving} and lose ${gifts.lostAfterReceiving} of those`
            : ""}
          .
        </p>
      ) : null}
    </div>
  );
}

/** What the reader may do about one opponent, or nothing at all. */
function OpponentActions({
  name,
  opponents,
}: {
  name: string;
  opponents?: {
    members: Map<string, NamedMember>;
    buddies: Set<string>;
    ignored: Set<string>;
    mine: string | null;
    signedIn: boolean;
  };
}) {
  if (opponents === undefined || !opponents.signedIn || name.trim() === "") return null;
  const them = opponents.members.get(playerKey(name));
  // Somebody who never signed in — a name typed into a game at one screen —
  // is not an account to ask anything of, and an offer to play them would be
  // an offer nobody is on the other end of.
  if (them === undefined) return null;
  return (
    <PlayerActions
      compact
      testId="opponent-actions"
      email={them.email}
      memberId={them.id}
      isBuddy={them.email !== null && opponents.buddies.has(them.email)}
      ignoring={them.email !== null && opponents.ignored.has(them.email)}
      isComputer={Boolean(them.botTier)}
      isYou={them.email !== null && them.email === opponents.mine}
      signedIn={opponents.signedIn}
    />
  );
}
