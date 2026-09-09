import type { Metadata } from "next";
import { appearanceFor } from "@/lib/auth/members";
import { currentEmail } from "@/lib/auth/currentSession";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GameViewClient } from "@/components/game/GameViewClient";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siblingsOf } from "@/lib/gomoku/families";
import { gamePath, rulesPath, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const variant = variantFor(slug);
  return { title: variant === null ? "Games" : RULE_VARIANT_DISPLAY[variant].label };
}

/**
 * A game, ready to play. The address names it — /games/gomoku — so a link
 * from a rules page, a message or a bookmark starts a fresh game of that kind.
 */
export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  const { slug } = await params;
  const variant = variantFor(slug);
  if (variant === null) notFound();
  const copy = RULE_VARIANT_DISPLAY[variant];
  const siblings = siblingsOf(variant);
  // The member's own board, so a phone and a laptop set out the same one.
  const email = await currentEmail();
  const board = await appearanceFor(email);

  return (
    <Page width="wide">
      <SiteHeader />
      <GameViewClient variant={variant} trackPath appearance={board} signedIn={email !== null} />
      <footer className="flex flex-col gap-2 border-t border-rule pt-5 text-sm text-muted">
        <p>
          <span className="font-medium text-ink">{copy.label}</span>{" "}
          <span className="font-mincho">{copy.kanji}</span> — {copy.tagline}{" "}
          <Link href={rulesPath(variant)} className="underline underline-offset-4">
            Rules
          </Link>
          .
        </p>
        {siblings !== null && siblings.games.length > 0 ? (
          <p data-testid="family-links">
            Also in {siblings.family.title}{" "}
            <span className="font-mincho">{siblings.family.kanji}</span>:{" "}
            {siblings.games.map((game, i) => (
              <span key={game}>
                {i > 0 ? " · " : ""}
                <Link href={gamePath(game)} className="underline underline-offset-4">
                  {RULE_VARIANT_DISPLAY[game].label}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </footer>
  </Page>
  );
}
