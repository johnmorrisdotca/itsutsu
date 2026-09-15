import Link from "next/link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { PlayerName } from "@/components/players/PlayerName";
import { familyPath, matchPath } from "@/lib/gomoku/slugs";
import { playerPath } from "@/lib/rating/playerKey";

import type { AwardAboutProps } from "./xp.types";

/**
 * What one XP award was about, drawn the way this site draws that kind of thing.
 *
 * Its own file since the ledger stopped being `/me`'s alone: a player's page
 * draws the same awards, and two copies of this would be two answers to "what
 * does a match-keyed award link to" within a week. `whose` is the one thing that
 * differs — "your rival" on your own ledger, "their rival" on somebody's page.
 *
 * Every branch that CAN lead somewhere does. The two that cannot say so in
 * words: a game that is no longer kept, and a subject this deploy cannot
 * resolve. A link that cannot keep its promise is worse than a plain word, and
 * saying so in the markup is what keeps the exception from looking identical to
 * an oversight.
 */
export function AwardAbout({ about, whose }: AwardAboutProps) {
  const yours = whose === "yours";

  if (about.of === "game") {
    return (
      <>
        <GameThumb variant={about.variant} size="small" className="mr-1.5 inline-block align-middle" />
        <GameName variant={about.variant} />
      </>
    );
  }

  if (about.of === "match") {
    if (about.variant === null) {
      return (
        <span
          className="text-muted"
          title={`This match is no longer kept — finished games are held for the number of days ${yours ? "you" : "they"} chose.`}
        >
          a match no longer kept
        </span>
      );
    }
    /*
     * BOTH, and neither instead of the other. The game's name leads to the
     * game — that is the standing rule wherever a game is named — and the match
     * is the thing this row is actually about, so it gets its own way in. One
     * link would have to choose between naming the game and reaching the board.
     */
    return (
      <>
        <GameThumb variant={about.variant} size="small" className="mr-1.5 inline-block align-middle" />
        <GameName variant={about.variant} />
        <span className="text-muted"> · </span>
        <Link href={matchPath(about.variant, about.gameId)} className="underline underline-offset-4">
          that match
        </Link>
      </>
    );
  }

  if (about.of === "family") {
    /*
     * A family is reached through one of its games; a retitled family has no
     * game to reach it through and keeps its words. See `familyNamed`.
     *
     * Styled the way `GameName` and `PlayerName` style themselves —
     * `hover:underline` — because a family's title IS a name, and a name drawn
     * differently from the game name in the row above it reads as a different
     * kind of thing. The always-underlined links in this column are the ones
     * that are PHRASES rather than names: "that match", "your rival".
     */
    return about.through === null ? (
      <span title="A family that has been renamed since this was earned.">{about.title}</span>
    ) : (
      <Link href={familyPath(about.through)} className="underline-offset-2 hover:underline">
        {about.title}
      </Link>
    );
  }

  if (about.of === "person") {
    return about.name === null ? (
      /*
       * No name, and no query spent getting one. `/players/<id>` IS the subject,
       * so the link is free; the name would cost a read of the members table for
       * a word the row's own label already implies. The computer players are the
       * other way round — their names are a constant — which is why that branch
       * has one and this one does not.
       */
      <Link href={playerPath("", about.memberId)} className="underline underline-offset-4">
        their page
      </Link>
    ) : (
      <PlayerName name={about.name} memberId={about.memberId} fallback="a computer player" />
    );
  }

  if (about.of === "rivalry") {
    return (
      <>
        <GameThumb variant={about.variant} size="small" className="mr-1.5 inline-block align-middle" />
        <GameName variant={about.variant} />
        <span className="text-muted"> · </span>
        <Link href={playerPath("", about.memberId)} className="underline underline-offset-4">
          {yours ? "your rival" : "their rival"}
        </Link>
      </>
    );
  }

  if (about.of === "words") {
    return about.stale === true ? (
      <span className="text-muted" title="Nothing on the site answers to this any more.">
        {about.said}
      </span>
    ) : (
      <span className="text-muted">{about.said}</span>
    );
  }

  // Nothing to point at, said as nothing rather than as a link back to the
  // member's own page — which is where every ledger of theirs already is.
  return <span className="text-muted">—</span>;
}
