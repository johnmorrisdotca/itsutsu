import Link from "next/link";
import { Suspense } from "react";

import { FamilyMark } from "@/components/games/FamilyMark";
import { GameCards } from "@/components/games/GameCards";
import { GameList } from "@/components/games/GameList";
import { GameName } from "@/components/games/GameName";
import { FamilyStatsLine, GameStatsStrip } from "@/components/games/GameStats";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, STRETCHED_CARD } from "@/components/ui/ui.constants";
import type { CatalogueStats } from "@/lib/catalogue/catalogue.types";
import {
  CATALOGUE_VIEWS,
  CATALOGUE_VIEW_DISPLAY,
  CATALOGUE_VIEW_LIST,
  cataloguePath,
  type CatalogueView,
} from "@/lib/gomoku/catalogueView";
import { RULE_VARIANT_LIST, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { RULES_ATTRIBUTION } from "@/lib/gomoku/openings.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

import type { CatalogueFamily, GameCard, GameCardKind } from "./games.types";

/**
 * Every game there is, three ways.
 *
 * This is what /games/all and the /rules index both were. They were two pages
 * listing the same forty games differently, plus the family accordion here
 * listing them a third way — three indexes of one collection, each reachable
 * from somewhere the others were not, and each quietly able to fall out of
 * step with the rest.
 *
 * One collection, one address, and how it is laid out is in the query.
 * Presentation is a filter.
 */
export function GameCatalogue({
  view,
  families,
  stats,
  signedIn,
}: {
  view: CatalogueView;
  families: CatalogueFamily[];
  /**
   * What has been played of every game and family, ALREADY SHAPED FOR THIS
   * READER by `forReader` — a stranger's copy names nobody. Every view draws
   * what it is handed and none of them asks who is reading.
   */
  stats: CatalogueStats;
  /**
   * Whether the reader is a member: the way into a game nobody has played is
   * its board for a member and the door for anybody else.
   */
  signedIn: boolean;
}) {
  return (
    <section className="flex flex-col gap-4" data-testid="game-catalogue">
      <ViewSwitch chosen={view} />
      {view === CATALOGUE_VIEWS.list ? <GameList stats={stats} signedIn={signedIn} /> : null}
      {view === CATALOGUE_VIEWS.cards ? (
        // The filters read the query on the client, so they render once that is known.
        <Suspense>
          <GameCards cards={CARDS} stats={stats} signedIn={signedIn} />
        </Suspense>
      ) : null}
      {view === CATALOGUE_VIEWS.families ? <Families families={families} stats={stats} signedIn={signedIn} /> : null}

      {/*
        WHOSE NAMES THESE GAMES ARE, and it is here because the page that
        carried it was deleted.
        
        It sat at the foot of the /rules index — the one page that listed every
        game — and when that index became a view of this one, the notice had to
        come with it or it would have shipped nowhere at all. It is not a note
        about the index; it is a note about the catalogue, and this component
        IS the catalogue, in all three of its arrangements.
      */}
      <section className="flex max-w-prose flex-col gap-2 text-xs text-muted" data-testid="rules-attribution">
        {RULES_ATTRIBUTION.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </section>
    </section>
  );
}

/**
 * The three ways of looking, as links rather than as buttons.
 *
 * A link, so each view has an address that can be sent to somebody, opened in
 * a new tab and bookmarked — which is the whole reason the view is in the
 * query rather than in a piece of component state.
 */
function ViewSwitch({ chosen }: { chosen: CatalogueView }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="How to show the games" data-testid="catalogue-view">
      <div className="flex flex-wrap gap-1">
        {CATALOGUE_VIEW_LIST.map((view) => {
          const copy = CATALOGUE_VIEW_DISPLAY[view];
          const current = view === chosen;
          return (
            <Link
              key={view}
              href={cataloguePath(view)}
              aria-current={current ? "page" : undefined}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                current ? "border-ink bg-ink text-paper" : "border-rule bg-ivory/70 hover:border-rule-strong"
              }`}
              data-testid={`catalogue-view-${view}`}
            >
              {copy.label} <span className="font-mincho opacity-70">{copy.kanji}</span>
            </Link>
          );
        })}
      </div>
      <p className="text-xs text-muted">{CATALOGUE_VIEW_DISPLAY[chosen].blurb}</p>
    </nav>
  );
}

/** Grouped by what they have in common — the view a newcomer should meet first. */
function Families({
  families,
  stats,
  signedIn,
}: {
  families: CatalogueFamily[];
  stats: CatalogueStats;
  signedIn: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {families.map((family, index) => (
        <details key={family.title} className={`${PANEL_CLASS} group`} data-testid="lobby-family" open={index === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-3">
              <FamilyMark family={family.title} className="size-12 shrink-0 rounded-md" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-baseline gap-2 font-semibold">
                  {family.title}
                  <span className="font-mincho text-xs font-normal opacity-70">{family.kanji}</span>
                  <span className="text-xs font-normal text-muted">
                    {family.games.length} {family.games.length === 1 ? "game" : "games"}
                  </span>
                </span>
                {/*
                  In the summary, so a folded family still says what has
                  happened in it. The one link it can hold — the name of whoever
                  holds most of its crowns — follows the link rather than
                  toggling the family, which is what a link inside a summary
                  does.
                */}
                <FamilyStatsLine stats={stats.families[family.key]} />
              </span>
            </span>
            <span className="text-xs text-muted group-open:hidden">show</span>
            <span className="hidden text-xs text-muted group-open:inline">hide</span>
          </summary>
          <p className="mt-2 text-sm text-muted">{family.blurb}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {family.games.map((game) => (
              /*
                THE WHOLE CARD IS THE WAY INTO THE GAME. John, looking at this
                box: "Mousing over a game should show us a button to click…
                right now we're forced to click the name." The box read as one
                object and answered on two words of it.

                The name is still the one link to the game, and it is spread
                over the card (`stretched`) rather than a second link being
                laid under it — so a keyboard reader gets one stop for one
                destination and a screen reader hears one link, not two. The
                count and the last game lead ELSEWHERE, so they are `raised`
                above the face; anything added to this card that leads
                somewhere needs the same, or the face swallows the click. The
                arrow at the right is the sign that the card opens, and it is
                drawn at rest so a finger on an iPad — where nothing hovers —
                is told the same thing a pointer is. See ui.constants.ts.
              */
              <li
                key={game.variant}
                className={`${STRETCHED_CARD} flex items-center justify-between gap-3 rounded-lg border border-rule px-3 py-2 text-sm`}
                data-testid="family-game"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium">
                    <GameName variant={game.variant} kanji stretched />
                  </span>
                  <span className="text-xs text-muted">{game.tagline}</span>
                  {game.inspiredBy !== undefined ? (
                    <span className="text-[0.7rem] text-muted italic">Inspired by {game.inspiredBy}</span>
                  ) : null}
                  {/*
                    What has been played of it, and who is best at it. It
                    replaces "12 played · last Kyu vs Dan", which was the last
                    game's two names and nothing about the game; the date of
                    that game is in the strip, and for a member it still opens
                    the game.
                  */}
                  <GameStatsStrip stats={stats.games[game.variant]} signedIn={signedIn} />
                </span>
                <CardArrow />
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

/**
 * The cards, built from the same two tables everything else reads.
 *
 * `kind` comes off the spec rather than being written down a second time, so
 * the bar that narrows by "what wins" cannot drift from what actually wins.
 */
const CARDS: GameCard[] = RULE_VARIANT_LIST.map((variant) => {
  const copy = RULE_VARIANT_DISPLAY[variant];
  const spec = VARIANT_SPECS[variant];
  return {
    variant,
    label: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    inspiredBy: copy.inspiredBy,
    kind: spec.flips ? "flips" : (String(spec.winLength ?? 5) as GameCardKind),
  };
});
