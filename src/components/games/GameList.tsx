import Link from "next/link";

import { GameName } from "@/components/games/GameName";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import {
  familyPath,
  historyPath,
  playPath,
  rulesPath,
  standingsPath,
} from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { aliasesFor } from "@/lib/legacy/gameAliases";

import { CATALOGUE_LINK_CLASS } from "./games.constants";

/**
 * Every game on the site, as plain text: the name, its name in its own script,
 * one line on what it is, what the other sites called it, and everywhere it
 * lives here. No cards, no pictures, no filter. The simplest view there is,
 * for whoever wants to read the whole list at once.
 *
 * It was a page of its own, /games/all, linked from the colophon. That made
 * the plain list a different RESOURCE from the games rather than a different
 * way of looking at them — two indexes to keep in step, and a footer link as
 * the only way to the second. It is a view now, at /games?view=list.
 */
export function GameList() {
  return (
    <div className="flex flex-col gap-8" data-testid="every-game">
      <p className="max-w-prose text-sm text-muted">
        {/*
          A count of RULE SETS, not of games anybody played — "forty games in
          ten families" is a fact about the catalogue, and the catalogue is the
          page it is printed on.
        */}
        {RULE_VARIANT_LIST.length} games in {GAME_FAMILIES.length} families. Each one has a page of its
        own, and under it the rules, the record, the standings and a board.
      </p>
      {GAME_FAMILIES.map((family) => (
        <section key={family.title} className="flex flex-col gap-3" data-testid="every-game-family">
          <h2 className="flex items-baseline gap-2 border-b border-rule pb-1 text-base font-semibold">
            {family.title} <span className="font-mincho text-sm font-normal opacity-70">{family.kanji}</span>
            <span className="ml-auto text-xs font-normal text-muted">
              {family.games.length} {family.games.length === 1 ? "game" : "games"}
            </span>
          </h2>
          <p className="max-w-prose text-sm text-muted">{family.blurb}</p>
          <dl className="flex flex-col gap-3">
            {family.games.map((variant) => {
              const copy = RULE_VARIANT_DISPLAY[variant];
              const aliases = aliasesFor(variant);
              return (
                <div key={variant} className="grid gap-x-6 gap-y-1 sm:grid-cols-[14rem_1fr]" data-testid={`every-game-${variant}`}>
                  <dt className="font-medium">
                    {/* Through GameName, so the name leads to the game like every other name on the site. */}
                    <GameName variant={variant} kanji />
                  </dt>
                  <dd className="flex flex-col gap-0.5 text-sm">
                    <span>{copy.tagline}</span>
                    {copy.inspiredBy !== undefined ? (
                      <span className="text-xs text-muted italic">Inspired by {copy.inspiredBy}</span>
                    ) : null}
                    {aliases.length > 0 ? (
                      <span className="text-xs text-muted">Also known as {aliases.join(", ")}</span>
                    ) : null}
                    <span className="flex flex-wrap gap-x-3 text-xs">
                      <Link href={playPath(variant)} className={CATALOGUE_LINK_CLASS}>play</Link>
                      <Link href={rulesPath(variant)} className={CATALOGUE_LINK_CLASS}>rules</Link>
                      <Link href={historyPath(variant)} className={CATALOGUE_LINK_CLASS}>record</Link>
                      <Link href={standingsPath(variant)} className={CATALOGUE_LINK_CLASS}>standings</Link>
                      <Link href={familyPath(variant)} className={CATALOGUE_LINK_CLASS}>family</Link>
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
