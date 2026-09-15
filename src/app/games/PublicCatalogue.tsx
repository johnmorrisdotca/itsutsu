import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

import { BrandStones } from "@/components/layout/BrandMarks";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GameCatalogue } from "@/components/games/GameCatalogue";
import type { CatalogueFamily } from "@/components/games/games.types";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { fetchCatalogueStats } from "@/lib/catalogue/catalogueStats";
import { forReader } from "@/lib/catalogue/catalogueReader";
import { GAME_FAMILIES, gamesShownIn } from "@/lib/gomoku/families";
import type { CatalogueView } from "@/lib/gomoku/catalogueView";
import type { Speaker } from "@/lib/i18n/i18n";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

/*
 * /games FOR A READER WITH NO SESSION, and the catalogue's families as copy,
 * which both halves of the page draw.
 *
 * Moved here whole from `page.tsx` when that file reached the 500-line gate. The
 * page still decides which half a reader gets — `currentReader` first, then the
 * lobby or this — so a stranger's render still reads nothing the lobby reads.
 * `publicCatalogue.coverage.test.ts` reads this file for the stranger's half
 * and the page for the lobby's.
 */

/**
 * The catalogue's families, as copy: the same for every reader, from tables in
 * this repository. What has been played of each travels beside them as
 * `CatalogueStats`, shaped for the reader by `forReader`.
 *
 * A family's `games` are the ones at home in it, which its count and its
 * figures are about. Its `guests` are games from other families listed on its
 * shelf too (`ALSO_LISTED_IN`), each saying which family it lives in — shown,
 * and counted once, at home.
 */
export function catalogueFamilies(): CatalogueFamily[] {
  return GAME_FAMILIES.map((family) => ({
    key: family.key,
    title: family.title,
    kanji: family.kanji,
    blurb: family.blurb,
    games: family.games.map(gameCopy),
    guests: gamesShownIn(family).flatMap((shown) =>
      shown.listed === "shelf" ? [{ ...gameCopy(shown.variant), home: { title: shown.home.title, kanji: shown.home.kanji } }] : [],
    ),
  }));
}

/** One game's words, as a family's card shows them. */
function gameCopy(variant: CatalogueFamily["games"][number]["variant"]): CatalogueFamily["games"][number] {
  const copy = RULE_VARIANT_DISPLAY[variant];
  return { variant, label: copy.label, kanji: copy.kanji, tagline: copy.tagline, inspiredBy: copy.inspiredBy };
}

/**
 * /games for somebody with no invite: the catalogue, and one query rather
 * than the whole lobby's.
 *
 * A SEPARATE COMPONENT RATHER THAN A HANDFUL OF CONDITIONS, because the
 * property worth having is one somebody can check by reading: the seats, the
 * opponents, the ignore list and everything else the lobby needs are simply
 * not imported here. Written as `{signedIn ? … : null}` around each panel
 * above, those reads would still have happened — they are awaited before any
 * of it is drawn — and the page would have gone on costing a stranger the
 * whole lobby to render none of it.
 *
 * The FIGURES are the same ones a member reads, from the same five reads —
 * John's "see some stuff" is what a stranger is here for, and a count of
 * finished games names nobody. Printing `0` here regardless of the real number
 * was once the falsest possible answer: production held 116 finished games,
 * and a stranger was told none of it had ever been played, on the one page
 * whose whole job is to invite them in.
 *
 * The PEOPLE are not, and `forReader(stats, false)` is where that is decided,
 * once: no top player's name, no last game's match. The open pages name no
 * member — `e2e/gate.spec.ts` holds /games to that — so a stranger is told
 * there is somebody at the top of each game, and invited in to see who.
 */
export async function PublicCatalogue({ view, say }: { view: CatalogueView; say: Speaker }) {
  const stats = forReader(await fetchCatalogueStats(), false);

  return (
    <Page width="standard">
      <SiteHeader />

      {/*
        What a stranger gets where a member gets the lobby: the one sentence
        that says how this place works, and the door. Not a greyed-out copy of
        the panel they cannot use — an offer the site would refuse is a worse
        thing to show somebody than no offer at all.
      */}
      <section
        className={`${PANEL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2`}
        data-testid="games-join"
      >
        <span className="max-w-prose text-sm text-muted">
          Every game here is free to read about — the rules, what it is, where it came from, and
          the family it belongs to. Playing one needs an invite.
        </span>
        <Link href="/join" className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0 px-4 py-2`}>
          I have an invite →
        </Link>
      </section>

      <BrandStones className="py-1 opacity-80" />

      {/* Open too, and the best thing to read next if a game has caught them. */}
      <section
        className={`${PANEL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2`}
        data-testid="games-learn"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-baseline gap-2 text-base font-semibold">
            <Paired en="Learn how to play them" kanji="学び" kanjiClassName="text-sm font-normal opacity-70" />
          </span>
          <span className="max-w-prose text-sm text-muted">
            The shapes that win, the moves that force, and the mistakes everyone makes once.
            Each guide names the games it applies to.
          </span>
        </span>
        <Link href="/learn" className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0 px-4 py-2`} data-testid="games-learn-link">
          The learning shelf →
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          <Paired en={say.say("nav.everyGame")} kanji="全種目" kanjiClassName="text-sm font-normal opacity-70" />
        </h2>
        <p className="max-w-prose text-sm text-muted">
          Almost every game here is five in a row with one idea changed. Every name below leads to
          that game, and the three ways of looking at the list are the same games arranged
          differently.
        </p>
        <GameCatalogue view={view} families={catalogueFamilies()} stats={stats} signedIn={false} />
      </section>
  </Page>
  );
}
