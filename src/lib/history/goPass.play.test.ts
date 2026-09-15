/**
 * Proves two computer players can finish a live game of Go, through the same
 * function that answers a real move request.
 *
 * A Razryad v Kyu game on 9×9 stuck at move 84: the engine said a pass was on
 * offer, the computer chose one, and `appendMove` refused it because it only
 * ever accepted a pass the rules FORCED — which Go never does. `livePass.test.ts`
 * holds that rule against a mocked client. This holds the part a mock cannot:
 * that `playBotTurns`, a real database and the real replay carry a Go game all
 * the way to a filed result.
 *
 * It writes to whatever `DATABASE_URL` points at, so it is asked for twice, as
 * the other runners are, and the first time it only says which database it
 * reached. Run it on a scratch database you create and drop:
 *
 *   GO_PASS_CHECK=1 pnpm exec vitest run src/lib/history/goPass.play.test.ts --disable-console-intercept
 *   GO_PASS_CHECK=1 GO_PASS_RUN=1 pnpm exec vitest run src/lib/history/goPass.play.test.ts --disable-console-intercept
 *
 * The game is deleted when it ends. `GO_PASS_RATED=1` plays it rated, which
 * also writes rating rows under the two programs' names on the computer
 * ladder — rows the delete does not reach, so only on a database nobody reads.
 */
import { describe, expect, it } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { playBotTurns } from "@/lib/bots/botPlay";
import { DEFAULT_SETTINGS, GAME_STATUS, MOVE_KINDS, STONES, VARIANT_SPECS, WIN_REASONS } from "@/lib/gomoku/gomoku.constants";
import { BOT_TIERS } from "@/lib/gomoku/opponent.constants";
import { prisma } from "@/lib/prisma";
import { GAME_ROW, createLiveGame, replay } from "./liveGame";

const ASKED = process.env.GO_PASS_CHECK === "1";
const RUN = process.env.GO_PASS_RUN === "1";
const RATED = process.env.GO_PASS_RATED === "1";

describe("a live game of Go between two computer players", () => {
  it.skipIf(!ASKED)("plays to a finish, passing where it chooses to", async () => {
    const held = await prisma.game.count();
    console.log(`\nConnected to a database holding ${held} game(s). If that is not the one you meant, stop now.\n`);
    if (!RUN) {
      console.log("Report only — nothing played. Set GO_PASS_RUN=1 as well to play the game.\n");
      await prisma.$disconnect();
      return;
    }

    await ensureBotMembers();
    const black = BOT_MEMBERS[BOT_TIERS.razryad];
    const white = BOT_MEMBERS[BOT_TIERS.kyu];
    const { id } = await createLiveGame({
      variant: "go",
      size: 9,
      winLength: VARIANT_SPECS.go.winLength ?? DEFAULT_SETTINGS.winLength,
      opener: STONES.black,
      blackName: black.name,
      whiteName: white.name,
      blackMemberId: black.id,
      whiteMemberId: white.id,
      obstacles: DEFAULT_SETTINGS.obstacles,
      opening: DEFAULT_SETTINGS.opening,
      handicap: DEFAULT_SETTINGS.handicap,
      headStart: DEFAULT_SETTINGS.headStart,
      drawLimit: DEFAULT_SETTINGS.drawLimit,
      moveTimeMs: null,
      timeoutPenalty: "turn",
      allowResign: true,
      open: false,
      rated: RATED,
    });

    try {
      // The same loop the batch runner uses: ask until the game is filed, and
      // call a request that moves nothing what it is — stuck.
      let stuckAt: number | null = null;
      for (let asked = 0; asked < 400; asked += 1) {
        const before = await prisma.game.findUnique({ where: { id }, select: { status: true, moveCount: true } });
        if (before === null || before.status !== "active") break;
        await playBotTurns(id);
        const after = await prisma.game.findUnique({ where: { id }, select: { status: true, moveCount: true } });
        if (after !== null && after.status === "active" && after.moveCount === before.moveCount) {
          stuckAt = after.moveCount;
          break;
        }
      }

      const row = await prisma.game.findUnique({ where: { id }, select: { ...GAME_ROW, result: true, winner: true } });
      expect(row, "the game vanished").not.toBeNull();
      if (row === null) return;
      const passes = row.moves.filter((move) => move.kind === MOVE_KINDS.pass).length;
      const state = replay(row);
      console.log(
        `  ${black.name} v ${white.name}, 9×9 Go: ${row.status} after ${row.moves.length} moves, ` +
          `${passes} pass(es), ${state.winBy ?? "no ending"}, winner ${row.winner ?? "none"}` +
          (stuckAt === null ? "" : `, STUCK at ${stuckAt}`),
      );

      expect(stuckAt, "the players stopped moving on an unfinished game").toBeNull();
      expect(row.status).toBe("finished");
      expect(state.status).not.toBe(GAME_STATUS.playing);
      // Filed as the replay reads it, not as something else.
      expect(row.winner).toBe(state.winner);
      expect(row.result).toBe(state.winner ?? "draw");
      expect(passes, "no pass reached the record, so this proves nothing about passing").toBeGreaterThan(0);
      if (state.winBy === WIN_REASONS.territory) {
        expect(row.moves.slice(-2).map((move) => move.kind)).toEqual([MOVE_KINDS.pass, MOVE_KINDS.pass]);
      }
    } finally {
      await prisma.game.delete({ where: { id } });
      await prisma.$disconnect();
    }
  }, 1_800_000);
});
