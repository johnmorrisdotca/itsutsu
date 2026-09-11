import { Paired } from "@/components/i18n/Paired";
import { PlayerName } from "@/components/players/PlayerName";
import Link from "next/link";
import { cookies } from "next/headers";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { SEAT_DISPLAY, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { matchPath } from "@/lib/gomoku/slugs";
import { currentEmail, currentMemberId } from "@/lib/auth/currentSession";
import { keepFinishedDaysFor } from "@/lib/auth/members";
import { MY_GAME_GROUPS, STALE_AFTER_DAYS, fetchMyGames, type MyGame, type MyGameGroup } from "@/lib/history/myGames";
import { seatClaims } from "@/lib/history/seatCookie";
import { MY_GAMES_COPY } from "./mine.constants";
import { ResignButton } from "./ResignButton";
import { GameName } from "@/components/games/GameName";

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
 * How many of each group the lobby prints.
 *
 * The games waiting on you are the reason to open this page, so they are all
 * shown however many there are. The rest are a reminder rather than a queue,
 * and a reminder that runs to fifty rows is a page nobody reaches the bottom
 * of — twenty games at once is the most anybody is meant to have, and the
 * groups that grow without anyone deciding to are held to a handful.
 */
const SHOWN: Record<MyGameGroup, number> = {
  yourMove: 50,
  theirMove: 20,
  unstarted: 10,
  hotSeat: 5,
  finished: 5,
};

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
  const groups = await fetchMyGames(claims, await currentMemberId(), now, await keepFinishedDaysFor(email));
  const total = MY_GAME_GROUPS.reduce((n, group) => n + groups[group].length, 0);
  if (total === 0) {
    if (email === null) return null;
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="my-games-empty">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          <Paired en={MY_GAMES_COPY.title.label} kanji={MY_GAMES_COPY.title.kanji} kanjiClassName="text-sm font-normal opacity-70" />
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
        <Paired en={MY_GAMES_COPY.title.label} kanji={MY_GAMES_COPY.title.kanji} kanjiClassName="text-sm font-normal opacity-70" />
      </h2>
      {MY_GAME_GROUPS.map((group) =>
        groups[group].length === 0 ? null : (
          <Group key={group} group={group} items={groups[group].slice(0, SHOWN[group])} now={now} />
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
        <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
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
  /*
   * One address either way. A match kept its identity when it finished and the
   * link to it did not: a finished game went to /history/<slug>/<id> and a
   * live one to /games/<slug>/<id>, so the same match had two hrefs depending
   * on when you looked.
   */
  const href = matchPath(game.variant, game.id);
  // A hot-seat game's names are two people at one keyboard and belong to nobody.
  const named = group !== "hotSeat";
  const running = group !== "finished";
  return (
    <li
      className={`relative flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
        group === "yourMove" ? "border-moss/50 bg-moss-soft" : "border-rule"
      }`}
      data-testid="my-game"
      data-id={game.id}
      data-stale={item.stale}
    >
      {/*
        The row leads to the game and the names lead to the people, so the
        row's link is stretched under the card and the names sit above it —
        the same construction the record table uses, because a link inside a
        link is not a thing a browser will render.
      */}
      <Link href={href} className="absolute inset-0 rounded-lg" aria-label={`${black} vs ${white}`} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium">
          <PlayerName name={game.blackName} fallback={SEAT_DISPLAY.one.label} linkable={named} className="relative z-10" />
          <span className="px-1 text-muted">vs</span>
          <PlayerName name={game.whiteName} fallback={SEAT_DISPLAY.two.label} linkable={named} className="relative z-10" />
        </span>
        <span className="text-xs text-muted">
          <GameName variant={game.variant} raised /> · {game.size}×{game.size} · {game.moveCount} moves · you are{" "}
          {STONE_DISPLAY[seat].label} {STONE_DISPLAY[seat].kanji} · {ago(item.since, now)}
        </span>
      </span>
      {item.stale ? (
        <span className="relative z-10 rounded-full border border-ochre/60 bg-ochre-soft px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase" title={MY_GAMES_COPY.staleHint(STALE_AFTER_DAYS)}>
          {MY_GAMES_COPY.stale}
        </span>
      ) : null}
      {/*
        Above the stretched row link, or the link swallows the click. Anything
        added to a row from here on needs the same, which is the cost of the
        row being a link at all.
      */}
      {/*
        Calling off an empty board is offered even where resigning is not. A
        host who says nobody may walk away means a game in progress, and there
        is nothing to walk away from before the first stone — leaving somebody
        stuck with an empty board for ever would be a rule protecting nothing.
      */}
      {running && (game.allowResign || game.moveCount === 0) ? (
        <span className="relative z-10">
          <ResignButton id={game.id} moves={game.moveCount} />
        </span>
      ) : null}
    </li>
  );
}
