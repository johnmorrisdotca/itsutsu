import Link from "next/link";

import { GameReplay } from "@/components/history/GameReplay";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { keptGameDetail, keptGameName, keptGamesFor } from "@/lib/legacy/legacyGames.data";
import type { LegacyGame } from "@/lib/legacy/legacyPlayers.types";

/**
 * The games kept in full — a board a reader can step through, not just a
 * result.
 *
 * A kept game belongs to the site it was played on, so it sits inside that
 * site's chapter rather than in a heap at the bottom of the page. Games from
 * the site being read are the only ones shown.
 */
export function KeptGames({ slug, site }: { slug: string; site?: string }) {
  const games = keptGamesFor(slug).filter((game) => site === undefined || game.source === site);
  if (games.length === 0) return null;
  return (
    <section className="flex flex-col gap-4" data-testid="kept-games">
      <h3 className={SECTION_TITLE}>Games we have</h3>
      {games.map((game) => (
        <KeptGame key={game.id} game={game} viewedAs={slug} />
      ))}
    </section>
  );
}

function KeptGame({ game, viewedAs }: { game: LegacyGame; viewedAs: string }) {
  const isBlack = game.black === viewedAs;
  const opponentSlug = isBlack ? game.white : game.black;
  const opponentName = keptGameName(opponentSlug);
  const colour = isBlack ? "black" : "white";
  const result = game.winner === null ? "drew" : game.winner === colour ? "won" : "lost";
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-3`}>
      <p className="text-sm text-muted">
        {game.playedAt} · {variantLabel(game.variant)}, {game.size}×{game.size} · vs{" "}
        <Link href={`/players/${opponentSlug}`} className="font-medium text-ink-soft underline-offset-2 hover:underline">
          {opponentName}
        </Link>{" "}
        · played <span className="font-medium text-ink-soft">{colour}</span> ·{" "}
        <span className="font-medium text-ink-soft">{result}</span> · {game.source}
      </p>
      <GameReplay game={keptGameDetail(game)} />
    </div>
  );
}
