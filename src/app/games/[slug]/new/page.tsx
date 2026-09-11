import { Paired } from "@/components/i18n/Paired";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SetUpGame } from "@/components/live/SetUpGame";
import type { RulesDraft } from "@/components/live/rulesDraft";
import { currentEmail } from "@/lib/auth/currentSession";
import { gameDefaultsFor } from "@/lib/auth/members";
import { boardSizesFor, OPENING_RULES, sizeForVariant } from "@/lib/gomoku/gomoku.constants";
import { rulesPath, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { fetchOpponents } from "@/lib/social/opponents";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/new">): Promise<Metadata> {
  const { slug } = await params;
  const variant = variantFor(slug);
  return { title: variant === null ? "Set up a game" : `Set up ${RULE_VARIANT_DISPLAY[variant].label}` };
}

/**
 * Setting a game up, at /games/<slug>/new — before the game exists.
 *
 * The address names the game the way every other address here does, and the
 * screen is the whole of the decision: the rules, the clock, and who it is
 * against. Nothing is written until the button is pressed, so there is no
 * half-made game to land on, no board that is not really a board, and no
 * settings that can move under an address already pointing at them.
 */
export default async function SetUpPage({ params }: PageProps<"/games/[slug]/new">) {
  const { slug } = await params;
  const variant = variantFor(slug);
  if (variant === null) notFound();

  const email = await currentEmail();
  const [defaults, opponents] = await Promise.all([gameDefaultsFor(email), fetchOpponents(email)]);
  const copy = RULE_VARIANT_DISPLAY[variant];

  /*
   * What the member usually plays, on the board this game is played on. Their
   * standing board size is only a wish where the game has boards to choose
   * between; a game with one board gets that board.
   */
  const initial: RulesDraft = {
    variant,
    size: sizeForVariant(variant, boardSizesFor(variant).includes(defaults.size) ? defaults.size : boardSizesFor(variant)[0]),
    obstacles: "none",
    opening: OPENING_RULES.free,
    moveTimeMs: defaults.moveTimeMs,
    timeoutPenalty: "turn",
    clockMode: "move",
    rated: true,
    allowResign: true,
    open: true,
  };

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-lg font-normal opacity-70" />
        </h1>
        <p className="max-w-prose text-sm text-muted">
          {copy.tagline}{" "}
          <Link href={rulesPath(variant)} className="underline underline-offset-4">
            How it is played
          </Link>
          .
        </p>
      </div>
      <SetUpGame initial={initial} opponents={opponents} signedIn={email !== null} />
    </Page>
  );
}
