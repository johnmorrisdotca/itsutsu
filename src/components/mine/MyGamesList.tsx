import Link from "next/link";
import { cookies } from "next/headers";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { SEAT_DISPLAY, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { matchPath, recordPath } from "@/lib/gomoku/slugs";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { currentEmail } from "@/lib/auth/currentSession";
import { keepFinishedDaysFor } from "@/lib/auth/members";
import { MY_GAME_GROUPS, STALE_AFTER_DAYS, fetchMyGames, type MyGame, type MyGameGroup } from "@/lib/history/myGames";
import { seatClaims } from "@/lib/history/seatCookie";
import { MY_GAMES_COPY } from "./mine.constants";
import { ResignButton } from "./ResignButton";

/** "3 days ago", the way a list of games reads it. */
function ago(iso: string, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/**
 * The games this browser holds a seat in, as the queue the turn-based sites
 * taught: yours to move first, then the ones you are waiting on, the ones
 * nobody has started, and lately finished ones. Nothing is shown when there
 * is nothing to show — the lobby is not the place for an empty list.
 */
export async function MyGamesList() {
  const claims = seatClaims((await cookies()).getAll());
  const email = await currentEmail();
  if (claims.size === 0 && email === null) return null;
  const now = new Date();
  const groups = await fetchMyGames(claims, email, now, await keepFinishedDaysFor(email));
  const total = MY_GAME_GROUPS.reduce((n, group) => n + groups[group].length, 0);
  if (total === 0) {
    if (email === null) return null;
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="my-games-empty">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          {MY_GAMES_COPY.title.label}
          <span className="font-mincho text-sm font-normal opacity-70">{MY_GAMES_COPY.title.kanji}</span>
        </h2>
        <p className="text-sm text-muted">
          Nothing waiting on you yet. Challenge someone from the{" "}
          <Link href="/players" className="underline underline-offset-4">players</Link> page, take an open
          seat below, or start a game and hand the other seat to a friend.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4" data-testid="my-games">
      <h2 className="flex items-baseline gap-2 text-lg font-semibold">
        {MY_GAMES_COPY.title.label}
        <span className="font-mincho text-sm font-normal opacity-70">{MY_GAMES_COPY.title.kanji}</span>
      </h2>
      {MY_GAME_GROUPS.map((group) =>
        groups[group].length === 0 ? null : (
          <Group key={group} group={group} items={groups[group].slice(0, group === "finished" ? 5 : 50)} now={now} />
        ),
      )}
    </section>
  );
}

function Group({ group, items, now }: { group: MyGameGroup; items: MyGame[]; now: Date }) {
  const copy = MY_GAMES_COPY.groups[group];
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid={`my-games-${group}`}>
      <h3 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {copy.label}
        <span className="font-mincho text-[0.8rem] font-normal tracking-normal">{copy.kanji}</span>
        <span className="font-normal tracking-normal">{items.length}</span>
      </h3>
      <p className="text-xs text-muted">{copy.hint}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <Row key={item.game.id} item={item} now={now} />
        ))}
      </ul>
    </div>
  );
}

function Row({ item, now }: { item: MyGame; now: Date }) {
  const { game, seat, group } = item;
  const black = game.blackName.trim() || SEAT_DISPLAY.one.label;
  const white = game.whiteName.trim() || SEAT_DISPLAY.two.label;
  const href = group === "finished" ? recordPath(game.variant, game.id) : matchPath(game.variant, game.id);
  const running = group !== "finished";
  return (
    <li
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
        group === "yourMove" ? "border-moss/50 bg-moss-soft" : "border-rule"
      }`}
      data-testid="my-game"
      data-id={game.id}
      data-stale={item.stale}
    >
      <Link href={href} className="flex min-w-0 flex-1 flex-col gap-0.5 underline-offset-4 hover:underline">
        <span className="truncate font-medium">
          {black} <span className="px-1 text-muted">vs</span> {white}
        </span>
        <span className="text-xs text-muted">
          {variantLabel(game.variant)} · {game.size}×{game.size} · {game.moveCount} moves · you are{" "}
          {STONE_DISPLAY[seat].label} {STONE_DISPLAY[seat].kanji} · {ago(item.since, now)}
        </span>
      </Link>
      {item.stale ? (
        <span className="rounded-full border border-ochre/60 bg-ochre-soft px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase" title={MY_GAMES_COPY.staleHint(STALE_AFTER_DAYS)}>
          {MY_GAMES_COPY.stale}
        </span>
      ) : null}
      {running && game.allowResign ? <ResignButton id={game.id} /> : null}
    </li>
  );
}
