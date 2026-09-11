import type { Metadata } from "next";
import Link from "next/link";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SetUpGame } from "@/components/live/SetUpGame";
import type { RulesDraft } from "@/components/live/rulesDraft";
import { currentEmail } from "@/lib/auth/currentSession";
import { gameDefaultsFor } from "@/lib/auth/members";
import {
  boardSizesFor,
  DEFAULT_SETTINGS,
  OPENING_RULES,
  sizeForVariant,
} from "@/lib/gomoku/gomoku.constants";
import { seatsToSitAt } from "@/lib/history/seatsToSitAt";
import { fetchOpponents } from "@/lib/social/opponents";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Set up a game" };

/**
 * Setting a game up when no game has been chosen yet, at /games/new.
 *
 * The game itself is the first thing on the screen, which is the piece that
 * was missing. Everything else was already here: /games/<game>/new settles a
 * game somebody has already picked, and settles it properly. But there was no
 * way to say "I want a game" without first saying which — so the way in from
 * the lobby stayed a sentence with a dropdown in it, and John's word for that
 * was very bad design.
 *
 * The two screens are one screen. This is it with the game still to choose;
 * the other is it with the game named by the address, where offering to change
 * it would make the address a lie.
 *
 * Nothing is written until the button at the bottom, which is the whole point
 * of the ticket this answers: there is no half-made game to land on, no board
 * that is not really a board, and no settings that can move under an address
 * already pointing at them.
 */
export default async function SetUpAnyGamePage() {
  const email = await currentEmail();
  const [defaults, opponents, seats] = await Promise.all([
    gameDefaultsFor(email),
    fetchOpponents(email),
    seatsToSitAt(),
  ]);

  /*
   * What they usually play, on a board that game is played on. A standing
   * board size is a wish rather than an instruction: a game with one board
   * gets that board, whatever the member usually likes.
   */
  const variant = DEFAULT_SETTINGS.variant;
  const sizes = boardSizesFor(variant);
  const initial: RulesDraft = {
    variant,
    size: sizeForVariant(variant, sizes.includes(defaults.size) ? defaults.size : sizes[0]),
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
        <h1 className="text-2xl font-semibold">Set up a game 対局設定</h1>
        <p className="max-w-prose text-sm text-muted">
          Everything the game will be played under, settled here before it exists. Nothing is started until you say
          so.{" "}
          <Link href="/games" className="underline underline-offset-4">
            Every game there is
          </Link>{" "}
          if you would rather read about one first.
        </p>
      </div>
      <SetUpGame initial={initial} opponents={opponents} seats={seats} signedIn={email !== null} chooseGame />
    </Page>
  );
}
