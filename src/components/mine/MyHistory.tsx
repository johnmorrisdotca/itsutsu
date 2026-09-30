import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { PlayerName } from "@/components/players/PlayerName";
import { CardArrow } from "@/components/ui/CardArrow";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS, RAISED_LINK, STRETCHED_HOST } from "@/components/ui/ui.constants";
import type { HistoryEntry, HistoryPage, HistoryState } from "@/lib/history/everyGame.types";
import type { NameTag } from "@/lib/xp/nameTag.types";

import { GroupHeading } from "./GroupHeading";
import { ago } from "./MyGameRow";
import { MY_GAMES_COPY, MY_PUZZLE_ROW } from "./mine.constants";

/** The states a game is still going in: its row carries on with it rather than looking back. */
const GOING: readonly HistoryState[] = ["yourMove", "theirMove", "going"];

/** Who else was in it, each leading to their page where they have one; nobody for a game on one screen or a puzzle. */
function Others({ entry, tags }: { entry: HistoryEntry; tags: ReadonlyMap<string, NameTag> }) {
  const copy = MY_GAMES_COPY.history;
  if (entry.others.length === 0) return entry.source === "solve" || entry.source === "run" ? null : <span>{copy.alone}</span>;
  return (
    <>
      {entry.others.map((other, index) => (
        <span key={index} className={RAISED_LINK}>
          {other.memberId !== null ? (
            <PlayerName name={other.name} memberId={other.memberId} fallback={copy.guest(index)} tag={tags.get(other.memberId)} testId="history-player" />
          ) : other.computer ? (
            other.name || copy.computer
          ) : (
            // Somebody at the same screen, known only by the name typed for them: no page to lead to, no marks to draw.
            <span data-testid="history-player">{other.name || copy.guest(index)}</span>
          )}
          {index < entry.others.length - 1 ? "," : ""}
        </span>
      ))}
    </>
  );
}

/**
 * EVERY GAME A MEMBER HAS PLAYED, OF EVERY KIND, ONE LIST — My games' History
 * tab (`everyGame.ts`). Each row names the game (its picture and its page),
 * who else was in it, how it stands, and when it last moved, and opens it:
 * carried on with where it is still going, looked back at where it is over.
 * A page at a time, newest first; an empty history keeps its heading and says
 * so, with the way to a first game.
 */
export function MyHistory({
  page,
  total,
  now,
  tags,
  older,
  newest,
  theirs = false,
}: {
  page: HistoryPage;
  total: number;
  now: Date;
  tags: ReadonlyMap<string, NameTag>;
  older: string | null;
  newest: string | null;
  /** Somebody else's history, read by the reader (`PlayerHistory`): their side's words, and watching rather than carrying on. */
  theirs?: boolean;
}) {
  const copy = MY_GAMES_COPY.history;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="history">
      <GroupHeading label={copy.label} kanji={copy.kanji} total={total} showing={page.entries.length < total ? page.entries.length : null} testId="history" />
      <p className="text-xs text-muted">{theirs ? copy.theirs.hint : copy.hint}</p>
      {page.entries.length === 0 ? (
        <p className="text-sm text-muted" data-testid="history-empty">
          {copy.empty}{" "}
          <Link href="/games/new" className="font-medium text-ink underline underline-offset-4">
            {copy.firstGame} →
          </Link>
        </p>
      ) : null}
      <ul className="flex flex-col gap-1.5">
        {page.entries.map((entry) => (
          <HistoryRow key={entry.key} entry={entry} now={now} tags={tags} theirs={theirs} />
        ))}
      </ul>
      {newest !== null || older !== null ? (
        <div className="flex gap-2">
          {newest !== null ? (
            <Link href={newest} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3`} data-testid="history-newest">
              ← {copy.newest}
            </Link>
          ) : null}
          {older !== null ? (
            <Link href={older} className={`${BUTTON_BASE} ${BUTTON_QUIET} ml-auto px-3`} data-testid="history-older">
              {copy.older} →
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** One game of the history: its picture and name, who else was in it, how it stands and when, opening to carry on or look back. */
export function HistoryRow({ entry, now, tags, theirs = false }: { entry: HistoryEntry; now: Date; tags: ReadonlyMap<string, NameTag>; theirs?: boolean }) {
  const copy = MY_GAMES_COPY.history;
  // Somebody else's game reads from their side, and a game still going is watched rather than carried on with.
  const words = theirs ? { state: { ...copy.state, ...copy.theirs.state }, open: copy.theirs.open } : copy;
  const going = GOING.includes(entry.state);
  return (
    <li
      className={`${STRETCHED_HOST} ${MY_PUZZLE_ROW}`}
      data-testid="history-entry"
      data-source={entry.source}
      data-game={entry.game}
      data-state={entry.state}
    >
      <Link href={entry.href} data-card-link="" className="absolute inset-0 rounded-lg" aria-label={going ? words.open.going : words.open.over} />
      <GameThumb variant={entry.game} size="small" />
      <span className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
        <span className="truncate font-medium">
          <GameName variant={entry.game} raised />
        </span>
        <span className="flex flex-wrap gap-x-1 text-xs text-muted">
          <Others entry={entry} tags={tags} />
        </span>
        <span className="text-xs">
          <span className="font-semibold" data-testid="history-state">
            {words.state[entry.state]}
          </span>
          <span className="text-muted"> · {ago(entry.at, now)}</span>
        </span>
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        <Link href={entry.href} className={`${BUTTON_BASE} ${BUTTON_QUIET} ${RAISED_LINK} shrink-0`} data-testid="history-open">
          {going ? words.open.going : words.open.over} →
        </Link>
        <CardArrow />
      </span>
    </li>
  );
}
