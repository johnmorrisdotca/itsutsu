import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StandingsTable } from "@/components/players/Standings";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { siblingsOf } from "@/lib/gomoku/families";
import { gamePath, historyPath, rulesPath, standingsPath, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { fetchVariantLeaders } from "@/lib/rating/variantRatings";
import { RATING_POOLS } from "@/lib/rating/pools";

export const metadata = { title: "Standings 名人" };

// The ladder is read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

const LEADERS = 50;

/**
 * One game's own ladder, at /games/<slug>/standings: everyone with a standing
 * in it, best first.
 *
 * It used to be /champions/<slug>, a namespace of its own that only a word in
 * the colophon led to — a page answering half a reader's errand about a game,
 * sitting where nobody stood when they wanted it. It is a facet of the game
 * now, one segment under the game's own address, and the panel on the game's
 * front door leads here for the whole of it.
 */
export default async function GameChampionsPage({ params }: PageProps<"/games/[slug]/standings">) {
  const variant = variantFor((await params).slug);
  if (variant === null) notFound();
  const copy = RULE_VARIANT_DISPLAY[variant];
  const siblings = siblingsOf(variant);
  const [standings, againstComputers] = await Promise.all([
    fetchVariantLeaders(variant, LEADERS),
    fetchVariantLeaders(variant, LEADERS, RATING_POOLS.computer),
  ]);

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="game-champions">
        <header className="flex flex-col gap-1">
          <p className="text-xs text-muted">
            {/* Up to the game, which is what this is a facet of. */}
            <Link href={gamePath(variant)} className="underline-offset-2 hover:underline">
              {copy.label}
            </Link>{" "}
            / Standings
          </p>
          <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
            <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-base font-normal opacity-70" />
          </h1>
          <p className="text-sm font-medium">{copy.tagline}</p>
          <p className="flex flex-wrap gap-x-3 text-xs">
            <Link href={rulesPath(variant)} className="text-muted underline-offset-2 hover:underline">rules</Link>
            <Link href={historyPath(variant)} className="text-muted underline-offset-2 hover:underline">record</Link>
            <Link href={gamePath(variant)} className="text-muted underline-offset-2 hover:underline">the game</Link>
          </p>
        </header>
        <p className="max-w-prose text-sm text-muted">
          Ratings here are this game&apos;s own Elo, starting at 1600 and moved only by games of {copy.label} between
          two named members. A standing is unrated for the first few games, provisional while it settles, and
          established after twenty.
        </p>
        {standings.length === 0 ? (
          <p className="text-sm text-muted" data-testid="standings-empty">
            No rated games of {copy.label} yet. Finish one against another member and the first standing appears here.
          </p>
        ) : (
          <StandingsTable standings={standings} />
        )}
        {/*
          The other ladder of this game, and it is a different question rather
          than a smaller version of the same one. A game against a computer is
          rated in a pool of its own, so that beating a program never moves
          where somebody stands among people — which means these figures are
          not comparable with the ones above and are never combined with them.

          The programs appear here beside the people who played them, because
          the pool is a property of the GAME rather than of the player: what
          makes a game belong here is that one of the seats was a program.
        */}
        {againstComputers.length > 0 ? (
          <section className="flex flex-col gap-3" data-testid="computer-standings">
            <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
              Against the computer players{" "}
              <span className="font-mincho text-[0.8rem] font-normal tracking-normal">機械</span>
            </h2>
            <p className="max-w-prose text-xs text-muted">
              {/*
                Said plainly because the grades invite exactly the wrong
                reading. On this site's own measurements, Reversi's programs
                do NOT finish in the order their names suggest — the gentler
                two have been beating the stronger two. A page that presented
                the grade order as a result would be reporting a plan rather
                than what happened.
              */}
              A separate ladder, on this game alone, for the games where one seat was a program.
              These ratings are not the ones above and the two are never added together. A grade
              is a name for how a program plays, not a promise about how it does: read the
              standing and the games behind it, which is what a ladder is for.
            </p>
            <StandingsTable standings={againstComputers} pool="computer" testId="computer-standings-table" />
          </section>
        ) : null}
        {siblings !== null && siblings.games.length > 0 ? (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-2 text-xs text-muted" data-testid="sibling-champions">
            <span>
              Also in {siblings.family.title}{" "}
              <span className="font-mincho opacity-70">{siblings.family.kanji}</span>:
            </span>
            {siblings.games.map((game) => (
              <Link key={game} href={standingsPath(game)} className="underline-offset-2 hover:underline">
                {RULE_VARIANT_DISPLAY[game].label}
              </Link>
            ))}
          </p>
        ) : null}
      </section>
    </Page>
  );
}
