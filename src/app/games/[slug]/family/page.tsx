import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FamilyMark } from "@/components/games/FamilyMark";
import { GameName } from "@/components/games/GameName";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, STRETCHED_CARD } from "@/components/ui/ui.constants";
import { familyOf } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { gamePath, slugFor, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/family">): Promise<Metadata> {
  const variant = variantFor((await params).slug);
  const family = variant === null ? null : familyOf(variant);
  return { title: family === null ? "Family" : `${family.title} ${family.kanji}` };
}

export function generateStaticParams() {
  return RULE_VARIANT_LIST.map((variant) => ({ slug: slugFor(variant) }));
}

/**
 * The family a game belongs to, at /games/<slug>/family.
 *
 * Reached from the game rather than from an index of families, which is why it
 * is addressed under the game: "the family Renju is in" is a question about
 * Renju. A reader arrives at it having decided this particular game is not the
 * one — John's last errand, and the one that used to have nowhere at all to go
 * — so what it owes them is the neighbours, in full, with enough of each to
 * choose by.
 *
 * Pure: `GAME_FAMILIES` is a table, the same for everybody, so the whole page
 * prerenders and nothing here reads the database.
 */
export default async function GameFamilyPage({ params }: PageProps<"/games/[slug]/family">) {
  const variant = variantFor((await params).slug);
  if (variant === null) notFound();
  const family = familyOf(variant);
  const copy = RULE_VARIANT_DISPLAY[variant];
  // A game in no family is a gap the New Game Gate refuses, but a page must
  // not pretend to an answer it has not got.
  if (family === null) notFound();

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <header className="flex flex-col gap-1">
        <p className="text-xs text-muted">
          <Link href={gamePath(variant)} className="underline-offset-2 hover:underline" data-testid="family-up">
            {copy.label}
          </Link>{" "}
          / Family
        </p>
        <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
          {family.title}
          <span className="font-mincho text-base font-normal opacity-70">{family.kanji}</span>
        </h1>
        <p className="max-w-prose text-sm text-muted">{family.blurb}</p>
      </header>

      <div className="flex items-center gap-4">
        <FamilyMark family={family.title} className="size-16 shrink-0 rounded-lg" />
        <p className="text-sm text-muted">
          {family.games.length} {family.games.length === 1 ? "game" : "games"} in this family, including{" "}
          {/* The game you came from, named and still clickable — it is a game like the rest. */}
          <GameName variant={variant} />.
        </p>
      </div>

      <ul className="flex flex-col gap-3" data-testid="family-games">
        {family.games.map((game) => {
          const sibling = RULE_VARIANT_DISPLAY[game];
          return (
            /*
              The same card the catalogue draws, and the same rule: the whole
              card leads to the game, through its name stretched over it, with
              the arrow saying so. See the families view in GameCatalogue.tsx
              for the reasoning, and STRETCHED_CARD for the mechanism.
            */
            <li
              key={game}
              className={`${PANEL_CLASS} ${STRETCHED_CARD} flex items-center justify-between gap-3 ${
                game === variant ? "border-rule-strong" : ""
              }`}
              data-testid={`family-game-${game}`}
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex items-baseline gap-2 font-semibold">
                  <GameName variant={game} kanji stretched />
                  {game === variant ? <span className="text-xs font-normal text-muted">— the one you came from</span> : null}
                </span>
                <span className="text-sm text-muted">{sibling.tagline}</span>
                {sibling.inspiredBy !== undefined ? (
                  <span className="text-xs text-muted italic">Inspired by {sibling.inspiredBy}</span>
                ) : null}
              </span>
              <CardArrow />
            </li>
          );
        })}
      </ul>

      <p className="text-sm">
        <Link href="/games" className="underline underline-offset-4" data-testid="family-all-games">
          Every family, and every game <span className="font-mincho">全種目</span> →
        </Link>
      </p>
  </Page>
  );
}
