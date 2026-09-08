import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GameViewClient } from "@/components/game/GameViewClient";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { variantFor } from "@/lib/gomoku/slugs";
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

  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-6xl flex-col gap-8">
        <SiteHeader />
        <GameViewClient variant={variant} trackPath />
        <footer className="flex flex-col gap-2 border-t border-rule pt-5 text-sm text-muted">
          <p>
            <span className="font-medium text-ink">{copy.label}</span>{" "}
            <span className="font-mincho">{copy.kanji}</span> — {copy.tagline}{" "}
            <Link href={`/rules/${variant}`} className="underline underline-offset-4">
              Rules
            </Link>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
