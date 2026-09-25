import Link from "next/link";
import type { ReactNode } from "react";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { PlayerName } from "@/components/players/PlayerName";
import { LocalTime } from "@/components/ui/LocalTime";
import { FEED_KINDS } from "@/lib/feed/feed.constants";
import type { FeedEntry, FeedPerson } from "@/lib/feed/feed.types";
import { entryPhrase, phraseParts } from "@/lib/feed/feedWords";
import type { Speaker } from "@/lib/i18n/i18n";
import { matchPath } from "@/lib/gomoku/slugs";
import { playerPath } from "@/lib/rating/playerKey";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { xpHistoryHref } from "@/lib/xp/xpHistoryDays";

/**
 * ONE LINE OF THE FEED: the game's picture where there is a game, the sentence
 * in the reader's language with every name in it a link, and when it happened.
 *
 * Nothing is a dead end. The subject and the other player lead to their pages
 * (`PlayerName`), the game's name to the game (`GameName`), a game line to the
 * game itself, experience to that member's own XP history, and a level to the
 * level's page. No count of games is printed: a game is its own line.
 */
export function FeedLine({ entry, say }: { entry: FeedEntry; say: Speaker }) {
  const variant = "variant" in entry ? entry.variant : null;
  const gameId = "gameId" in entry ? entry.gameId : null;
  const parts = phraseParts(say.say(entryPhrase(entry)));
  return (
    <li className="flex items-start gap-3 py-3" data-testid="feed-entry" data-kind={entry.kind} data-game-id={gameId ?? undefined} data-you={entry.you}>
      {variant !== null ? <GameThumb variant={variant} size="small" /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
        <p data-testid="feed-sentence">
          {parts.map((part, index) =>
            "text" in part ? <span key={index}>{part.text}</span> : <span key={index}>{slot(part.slot, entry, say)}</span>,
          )}
        </p>
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <LocalTime at={entry.at} />
          {gameId !== null && variant !== null ? (
            <Link href={matchPath(variant, gameId)} className="underline underline-offset-4" data-testid="feed-open">
              {say.say("feed.seeGame")}
            </Link>
          ) : null}
        </p>
      </div>
    </li>
  );
}

/** A person named in a line, leading to their page. */
function person(who: FeedPerson, say: Speaker, testId: string): ReactNode {
  return <PlayerName name={who.name} memberId={who.memberId} fallback={say.say("feed.somebody")} testId={testId} />;
}

/** What goes in one `{slot}` of a line's sentence. */
function slot(name: string, entry: FeedEntry, say: Speaker): ReactNode {
  switch (name) {
    case "who":
      return person(entry.who, say, "feed-who");
    case "other":
      return "other" in entry && entry.other !== null ? person(entry.other, say, "feed-other") : say.say("feed.somebody");
    case "game":
      return "variant" in entry ? <GameName variant={entry.variant} /> : null;
    case "xp":
      return entry.kind === FEED_KINDS.xp || entry.kind === FEED_KINDS.credited ? (
        <Link
          href={xpHistoryHref(playerPath(entry.who.name, entry.who.memberId), new URLSearchParams(), null)}
          className="underline-offset-2 hover:underline"
          data-testid="feed-xp"
        >
          {entry.points.toLocaleString("en-US")} {say.say("xp.unit")}
        </Link>
      ) : null;
    case "level":
      return entry.kind === FEED_KINDS.level ? entry.level : null;
    case "name":
      return entry.kind === FEED_KINDS.level ? (
        <Link href={levelPath(entry.level)} className="underline-offset-2 hover:underline" data-testid="feed-level">
          {xpLevelName(entry.level)}
        </Link>
      ) : null;
    case "count":
      return entry.kind === FEED_KINDS.puzzles ? entry.count : null;
    default:
      return null;
  }
}
