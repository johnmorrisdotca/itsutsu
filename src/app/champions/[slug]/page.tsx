import Link from "next/link";
import { notFound } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StandingsTable } from "@/components/players/Standings";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { siblingsOf } from "@/lib/gomoku/families";
import { championsPath, gamePath, recordPath, rulesPath, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { fetchVariantLeaders } from "@/lib/rating/variantRatings";

export const metadata = { title: "Champions" };

// The ladder is read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

const LEADERS = 50;

/** One game's own ladder: everyone with a standing in it, best first. */
export default async function GameChampionsPage({ params }: PageProps<"/champions/[slug]">) {
  const variant = variantFor((await params).slug);
  if (variant === null) notFound();
  const copy = RULE_VARIANT_DISPLAY[variant];
  const siblings = siblingsOf(variant);
  const standings = await fetchVariantLeaders(variant, LEADERS);

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="game-champions">
        <header className="flex flex-col gap-1">
          <p className="text-xs text-muted">
            <Link href="/champions" className="underline-offset-2 hover:underline">
              Champions
            </Link>{" "}
            / {copy.label}
          </p>
          <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
            {copy.label}
            <span className="font-mincho text-base font-normal opacity-70">{copy.kanji}</span>
          </h1>
          <p className="text-sm font-medium">{copy.tagline}</p>
          <p className="flex flex-wrap gap-x-3 text-xs">
            <Link href={rulesPath(variant)} className="text-muted underline-offset-2 hover:underline">rules</Link>
            <Link href={recordPath(variant)} className="text-muted underline-offset-2 hover:underline">record</Link>
            <Link href={gamePath(variant)} className="text-muted underline-offset-2 hover:underline">play</Link>
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
        {siblings !== null && siblings.games.length > 0 ? (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-2 text-xs text-muted" data-testid="sibling-champions">
            <span>
              Also in {siblings.family.title}{" "}
              <span className="font-mincho opacity-70">{siblings.family.kanji}</span>:
            </span>
            {siblings.games.map((game) => (
              <Link key={game} href={championsPath(game)} className="underline-offset-2 hover:underline">
                {RULE_VARIANT_DISPLAY[game].label}
              </Link>
            ))}
          </p>
        ) : null}
      </section>
    </Page>
  );
}
