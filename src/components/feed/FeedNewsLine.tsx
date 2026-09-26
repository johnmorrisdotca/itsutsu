import Link from "@/components/ui/Link";
import type { ReactNode } from "react";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { PlayerName } from "@/components/players/PlayerName";
import { sizeWord } from "@/components/puzzles/puzzles.constants";
import { LocalTime } from "@/components/ui/LocalTime";
import { isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { FEED_KINDS } from "@/lib/feed/feed.constants";
import type { FeedAddedEntry, FeedNewsEntry, FeedPerson } from "@/lib/feed/feed.types";
import { entryPhrase, phraseParts } from "@/lib/feed/feedWords";
import { bestTimeParts } from "@/lib/feed/siteNews";
import { SITE_NEWS } from "@/lib/feed/siteNews.constants";
import { matchPath, standingsPath } from "@/lib/gomoku/slugs";
import type { Speaker } from "@/lib/i18n/i18n";
import { clockText } from "@/lib/puzzles/clockText";
import { PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/**
 * ONE LINE OF THE SITE'S NEWS, or one day's new games.
 *
 * The same shape as `FeedLine` — the game's picture, the sentence with every
 * name in it a link, when it happened — and the same rule: nothing is a dead
 * end. A person leads to their page (`PlayerName`), a game to the game
 * (`GameName`), and the line to where the thing it tells can be seen more of:
 * the game itself, the ladder somebody now tops, the fastest times a solve
 * has just gone to the head of. No count of games is printed.
 */
export function FeedNewsLine({ entry, say }: { entry: FeedNewsEntry | FeedAddedEntry; say: Speaker }) {
  const parts = phraseParts(say.say(entryPhrase(entry)));
  const variant = entry.kind === FEED_KINDS.news ? entry.variant : null;
  const onward = entry.kind === FEED_KINDS.news ? onwardOf(entry, say) : null;
  return (
    <li
      className="flex items-start gap-3 py-3"
      data-testid="feed-entry"
      data-kind={entry.kind}
      data-id={entry.id}
      data-news={entry.kind === FEED_KINDS.news ? entry.news : undefined}
      data-named={entry.kind === FEED_KINDS.news ? entry.named : undefined}
      data-news-game={entry.kind === FEED_KINDS.news ? (entry.gameId ?? undefined) : undefined}
    >
      {variant !== null ? <GameThumb variant={variant} size="small" /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
        <p data-testid="feed-sentence">
          {parts.map((part, index) =>
            "text" in part ? <span key={index}>{part.text}</span> : <span key={index}>{slot(part.slot, entry, say)}</span>,
          )}
        </p>
        {entry.kind === FEED_KINDS.news ? (
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <LocalTime at={entry.at} />
            {onward}
          </p>
        ) : null}
      </div>
    </li>
  );
}

/** Where a news line leads for more of what it tells. */
function onwardOf(entry: FeedNewsEntry, say: Speaker): ReactNode {
  if (entry.variant === null) return null;
  const link = (href: string, words: string) => (
    <Link href={href} className="underline underline-offset-4" data-testid="feed-open">
      {words}
    </Link>
  );
  if (entry.news === SITE_NEWS.tookFirstPlace) return link(standingsPath(entry.variant), say.say("feed.seeLadder"));
  if (entry.news === SITE_NEWS.bestTime) return link(standingsPath(entry.variant), say.say("feed.seeFastest"));
  return entry.gameId === null ? null : link(matchPath(entry.variant, entry.gameId), say.say("feed.seeGame"));
}

function person(who: FeedPerson, say: Speaker, testId: string): ReactNode {
  return <PlayerName name={who.name} memberId={who.memberId} fallback={say.say("feed.somebody")} testId={testId} />;
}

/** A best time's board, as the fastest table writes it: "9×9 hard". */
function boardWords(entry: FeedNewsEntry): string {
  const parts = bestTimeParts(entry.subject);
  if (parts === null || entry.variant === null) return "";
  const kind = isPuzzleKind(entry.variant) ? entry.variant : undefined;
  const level = PUZZLE_LEVEL_DISPLAY[parts.level as PuzzleLevel]?.label.toLowerCase() ?? parts.level;
  return `${sizeWord(parts.size, kind)} ${level}`;
}

/**
 * A day's games, each with its picture and its name, joined as the reader's
 * language joins a list ("A, B and C"). `Intl` here is safe: this is drawn on
 * the server only, and nothing draws it a second time in the browser.
 */
function gamesList(variants: readonly string[], say: Speaker): ReactNode {
  const marks = variants.map((_, index) => `\u0000${index}\u0000`);
  const pieces = new Intl.ListFormat(say.tag, { style: "long", type: "conjunction" }).formatToParts(marks);
  return pieces.map((piece, index) => {
    if (piece.type === "literal") return <span key={index}>{piece.value}</span>;
    const variant = variants[Number(piece.value.replaceAll("\u0000", ""))] as string;
    return (
      <span key={index} className="inline-flex items-center gap-1 align-middle" data-testid="feed-added-game" data-variant={variant}>
        <GameThumb variant={variant} size="small" />
        <GameName variant={variant} />
      </span>
    );
  });
}

function slot(name: string, entry: FeedNewsEntry | FeedAddedEntry, say: Speaker): ReactNode {
  if (entry.kind === FEED_KINDS.added) return name === "games" ? gamesList(entry.variants, say) : null;
  switch (name) {
    case "who":
      return person(entry.who, say, "feed-who");
    case "other":
      return entry.other === null ? say.say("feed.somebody") : person(entry.other, say, "feed-other");
    case "game":
      return entry.variant === null ? null : <GameName variant={entry.variant} />;
    case "board":
      return boardWords(entry);
    case "time": {
      const parts = bestTimeParts(entry.subject);
      return parts === null ? null : (
        <span className="font-mono tabular-nums" data-testid="feed-time">
          {clockText(parts.elapsedMs)}
        </span>
      );
    }
    default:
      return null;
  }
}
