"use client";

import useSWR from "swr";

import type { EmbedSummary } from "@/lib/embed/embedSummary";
import { RecordFigure } from "@/components/players/PlayerRecord";

/**
 * Live data from the server, beside an embedded board.
 *
 * The board itself stays local — a game played in an iframe is played in the
 * browser and never leaves it. This is the other half of what a host usually
 * wants: the board is the thing to play with, and this is the thing that makes
 * it feel connected to somewhere.
 *
 * It fails quiet. A host page should not sprout an error box because a
 * summary endpoint was slow, so when there is nothing to show, nothing shows.
 */
const fetcher = async (url: string): Promise<EmbedSummary> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(String(response.status));
  return response.json() as Promise<EmbedSummary>;
};

const RESULT_LABEL: Record<string, string> = {
  black: "Black",
  white: "White",
  draw: "Draw",
  abandoned: "—",
};

function playedOn(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function nameOr(name: string, fallback: string): string {
  return name.trim() === "" ? fallback : name;
}

export function EmbedStats({
  token,
  player,
}: {
  token: string;
  player: string | null;
}) {
  const query = new URLSearchParams({ token });
  if (player !== null) query.set("player", player);

  const { data } = useSWR<EmbedSummary>(
    `/api/embed/summary?${query.toString()}`,
    fetcher,
    { refreshInterval: 60_000, shouldRetryOnError: false },
  );

  if (data === undefined) return null;

  return (
    <aside
      className="flex flex-col gap-2 border-t border-rule pt-3 text-xs"
      data-testid="embed-stats"
    >
      <p className="flex items-baseline justify-between gap-2">
        <span className="font-mincho text-sm">棋譜</span>
        <span className="text-muted">
          {data.totalGames} game{data.totalGames === 1 ? "" : "s"} played
        </span>
      </p>

      {data.player !== null ? (
        <p className="text-muted" data-testid="embed-player-record">
          <span className="font-medium text-foreground">{data.player.name}</span>{" "}
          {/*
            The shared shape, even out here. This was the fourth spelling of a
            record and escaped the guard on them by naming alone — `.won` where
            the guard looked for `.wins`. Nothing links: an embed sits on
            somebody else's page, and a number that navigates away from it is
            not what the person who embedded it agreed to.
          */}
          — <RecordFigure record={{ wins: data.player.won, losses: data.player.lost, draws: data.player.drawn }} of={{ here: false }} />{" "}
          over {data.player.played}
        </p>
      ) : null}

      {data.recent.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {data.recent.slice(0, 4).map((game, index) => (
            <li
              key={`${game.playedAt}-${index}`}
              className="flex items-baseline justify-between gap-2 text-muted"
            >
              <span className="truncate">
                {nameOr(game.black, "Black")} v {nameOr(game.white, "White")}
              </span>
              <span className="shrink-0 tabular-nums">
                {RESULT_LABEL[game.result] ?? game.result} · {game.moveCount} ·{" "}
                {playedOn(game.playedAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
