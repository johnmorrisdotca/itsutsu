import Link from "next/link";

import { GameCount } from "@/components/games/GameCount";
import { GameName } from "@/components/games/GameName";
import { PlayerActions } from "./PlayerActions";
import type { NamedMember } from "@/lib/auth/members";
import { playerKey } from "@/lib/rating/playerKey";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { recordPath } from "@/lib/gomoku/slugs";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import type { PlayerRecord } from "@/lib/history/playerRecord";
import type { TimeGiftRecord } from "@/lib/history/timeGifts";
import { countText, figuresOf, winRateText } from "@/lib/rating/figures";
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
      {record.byVariant.length > 0 ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
          <h3 className={SECTION_TITLE}>By game</h3>
          <table className="w-full text-sm" data-testid="player-by-variant">
            <thead>
              <tr className="text-left">
                <th className="pb-1.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">Game</th>
                <th className="pb-1.5 text-right text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
                  Played
                </th>
                <th className="pb-1.5 text-right text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
                  Won · Lost · Drawn
                </th>
                <th className="pb-1.5 text-right text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
                  Win rate
                </th>
              </tr>
            </thead>
            <tbody>
              {record.byVariant.map((row) => {
                const figures = figuresOf({ won: row.wins, lost: row.losses, drawn: row.draws });
                return (
                  <tr key={row.variant} className="border-t border-rule">
                    <td className="py-1.5 pr-3">
                      <GameName variant={row.variant} />
                    </td>
                    <td className="py-1.5 pr-3 text-right font-mono tabular-nums">
                      <GameCount
                        count={countText(figures.played)}
                        variant={row.variant}
                        player={name}
                        outcome="decided"
                        title={`Every game of ${variantLabel(row.variant)} ${name} has finished here`}
                      />
                    </td>
                    {/*
                      Each number goes to the games behind it. A record is three
                      counts and three filters, and printing them as one string
                      would make the reader take it apart again to ask the
                      question the page has already answered.
                    */}
                    <td className="py-1.5 pr-3 text-right font-mono tabular-nums">
                      <GameCount
                        count={figures.won}
                        variant={row.variant}
                        player={name}
                        outcome="won"
                        title={`The games of ${variantLabel(row.variant)} ${name} won`}
                      />
                      {" · "}
                      <GameCount
                        count={figures.lost}
                        variant={row.variant}
                        player={name}
                        outcome="lost"
                        title={`The games of ${variantLabel(row.variant)} ${name} lost`}
                      />
                      {" · "}
                      <GameCount
                        count={figures.drawn}
                        variant={row.variant}
                        player={name}
                        outcome="drawn"
                        title={`The games of ${variantLabel(row.variant)} ${name} drew`}
                      />
                    </td>
                    <td className="py-1.5 pr-3 text-right font-mono tabular-nums">{winRateText(figures.winRate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

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
                      href={playerPath(game.opponent)}
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
                  <Link href={recordPath(game.variant, game.id)} className="text-xs underline-offset-2 hover:underline">
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
