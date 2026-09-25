import Link from "next/link";

import { GameThumb } from "@/components/games/GameThumb";
import { Paired } from "@/components/i18n/Paired";
import { PlayerLink } from "@/components/players/Standings";
import { XP_BLANK_BECAUSE } from "@/components/players/players.constants";
import { XpCell } from "@/components/players/recordTrailing";
import { TABLE_SCROLL } from "@/components/ui/ui.constants";
import { GAME_FAMILIES, boardGamesOf } from "@/lib/gomoku/families";
import { standingsPath } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { VariantChampion } from "@/lib/rating/variantRatings";

const HEAD_CLASS = "text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase";

/**
 * THE CHAMPIONS, AS SIMPLY AS vint.ee's LEADERS PAGE: Game, Leader, Rating,
 * one line a game, in the catalogue's order and with no family headings to
 * read past. XP follows Rating, as on every table of players here. Each game's
 * name opens its own standings (`/games/<game>/standings`), which is the
 * drill-down: rank, player, rating, XP and the record, every count a link to
 * its games. A game nobody has played rated says so on its line.
 */
export function SimpleChampions({ champions }: { champions: ReadonlyMap<string, VariantChampion> }) {
  const games = [...new Set(GAME_FAMILIES.flatMap((family) => boardGamesOf(family)))];
  return (
    <div className={TABLE_SCROLL}>
      <table className="w-full text-sm" data-testid="champions-simple">
        <thead className={HEAD_CLASS}>
          <tr>
            <th className="py-1 pr-3">Game</th>
            <th className="py-1 pr-3">Leader</th>
            <th className="py-1 pr-3">Rating</th>
            {/* Directly after Rating, where John put it on every stats table. */}
            <th className="py-1 pr-3" title="Experience 経験 — what this member has earned on Itsutsu">
              XP
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((variant) => {
            const copy = RULE_VARIANT_DISPLAY[variant];
            const champion = champions.get(variant);
            return (
              <tr key={variant} className="border-t border-rule" data-testid={`champion-row-${variant}`}>
                <td className="py-1.5 pr-3">
                  <span className="flex items-center gap-2">
                    <GameThumb variant={variant} size="small" />
                    <Link href={standingsPath(variant)} className="font-medium underline-offset-2 hover:underline">
                      <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-xs font-normal opacity-70" />
                    </Link>
                  </span>
                </td>
                {champion === undefined ? (
                  <td className="py-1.5 pr-3 text-xs text-muted" colSpan={3}>
                    No rated games yet
                  </td>
                ) : (
                  <>
                    <td className="py-1.5 pr-3">
                      <PlayerLink name={champion.leader.name} memberId={champion.leader.memberId} />
                    </td>
                    <td className="py-1.5 pr-3 font-mono tabular-nums">{champion.leader.rating}</td>
                    <XpCell
                      xp={champion.leader.xp}
                      blankBecause={champion.leader.memberId === null ? XP_BLANK_BECAUSE.unclaimedName : undefined}
                    />
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
