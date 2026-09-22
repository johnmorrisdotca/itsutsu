"use client";

import { matchPath, seatPath } from "@/lib/gomoku/slugs";

import { colourToTake, type ColourChoice } from "./colourChoice";
import { DOORSTEP_COPY } from "./live.constants";
import { drawnCreation } from "./setUpStart";

/**
 * WRITING THE GAME — the one act in this flow that writes anything, in one
 * place because two screens now perform it.
 *
 * It lived inside `Doorstep.tsx`, which was the only screen that could begin a
 * game: the set-up screen carried the draft to /games/<game>/begin and that
 * page made it. John, 2026-09-21: "our game signup and starting process seems
 * to have one too many screens… too much repeat info on the multi-screens."
 * The doorstep and the set-up screen were stating the same rules a press
 * apart, so the set-up screen states them and begins the game itself.
 *
 * THE DOORSTEP DID NOT GO, and it should not: it is still the screen for
 * TAKING SOMEBODY ELSE'S POSTED SEAT (`waitingRoom.ts` links to it), where the
 * rules being agreed to are theirs rather than yours, and reading them before
 * sitting down is the whole point. What moved is the ordinary case, where the
 * reader wrote the rules themselves on the screen before.
 *
 * So the act is here, shared, and neither screen can drift into making a
 * different request from the other.
 */

/** What Begin will do. Three shapes, because they are three different acts. */
export type BeginAction =
  | {
      kind: "create";
      body: Record<string, unknown>;
      /**
       * Which seat the asker takes, where they were offered the choice
       * (`colourIsChosen`). Settled into `body.asColour` as the game is
       * written — a lot with the same roll a drawn opponent uses — so the
       * route only ever hears a colour. Absent where the choice was not
       * offered, and then the route's own rule stands: whoever asks is black.
       */
      colour?: ColourChoice;
    }
  /*
   * A game against a computer player drawn at random from `pool`. The draw is made
   * as Begin is pressed and not before, so a reload of this page never shows one
   * program and makes another.
   */
  | { kind: "draw"; body: Record<string, unknown>; pool: readonly { id: string; name: string }[]; colour?: ColourChoice }
  | {
      kind: "sit";
      id: string;
      who: string;
      /**
       * The game to make if that seat has gone by the time Begin is pressed.
       *
       * Carried rather than fetched, so the answer to losing the race is one more
       * press rather than a trip back through the setup screen — and stated rather
       * than taken, which is the part the screen before this one got wrong: it fell
       * through to posting a game of its own in silence, so a press that named a
       * person could do something else entirely without saying so.
       */
      instead: Record<string, unknown>;
    };

/**
 * Writing the game, plus the promise about the opening stone.
 *
 * `botReply` says this browser will play the computer's opening move itself, so
 * the route does not work it out on a paid function — the same flag, meaning the
 * same thing, as on every move after it. It is claimed only where a worker can
 * genuinely be made, because claiming it without one would leave a new game
 * waiting on a move nobody is working on; and the very next thing this function
 * does is send the player to the board, which is what answers.
 */
export async function create(
  body: Record<string, unknown>,
  variant: string,
): Promise<string | { error: string }> {
  const response = await fetch("/api/games/live", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      typeof Worker === "undefined" ? body : { ...body, botReply: true },
    ),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return { error: body?.error ?? DOORSTEP_COPY.refused };
  }
  const created = (await response.json()) as { id: string; blackToken?: string };
  /*
   * A posted seat belongs to nobody yet, so its creator goes in by their own seat
   * link, which claims black for them. Everything else binds both seats as it is
   * written, so its own address seats whoever opens it — and the token for a seat
   * that is somebody else's is not returned at all, which is why this reads
   * `Location` rather than assuming a link it could build.
   */
  const to = response.headers.get("Location");
  return body.open === true && created.blackToken !== undefined
    ? seatPath(variant, created.id, created.blackToken)
    : (to ?? matchPath(variant, created.id));
}

/** Taking a seat somebody already posted, rather than posting a second one beside it. */
export async function takeSeat(begin: { id: string }): Promise<string | { error: string }> {
  const sat = await fetch(`/api/games/${begin.id}/sit`, { method: "POST" });
  if (!sat.ok) {
    const body = (await sat.json().catch(() => null)) as { error?: string } | null;
    return { error: body?.error ?? DOORSTEP_COPY.seatGone };
  }
  const { path } = (await sat.json()) as { path: string };
  return path;
}


/**
 * Begin, whatever shape it takes: take the seat, make the game, or make the
 * game a lost seat was standing in for.
 *
 * `taking` is the caller's answer to "is that seat still worth trying" — false
 * once a press has already been refused it — so a second press makes the game
 * instead of asking again for something that has gone. Kept as an argument
 * rather than state in here, because the screen has to SAY that it happened
 * and this function cannot.
 */
export async function beginGame({
  begin,
  variant,
  taking,
  roll = Math.random(),
}: {
  begin: BeginAction;
  variant: string;
  taking: boolean;
  /** The draw, made as the game is created and never before. */
  roll?: number;
}): Promise<string | { error: string }> {
  if (begin.kind === "sit") {
    return taking ? takeSeat(begin) : create(begin.instead, variant);
  }
  const seated = (body: Record<string, unknown>) =>
    begin.colour === undefined ? body : { ...body, asColour: colourToTake(begin.colour, roll) };
  if (begin.kind === "draw") return create(seated(drawnCreation(begin.body, begin.pool, roll)), variant);
  return create(seated(begin.body), variant);
}
