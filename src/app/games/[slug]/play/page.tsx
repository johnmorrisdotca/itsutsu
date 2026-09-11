import type { Metadata } from "next";
import { appearanceFor, gameDefaultsFor } from "@/lib/auth/members";
import { currentEmail } from "@/lib/auth/currentSession";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GameViewClient } from "@/components/game/GameViewClient";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siblingsOf } from "@/lib/gomoku/families";
import { gamePath, rulesPath, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/play">): Promise<Metadata> {
  const { slug } = await params;
  const variant = variantFor(slug);
  return { title: variant === null ? "Games" : `Play ${RULE_VARIANT_DISPLAY[variant].label}` };
}

/**
 * A board, at /games/<slug>/play.
 *
 * The verb is in the address now, one segment under the game. It used to BE
 * /games/<slug>, which meant the game's own address was an instruction rather
 * than a reference: every link to Renju started a game of Renju, whether the
 * reader wanted one or to find out what it was. The game's address is the
 * game; this is one of the things you can do with it.
 */
export default async function PlayPage({ params }: PageProps<"/games/[slug]/play">) {
  const { slug } = await params;
  const variant = variantFor(slug);
  if (variant === null) notFound();
  const copy = RULE_VARIANT_DISPLAY[variant];
  const siblings = siblingsOf(variant);
  // The member's own board, so a phone and a laptop set out the same one.
  const email = await currentEmail();
  const board = await appearanceFor(email);
  // Where a new game starts for them: board size, the switches, the clock.
  const defaults = await gameDefaultsFor(email);

  return (
    <Page width="wide">
      <SiteHeader />
      <GameViewClient
        variant={variant}
        trackPath
        appearance={board}
        signedIn={email !== null}
        defaults={defaults}
      />
      <footer className="flex flex-col gap-2 border-t border-rule pt-5 text-sm text-muted">
        <p>
          {/*
            The name leads to the game — its own page, where everything about
            it is — rather than to a second board, which is where the reader
            already is.
          */}
          <Link href={gamePath(variant)} className="font-medium text-ink underline underline-offset-4">
            {copy.label}
          </Link>{" "}
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
