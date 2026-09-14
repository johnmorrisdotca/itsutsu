import Link from "next/link";

import { Paired } from "@/components/i18n/Paired";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { rulesPath, setUpLink } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { SET_UP_COPY } from "./live.constants";
import { RematchSwap, RematchTitle } from "./RematchHeading";
import { stillARematch } from "./setUpStart";
import type { HeadingTitle, RematchHeadingState, SetUpFrom } from "./setUp.types";

/**
 * WHAT THIS SETUP SCREEN IS FOR, SAID AT THE TOP OF IT.
 *
 * Six ways into a game now land on one screen, and the screen looks the same
 * from all of them — a form with the rules in it. Without this, a rematch, a
 * fork, a challenge and a fresh game are indistinguishable until you read the
 * fields and work out what they add up to, which is the opposite of the
 * confirmation John asked for.
 *
 * Shared by both setup pages rather than written twice, because they are one
 * screen with one difference — whether the game is still a choice — and a
 * heading is exactly the sort of thing that drifts when it is kept in two
 * files.
 *
 * A pre-filled screen also offers the way OUT of being pre-filled. A reader who
 * followed Play from somebody's page and then thought better of the opponent
 * should not have to work out that the plain screen is at a shorter address.
 *
 * A REMATCH'S TITLE AND SWAPPED COLOUR FOLLOW THE CHOICES BELOW, not only the
 * address the page opened with: choose somebody else and it reads as a new game
 * against them, choose the player from last time again and it reads as a rematch
 * again, with no reload either way. The server draws the address's answer, and
 * `RematchTitle` and `RematchSwap` carry on from there.
 */
export function SetUpHeading({
  from,
  variant,
}: {
  from: SetUpFrom;
  /** The game the address names, or null at /games/new. */
  variant: RuleVariant | null;
}) {
  const copy = variant === null ? null : RULE_VARIANT_DISPLAY[variant];
  const plain: HeadingTitle = copy !== null ? { en: copy.label, kanji: copy.kanji } : { en: "Set up a game", kanji: "対局設定" };

  const title: HeadingTitle =
    from.fork !== null
      ? { en: SET_UP_COPY.fork(from.fork.move), kanji: "分岐" }
      : from.opponent !== null
        ? { en: SET_UP_COPY.against(from.opponent.name), kanji: "対局" }
        : plain;

  /* What the address the page opened with says about the rematch: where its heading starts. */
  const rematch: RematchHeadingState | null =
    from.again === null
      ? null
      : {
          repeat: stillARematch({ rules: from.initial, source: from.asPlayed, opponent: from.opponent, again: from.again }),
          opponent: from.opponent === null ? null : { name: from.opponent.name },
        };

  /*
   * The lead under the title. A game named by the address says what the game is
   * — its own tagline, with the way through to how it is played — because that
   * is what somebody arriving at a game wants first. A rematch, a fork and a
   * challenge say what is already settled instead, because the game is not the
   * question any more.
   */
  const lead =
    from.again !== null || from.fork !== null || from.opponent !== null
      ? null
      : copy !== null
        ? copy.tagline
        : "Everything the game will be played under, settled here before it exists. Nothing is started until you say so.";

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold" data-testid="set-up-title">
        {from.again !== null && rematch !== null ? (
          <RematchTitle id={from.again.id} againName={from.again.opponent.name} plain={plain} initial={rematch} />
        ) : (
          <Paired en={title.en} kanji={title.kanji} kanjiClassName="text-lg font-normal opacity-70" />
        )}
      </h1>
      {lead !== null ? (
        <p className="max-w-prose text-sm text-muted">
          {lead}{" "}
          {variant !== null ? (
            <Link href={rulesPath(variant)} className="underline underline-offset-4">
              How it is played
            </Link>
          ) : (
            <Link href="/games" className="underline underline-offset-4">
              Every game there is
            </Link>
          )}
          .
        </p>
      ) : null}
      {/*
        THE WAY BACK OUT OF A PRE-FILLED SCREEN. Anything that arrives knowing
        something has to offer the version that knows nothing, or a reader who
        pressed the wrong Play has to edit an address. It is the same screen at
        a shorter one, which is the whole reason these facts travel in the query.
      */}
      {from.again !== null || from.fork !== null || from.opponent !== null ? (
        <p className="text-xs text-muted">
          <Link href={setUpLink({})} className="underline underline-offset-4" data-testid="set-up-fresh">
            {SET_UP_COPY.startOver}
          </Link>
          {/* The swapped colour, only while it is still a rematch — see `swapNote`. */}
          {from.again !== null && rematch !== null ? (
            <RematchSwap id={from.again.id} colour={from.again.colour} initial={rematch} />
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
