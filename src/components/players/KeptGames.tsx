import Link from "next/link";

import { GameReplay } from "@/components/history/GameReplay";
import { appearanceFrom } from "@/components/board/appearance";
import { GameName } from "@/components/games/GameName";
import type { Appearance } from "@/components/board/board.types";
import { currentEmail } from "@/lib/auth/currentSession";
import { appearanceFor } from "@/lib/auth/members";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
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
export async function KeptGames({ slug, site }: { slug: string; site?: string }) {
  const games = keptGamesFor(slug).filter((game) => site === undefined || game.source === site);
  if (games.length === 0) return null;
  /*
   * The reader's own board, read here rather than handed down. These sit four
   * components below the page, and a board somebody chose is not worth
   * threading a prop through four files that have nothing else to do with how
   * a board looks. Of all the boards on this site these are the ones most
   * likely to be sat with: they are the games that were kept.
   */
  const appearance = appearanceFrom(await appearanceFor(await currentEmail()));
  return (
    <section className="flex flex-col gap-4" data-testid="kept-games">
      <h3 className={SECTION_TITLE}>Games we have</h3>
      {games.map((game) => (
        <KeptGame key={game.id} game={game} viewedAs={slug} appearance={appearance} />
      ))}
    </section>
  );
}

function KeptGame({
  game,
  viewedAs,
  appearance,
}: {
  game: LegacyGame;
  viewedAs: string;
  appearance: Appearance;
}) {
  const isBlack = game.black === viewedAs;
  const opponentSlug = isBlack ? game.white : game.black;
  const opponentName = keptGameName(opponentSlug);
  const colour = isBlack ? "black" : "white";
  const result = game.winner === null ? "drew" : game.winner === colour ? "won" : "lost";
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-3`}>
      <p className="text-sm text-muted">
        {game.playedAt} · <GameName variant={game.variant} />, {game.size}×{game.size} · vs{" "}
        <Link href={`/players/${opponentSlug}`} className="font-medium text-ink-soft underline-offset-2 hover:underline">
          {opponentName}
        </Link>{" "}
        · played <span className="font-medium text-ink-soft">{colour}</span> ·{" "}
        <span className="font-medium text-ink-soft">{result}</span> · {game.source}
      </p>
      <GameReplay game={keptGameDetail(game)} appearance={appearance} />
    </div>
  );
}
