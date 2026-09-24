"use client";

import Link from "next/link";
import useSWR from "swr";

import { GameCount } from "@/components/games/GameCount";
import type { RatedRecord } from "@/lib/rating/ratedRecord";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

type Mine = { yourMove: number; offered?: number; record?: RatedRecord | null };

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
  const { data } = useSWR("/api/games/mine", fetcher, { refreshInterval: 0, revalidateOnFocus: true, dedupingInterval: 2_000 });
  const moves = data?.yourMove ?? 0;
  const offers = data?.offered ?? 0;
  const record = data?.record ?? null;
  return (
    <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1" data-testid="strip-games" {...readyMark(hydrated)}>
      {data === undefined ? null : moves + offers === 0 ? (
        <Link href="/play" className={ITEM} data-testid="strip-waiting">
          Nothing waiting
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
