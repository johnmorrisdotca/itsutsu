import type { Metadata } from "next";

import { FamousMosaic } from "@/components/famous/FamousMosaic";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { MosaicTile } from "@/components/games/MosaicTile";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { famousTimeline } from "@/lib/famous/famous";
import { FAMOUS_COPY, FAMOUS_SOURCES } from "@/lib/famous/famous.constants";
import { FAMOUS_GAMES } from "@/lib/famous/famousGames.data";
import { frameOf } from "@/lib/record/mosaic";

export const metadata: Metadata = { title: `${FAMOUS_COPY.title} ${FAMOUS_COPY.kanji}` };

/**
 * FAMOUS GAMES: championship and historic games from published records,
 * replayed through this site's own rules. John, 2026-09-23: "here's a visual
 * interesting thing of a world champion at the … championships."
 *
 * No database: the games are a data file, so the page is built once and every
 * view of it is a static file. Each card's final position is worked out then;
 * the picture of every move is made in the reader's browser, on a press. Each
 * game names the collection its record came from.
 */
export default function FamousGamesPage() {
  return (
    <Page board>
      <SiteHeader />
      <PageTitle title={FAMOUS_COPY.title} kanji={FAMOUS_COPY.kanji} lead={FAMOUS_COPY.blurb} />
      <div className="grid gap-4 md:grid-cols-2" data-testid="famous-games">
        {FAMOUS_GAMES.map((game) => {
          const last = famousTimeline(game).at(-1)!;
          const source = FAMOUS_SOURCES[game.source];
          return (
            <article key={game.id} className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="famous-game" data-id={game.id}>
              <div className="flex items-start gap-3">
                <MosaicTile tile={{ id: game.id, size: game.size, board: frameOf(last).board }} grid={VARIANT_SPECS[game.variant].grid} />
                <div className="flex min-w-0 flex-col gap-1 text-sm">
                  <p className="font-semibold">
                    {game.black} <span className="text-muted">vs</span> {game.white}
                  </p>
                  <p>
                    {game.event}
                    {game.round === null ? null : <span className="text-muted"> · {game.round}</span>}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-1 text-muted">
                    <GameThumb variant={game.variant} size="small" />
                    <GameName variant={game.variant} /> · {game.result} · {game.date}
                    {game.place === null ? null : <> · {game.place}</>}
                  </p>
                  <p className="text-xs text-muted">
                    {FAMOUS_COPY.source}{" "}
                    <a href={source.url} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">
                      {source.name}
                    </a>
                  </p>
                </div>
              </div>
              <FamousMosaic game={game} />
            </article>
          );
        })}
      </div>
    </Page>
  );
}
