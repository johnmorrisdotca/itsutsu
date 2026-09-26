"use client";

import Link from "@/components/ui/Link";
import useSWR from "swr";

import { thousands } from "@/components/about/XpCurve";
import { GameCount } from "@/components/games/GameCount";
import { MINE_KEY } from "@/components/mine/mine.constants";
import type { RatedRecord } from "@/lib/rating/ratedRecord";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

type Mine = { yourMove: number; going?: number; offered?: number; record?: RatedRecord | null; ip?: number | null };

const fetcher = async (url: string): Promise<Mine | null> => {
  const response = await fetch(url);
  return response.ok ? response.json() : null;
};

const ITEM = "whitespace-nowrap underline-offset-4 hover:text-ink hover:underline";

/**
 * The line's half that changes with play: what is waiting on the reader, and
 * their rated record.
 *
 * The SAME request as the badge beside Play, by the same key, so SWR answers
 * both from one fetch: the line costs no request of its own. Each number goes
 * where it points — the waiting games to /play, and each of won, lost and
 * drawn to exactly those rated games, by id, through `GameCount`.
 */
export function StripGames({ memberId }: { memberId: string }) {
  const hydrated = useHydrated();
  // Seeded by the page's own render (`HeaderCountsSeed`), so nothing is asked as the page arrives; a tab coming back into focus asks.
  const { data } = useSWR(MINE_KEY, fetcher, { refreshInterval: 0, revalidateOnMount: false, revalidateOnFocus: true, dedupingInterval: 2_000 });
  const moves = data?.yourMove ?? 0;
  const offers = data?.offered ?? 0;
  const going = data?.going ?? 0;
  const record = data?.record ?? null;
  return (
    <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1" data-testid="strip-games" {...readyMark(hydrated)}>
      {/*
        TWO FACTS, EACH TRUE OF ONE THING: what is waiting on this reader, and
        how much they have going. It used to say only the first, so ten games on
        the other side read "Nothing waiting" — true, and read as "no games".
        John: "seems like that would be 10 games waiting or in the queue".
      */}
      {data === undefined ? null : going + moves + offers === 0 ? (
        <Link href="/play" className={ITEM} data-testid="strip-waiting">
          Nothing going
        </Link>
      ) : (
        <>
          {moves > 0 ? (
            <Link href="/play" className={`${ITEM} text-ink`} data-testid="strip-your-move">
              {moves} your move
            </Link>
          ) : null}
          {offers > 0 ? (
            <Link href="/play" className={`${ITEM} text-ink`} data-testid="strip-offers">
              {offers} {offers === 1 ? "offer" : "offers"}
            </Link>
          ) : null}
          {going > 0 ? (
            <Link href="/play" className={ITEM} data-testid="strip-going" data-going={going}>
              {going} going
            </Link>
          ) : null}
        </>
      )}
      {record === null ? null : (
        <span className="whitespace-nowrap" data-testid="strip-record" title="Rated games, against people and the computer">
          <GameCount count={record.won} memberId={memberId} rated="yes" outcome="won" className={ITEM} testId="strip-won" />W{" · "}
          <GameCount count={record.lost} memberId={memberId} rated="yes" outcome="lost" className={ITEM} testId="strip-lost" />L{" · "}
          <GameCount count={record.drawn} memberId={memberId} rated="yes" outcome="drawn" className={ITEM} testId="strip-drawn" />D
        </span>
      )}
    </span>
  );
}

/**
 * THE READER'S IP, BESIDE THEIR XP. John, 2026-09-26: "We are showing XP in
 * the header, but not showing IP." XP is taking part and IP is winning, so the
 * strip shows both, the same size, and IP leads to the board that ranks it.
 *
 * The same answer as the counts beside it (`MINE_KEY`), which the page's own
 * render handed over (`headerCounts`, one indexed sum over the reader's rows):
 * no request of its own. Nothing is drawn until it has arrived, and nothing
 * for a browser with no member behind it.
 */
export function StripIp() {
  const { data } = useSWR(MINE_KEY, fetcher, { refreshInterval: 0, revalidateOnMount: false, revalidateOnFocus: true, dedupingInterval: 2_000 });
  const ip = data?.ip;
  if (ip === undefined || ip === null) return null;
  return (
    <Link href="/points" className={ITEM} data-testid="strip-ip" data-ip={ip}>
      {thousands(ip)} IP
    </Link>
  );
}
