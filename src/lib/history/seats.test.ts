import { describe, expect, it } from "vitest";

import { rulesAreSettled, seatIsFree } from "./seats";
import { STONES } from "@/lib/gomoku/gomoku.constants";

/**
 * Whether a seat is still to be given out.
 *
 * A seat's link is the whole credential — it plays that seat on its own — so
 * this decides both what is advertised on the noticeboard and whose
 * credential is printed on screen. It used to short-circuit on a posted seat
 * and answer "free" whatever else was on the row, which is how a game stayed
 * on offer while one person played both colours of it.
 */
describe("seatIsFree", () => {
  const empty = { openSeat: null, blackClaimedAt: null, whiteClaimedAt: null, moveCount: 0, offeredAt: null };

  it("offers a seat nobody has taken", () => {
    expect(seatIsFree(empty, STONES.black)).toBe(true);
    expect(seatIsFree(empty, STONES.white)).toBe(true);
  });

  it("stops offering a seat once somebody has taken it", () => {
    const taken = { ...empty, whiteClaimedAt: new Date() };
    expect(seatIsFree(taken, STONES.white)).toBe(false);
    expect(seatIsFree(taken, STONES.black)).toBe(true);
  });

  it("stops offering a POSTED seat once somebody has taken it", () => {
    /*
     * The bug. A posted seat used to be read as untaken "by definition",
     * which meant its link stayed on screen and the game stayed on the
     * noticeboard after it had been sat in — so the person who posted it
     * could take it themselves and play both sides, and a stranger could
     * answer a game that was already under way.
     */
    const posted = { ...empty, openSeat: STONES.white };
    expect(seatIsFree(posted, STONES.white), "before anybody answers").toBe(true);

    const answered = { ...posted, whiteClaimedAt: new Date() };
    expect(seatIsFree(answered, STONES.white), "after somebody answers").toBe(false);
  });

  it("offers nothing once a stone is down, whatever the seats say", () => {
    // Past inviting anybody: a link on screen is only a credential to read
    // over a shoulder, and a computer player never stamps a seat at all.
    const started = { ...empty, openSeat: STONES.white, moveCount: 1 };
    expect(seatIsFree(started, STONES.white)).toBe(false);
    expect(seatIsFree(started, STONES.black)).toBe(false);
  });

  /*
   * ─────────────────────────────────────────────────────────────────────────
   * AND NEITHER SEAT OF AN OFFER IS FREE
   * ─────────────────────────────────────────────────────────────────────────
   *
   * A seat that is "free" in the sense this function means is one ANYBODY may
   * take, and here is its link. An offered seat is spoken for by name: it
   * belongs to one member, who reaches it by accepting and by no other door.
   *
   * BOTH seats rather than only the offered one, because the other is the
   * offerer's own — there is nobody to invite to either of them, and an offer
   * mints a credential for nobody. It is also what settles an offer's rules
   * the moment it is made, through `rulesAreSettled` below.
   *
   * The bug this closed was on the board: `LiveMatch` selected the six columns
   * this function used to take and not `offeredAt`, so it read `undefined` as
   * "not an offer" and advertised the offeree's seat to the room — with a
   * link, and a four-words panel beside it. `offeredAt` is required now, so
   * the compiler is the thing that catches the next caller to forget it.
   */
  it("offers neither seat of a game proposed to somebody", () => {
    const offered = { ...empty, offeredAt: new Date("2026-09-12T10:00:00Z") };
    expect(seatIsFree(offered, STONES.white), "the seat that was offered").toBe(false);
    expect(seatIsFree(offered, STONES.black), "the offerer's own seat").toBe(false);
  });

  it("offers them again once the offer has been accepted and cleared", () => {
    /*
     * Accepting clears `offeredAt`, so this is the row it leaves behind — and
     * the seats then read exactly as any other game's do. The accepted seat is
     * stamped by `acceptOffer`, which is why only one of them comes back.
     */
    const accepted = { ...empty, whiteClaimedAt: new Date() };
    expect(seatIsFree(accepted, STONES.white)).toBe(false);
    expect(seatIsFree(accepted, STONES.black)).toBe(true);
  });
});

/**
 * The rules of a shared game settle when the other player arrives, not when
 * somebody plays. Between sitting down and moving there used to be a window
 * where one seat could change what the other had just agreed to.
 */
describe("rulesAreSettled", () => {
  const nobody = { openSeat: null, blackClaimedAt: null, whiteClaimedAt: null, moveCount: 0, offeredAt: null };

  it("leaves a game nobody has answered open", () => {
    // A creator who posted the wrong clock can still fix it.
    expect(rulesAreSettled({ ...nobody, openSeat: "white", blackClaimedAt: new Date() })).toBe(false);
  });

  /*
   * A CHALLENGE IS SETTLED THE MOMENT IT IS WRITTEN, which is a reversal and a
   * deliberate one.
   *
   * It used to stay open until the invited player opened the board. That was
   * unavoidable while a challenge settled nothing — the old button posted a game
   * of Gomoku on the schema's defaults, so the form beside the board was the only
   * place its rules were ever chosen. Every challenge is now sent from the setup
   * screen with the rules already agreed, so the form afterwards is not the only
   * chance to choose them; it is only the chance to move them under somebody who
   * has already been handed the game.
   */
  it("settles a challenge the moment it is written, before anybody opens it", () => {
    const challenge = { ...nobody, blackMemberId: "mem_a", whiteMemberId: "mem_b" };
    expect(rulesAreSettled(challenge)).toBe(true);
    // Even for the challenger, who is the only one who has looked at it.
    expect(rulesAreSettled({ ...challenge, blackClaimedAt: new Date() })).toBe(true);
  });

  it("leaves a game open while only one seat belongs to anybody", () => {
    /*
     * A seat posted on the noticeboard, and a private game whose other seat
     * goes out as a link, both look like this: one member id and a null. Nobody
     * else is in it, so the creator can still fix a clock they got wrong.
     */
    expect(rulesAreSettled({ ...nobody, blackMemberId: "mem_a", whiteMemberId: null })).toBe(false);
    expect(rulesAreSettled({ ...nobody, blackMemberId: "mem_a", blackClaimedAt: new Date() })).toBe(false);
  });

  it("settles them once the other seat is taken", () => {
    // This is the window that used to be open: both sitting, nobody moved yet.
    expect(rulesAreSettled({ ...nobody, blackClaimedAt: new Date(), whiteClaimedAt: new Date() })).toBe(true);
  });

  it("settles them once a posted seat has been answered, whatever the poster did", () => {
    /*
     * The case that matters most and the one a both-seats-claimed rule gets
     * wrong: the poster never opened their own link, so nothing is stamped
     * for them, and the answerer would have had the rules changed under them.
     */
    const posted = { ...nobody, openedAt: new Date(), openSeat: "white" as string | null };
    expect(rulesAreSettled(posted)).toBe(false);
    expect(rulesAreSettled({ ...posted, openSeat: null, whiteClaimedAt: new Date() })).toBe(true);
  });

  it("settles them once a stone is down, whoever followed a link", () => {
    // A computer player never follows one, so its seat is never stamped.
    expect(rulesAreSettled({ ...nobody, moveCount: 1 })).toBe(true);
  });

  /*
   * AND AN OFFER'S RULES ARE SETTLED THE MOMENT IT IS MADE, because the rules
   * ARE the offer. A challenger who could move the board, the clock or the
   * game itself while the question stood would be asking one thing and
   * starting another — which is the very window the setup screen exists to
   * close, reopened at the far end.
   *
   * Through `seatIsFree` rather than by a test of its own here, which is why
   * this reads as one line: the offer makes neither seat free, and the foot of
   * `rulesAreSettled` already means "both seats are somebody's".
   */
  it("settles the rules of a game that has been offered to somebody", () => {
    expect(rulesAreSettled({ ...nobody, offeredAt: new Date("2026-09-12T10:00:00Z") })).toBe(true);
  });
});
