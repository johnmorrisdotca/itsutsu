/**
 * XP, earned by playing a real game against a real database.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT IS FOR, AND WHY IT IS NOT AN ORDINARY TEST
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Every rule in `src/lib/xp/` is unit tested over a fake that honours the one
 * thing the real schema enforces. That proves the rules. It does not prove that
 * the WIRING is reached: a rider one line into `appendMove` is present, typed
 * and green whether or not a real move ever runs it, which is exactly the shape
 * AGENTS.md calls "a test that reaches its subject by a route no reader takes".
 *
 * So this plays a game in process — `createLiveGame` and `appendMove`, the very
 * functions a move from a browser calls — and then reads the ledger back. It is
 * the same pattern as `botSeries.play.test.ts` and for the same reason: the
 * search and the writes happen on this machine, and what reaches the database is
 * a handful of small rows rather than a few hundred serverless invocations.
 *
 * ```sh
 * XP_EARNED=1 pnpm vitest run src/lib/xp/xpEarned.play.test.ts --disable-console-intercept
 * ```
 *
 * It does nothing at all without `XP_EARNED=1`, because it writes to whatever
 * `.env` points at.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT BRINGS ITS OWN WORLD AND TAKES IT AWAY AGAIN
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Two members with generated ids and generated names, a game between them, and
 * a `finally` that deletes the members, the game, the moves and every XpEvent it
 * wrote. **It must never touch a real row**: the local database is shared, it
 * holds John's own member row, and XP written onto it would be XP he did not
 * earn — so nothing here reads or writes a member it did not create.
 */
import { afterAll, describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import { appendMove, createLiveGame } from "@/lib/history/liveGame";
import { prisma } from "@/lib/prisma";

import { isWeekend } from "./xpDay";
import { toToasts } from "./xpFlash";

const ASKED = process.env.XP_EARNED === "1";

/** A name nothing else could be using, and short enough for the column. */
const stamp = Date.now().toString(36).slice(-6);
const BLACK = { id: `xpb${stamp}`.slice(0, 16), name: `XP Black ${stamp}` };
const WHITE = { id: `xpw${stamp}`.slice(0, 16), name: `XP White ${stamp}` };

afterAll(async () => {
  if (!ASKED) return;
  const ids = [BLACK.id, WHITE.id];
  await prisma.xpEvent.deleteMany({ where: { memberId: { in: ids } } });
  await prisma.game.deleteMany({ where: { OR: [{ blackMemberId: BLACK.id }, { whiteMemberId: WHITE.id }] } });
  await prisma.member.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

describe.runIf(ASKED)("a game played, and the XP it pays", () => {
  it("pays both seats, writes the flash, and the flash becomes toasts", async () => {
    for (const who of [BLACK, WHITE]) {
      await prisma.member.create({
        data: {
          id: who.id,
          email: `${who.id}@xp.invalid`,
          name: who.name,
          /* Marked so a sweep can tell what made it, and so nothing real is
             ever mistaken for one of these. */
          unclaimableBecause: "seed",
        },
      });
    }

    /*
     * Noughts and crosses, which ends in five moves and cannot be drawn by
     * accident when one side is trying. Only the fields a live game stores —
     * spreading the engine's settings would pass columns the row has not got.
     */
    const created = await createLiveGame({
      variant: RULE_VARIANTS.tictactoe,
      size: 3,
      winLength: 3,
      opener: STONES.black,
      blackName: BLACK.name,
      whiteName: WHITE.name,
      blackMemberId: BLACK.id,
      whiteMemberId: WHITE.id,
      obstacles: DEFAULT_SETTINGS.obstacles,
      opening: DEFAULT_SETTINGS.opening,
      handicap: DEFAULT_SETTINGS.handicap,
      drawLimit: DEFAULT_SETTINGS.drawLimit,
      moveTimeMs: null,
      open: false,
      rated: false,
      timeoutPenalty: "turn",
      allowResign: true,
    });

    /* Black takes the top row; white answers in the middle one. Five moves, and
       black wins on the board rather than on the clock. */
    const line: { row: number; col: number; token: string }[] = [
      { row: 0, col: 0, token: created.blackToken },
      { row: 1, col: 0, token: created.whiteToken },
      { row: 0, col: 1, token: created.blackToken },
      { row: 1, col: 1, token: created.whiteToken },
      { row: 0, col: 2, token: created.blackToken },
    ];
    for (const move of line) {
      const outcome = await appendMove(created.id, move.token, {
        kind: "place",
        row: move.row,
        col: move.col,
      });
      expect(outcome.ok, JSON.stringify(outcome)).toBe(true);
    }

    const finished = await prisma.game.findUnique({
      where: { id: created.id },
      select: { status: true, winner: true, moveCount: true },
    });
    expect(finished?.status).toBe("finished");
    expect(finished?.winner).toBe(STONES.black);

    const events = await prisma.xpEvent.findMany({
      where: { memberId: { in: [BLACK.id, WHITE.id] } },
      orderBy: [{ memberId: "asc" }, { createdAt: "asc" }],
      select: { memberId: true, type: true, subject: true, points: true },
    });
    const of = (id: string) => events.filter((row) => row.memberId === id).map((row) => row.type);

    console.log("\nWhat the winner earned:");
    for (const row of events.filter((one) => one.memberId === BLACK.id)) {
      console.log(`  +${row.points}  ${row.type}  ${row.subject === "" ? "—" : row.subject}`);
    }
    console.log("What the loser earned:");
    for (const row of events.filter((one) => one.memberId === WHITE.id)) {
      console.log(`  +${row.points}  ${row.type}  ${row.subject === "" ? "—" : row.subject}`);
    }

    /*
     * The finish, the first game ever, the tour's two, the win, the person, and
     * the first win at this game. A loss pays the first four.
     *
     * AND THE WEEKEND, WHEN IT IS ONE. This runner plays on the real clock on
     * purpose — it is the live check — so the day of the week is part of what it
     * is verifying rather than something to be neutralised. The unit suites fix
     * Date to a Wednesday; this one says what it expects today and was first run
     * on a Saturday, which is how the weekend award was seen paying for real.
     */
    const weekend = isWeekend(new Date(), "") ? ["weekendGame"] : [];
    expect(of(BLACK.id)).toEqual([
      "gameFinished",
      "firstGameEver",
      "firstOfVariant",
      "firstOfFamily",
      ...weekend,
      "gameWon",
      "wonVsPerson",
      "firstWinAtVariant",
    ]);
    expect(of(WHITE.id)).toEqual([
      "gameFinished",
      "firstGameEver",
      "firstOfVariant",
      "firstOfFamily",
      ...weekend,
    ]);
    // Keyed as the design says: the game for the result awards, the game's own
    // name for the tour, and nothing for the once-ever one.
    const subjects = new Map(events.filter((row) => row.memberId === BLACK.id).map((row) => [row.type, row.subject]));
    expect(subjects.get("gameFinished")).toBe(created.id);
    expect(subjects.get("firstOfVariant")).toBe("tictactoe");
    expect(subjects.get("firstOfFamily")).toBe("small-boards");
    expect(subjects.get("firstGameEver")).toBe("");

    /*
     * AND THE TOAST. The flash is the column the masthead reads on the next page
     * the member opens; `toToasts` is what turns it into what the host draws. A
     * ledger that paid and a flash that says nothing would be a silent toast,
     * which is the half of this nobody would notice.
     */
    const rows = await prisma.member.findMany({
      where: { id: { in: [BLACK.id, WHITE.id] } },
      select: { id: true, xp: true, xpFlash: true, xpLastAt: true },
    });
    const winner = rows.find((row) => row.id === BLACK.id);
    const owed = events
      .filter((row) => row.memberId === BLACK.id)
      .reduce((total, row) => total + row.points, 0);
    expect(winner?.xp).toBe(owed);
    expect(winner?.xpLastAt).not.toBeNull();

    const toasts = toToasts(winner?.xpFlash);
    console.log("\nWhat the winner is about to be shown:");
    for (const toast of toasts) {
      console.log(`  +${toast.points}  ${toast.label}${toast.kanji ? ` ${toast.kanji}` : ""} — ${toast.sentence}`);
    }
    expect(toasts.length).toBe(of(BLACK.id).length);
    for (const toast of toasts) {
      expect(toast.label.length).toBeGreaterThan(2);
      expect(toast.sentence.length).toBeGreaterThan(5);
      expect(toast.points).toBeGreaterThan(0);
    }
  }, 120_000);
});
