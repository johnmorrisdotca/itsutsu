import Link from "@/components/ui/Link";
import { connection } from "next/server";

import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { currentSession } from "@/lib/auth/currentSession";
import { MOSAIC_TILES, realGameTiles } from "@/lib/catalogue/realGames";
import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { matchPath, playPath } from "@/lib/gomoku/slugs";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

import { MosaicTile } from "./MosaicTile";
import { Paired } from "@/components/i18n/Paired";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

/**
 * THE GAME, MADE OF ITS OWN GAMES: the final positions of the last dozen played
 * out here, on the game's own page (John, 2026-09-10: "like a visual tab for
 * that game... would be really cool"). Each leads to the game it is.
 *
 * A member's panel, like the ladder beside it: a game's page is open to anybody,
 * and these are members' games, so a visitor is shown what the panel is and the
 * way in. The tiles are worked out once an hour (`realGames.ts`), never per
 * view. Square boards only for now — a hexagon or a star drawn on a square grid
 * would be a wrong picture, which is worse than none.
 */
export async function RealGamesMosaic({ variant }: { variant: string }) {
  const spec = VARIANT_SPECS[variant as RuleVariant];
  // The board's own test for the hexagon lattice (`Board.tsx`): Hex, the honeycomb and the star.
  if (spec === undefined || spec.connects || spec.hexagon || spec.chineseCheckers) return null;
  await connection();
  const session = await currentSession();
  const say = await currentSpeaker();

  const heading = (
    <h2 className={SECTION_TITLE}>
      <Paired en={say.say("gamepages.realTitle")} kanji="実戦" kanjiClassName="font-mincho normal-case tracking-normal" />
    </h2>
  );

  if (session === null) {
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="real-games">
        {heading}
        <p className="text-sm text-muted" data-testid="real-games-shut">
          {say.say("gamepages.realShut")}{" "}
          <Link href={ASK_FOR_INVITE_PATH} className="underline underline-offset-4" data-testid="real-games-ask">
            {say.say("gamepages.realJoin")}
          </Link>
        </p>
      </section>
    );
  }

  const tiles = await realGameTiles(variant);
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="real-games">
      {heading}
      <p className="text-xs text-muted">{say.say("gamepages.realLead", { count: String(MOSAIC_TILES) })}</p>
      {tiles.length === 0 ? (
        <p className="text-sm text-muted" data-testid="real-games-empty">
          {say.say("gamepages.realEmpty")}{" "}
          <Link href={playPath(variant)} className="underline underline-offset-4">
            {say.say("gamepages.realFirst")}
          </Link>
        </p>
      ) : (
        <div className="flex flex-wrap gap-2" data-testid="real-games-tiles">
          {tiles.map((tile) => (
            <Link key={tile.id} href={matchPath(variant, tile.id)} data-testid="real-game" title={say.say("gamepages.realOpen")}>
              <MosaicTile tile={tile} grid={spec.grid} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
