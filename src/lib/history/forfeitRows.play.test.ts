/**
 * Rewrites the passes a claimed timeout wrote as the forfeits they were, once.
 *
 * Until the `forfeit` kind, a claim under the graceful penalty wrote the
 * missed turn as a PASS in every game. Wherever the rules offer no pass —
 * every game but Go, and a piece game with nothing to lay — the replay
 * refuses that row and stops, so each of those games has sat a turn short of
 * itself ever since: the side that claimed is told it is not their move, the
 * side that timed out collides with the row the claim wrote. The claim now
 * writes a forfeit. This is for the rows it had already written.
 *
 * `forfeitRows.ts` decides, one game at a time, and refuses anything that does
 * not fit a timeout exactly — read its header for the rules. This runner reads,
 * prints every verdict, and writes only when asked twice:
 *
 *   FORFEIT_ROWS=1 pnpm exec vitest run src/lib/history/forfeitRows.play.test.ts --disable-console-intercept
 *       report on the database in your .env; writes nothing
 *   FORFEIT_ROWS=1 FORFEIT_ROWS_RUN=1 pnpm exec vitest run src/lib/history/forfeitRows.play.test.ts --disable-console-intercept
 *       repair it
 *   node scripts/forfeit-rows-prod.mjs                       report on production
 *   FORFEIT_ROWS_RUN=1 node scripts/forfeit-rows-prod.mjs    repair production — take a Neon branch first
 *
 * READ THE FIRST LINE IT PRINTS: the database it actually reached and how many
 * games that holds. An inline DATABASE_URL has been silently overridden by
 * `.env` on this project before, and the count settles which one it is.
 *
 * A repair is one row's `kind`, from `pass` to `forfeit`, guarded on still
 * being a pass — so running it twice changes nothing the second time. On a
 * game still being played it also writes the settled turn from the repaired
 * replay, in the same transaction, because a move changed and the stored turn
 * must move with it. A finished game keeps its own: a resignation is not on
 * the record, so a replay cannot restate how it ended.
 *
 * It is a `.test.ts` for the reason every runner here is: `@/` aliases and
 * `server-only` resolve under vitest and nowhere else.
 */
import { describe, expect, it } from "vitest";

import { MOVE_KINDS } from "@/lib/gomoku/gomoku.constants";

const ASKED = process.env.FORFEIT_ROWS === "1";
const RUN = process.env.FORFEIT_ROWS_RUN === "1";

describe("rewriting the passes a timeout wrote as forfeits", () => {
  it.runIf(ASKED)(
    "reports every record stopped at a refused pass, and repairs only when asked twice",
    async () => {
      const { prisma } = await import("@/lib/prisma");
      const { GAME_ROW, replay } = await import("./liveGame");
      const { planForfeitRow } = await import("./forfeitRows");
      const { settledTurn } = await import("./settledTurn");

      try {
        const [reached] = await prisma.$queryRaw<{ db: string; host: string | null }[]>`
          select current_database() as db, inet_server_addr()::text as host`;
        const games = await prisma.game.count();
        console.log(`\nDatabase: ${reached.db} on ${reached.host ?? "a local socket"} — ${games} games.`);
        console.log(RUN ? "FORFEIT_ROWS_RUN=1: repairs WILL be written.\n" : "Report only: nothing is written. FORFEIT_ROWS_RUN=1 writes the repairs.\n");

        const holding = await prisma.move.findMany({
          where: { kind: MOVE_KINDS.pass },
          select: { gameId: true },
          distinct: ["gameId"],
        });
        let whole = 0;
        let repairs = 0;
        let refused = 0;

        for (const { gameId } of holding) {
          const game = await prisma.game.findUnique({ where: { id: gameId }, select: { ...GAME_ROW, moveCount: true } });
          if (game === null) continue;
          const verdict = planForfeitRow(game);
          if (verdict === null) {
            whole += 1;
            continue;
          }
          const label = `${gameId}  ${game.variant}  ${game.status}  move ${verdict.number}`;
          if (verdict.kind === "refused") {
            refused += 1;
            console.log(`REFUSED    ${label}: ${verdict.reason}`);
            continue;
          }
          repairs += 1;
          console.log(`${RUN ? "REPAIRING " : "WOULD FIX "} ${label}: ${verdict.stone}'s turn, lost on time`);
          if (!RUN) continue;

          const moves = game.moves.map((move) => (move.number === verdict.number ? { ...move, kind: MOVE_KINDS.forfeit } : move));
          const state = replay({ ...game, moves });
          const [written] = await prisma.$transaction([
            prisma.move.updateMany({
              where: { gameId, number: verdict.number, kind: MOVE_KINDS.pass },
              data: { kind: MOVE_KINDS.forfeit },
            }),
            ...(game.status === "active" ? [prisma.game.update({ where: { id: gameId }, data: settledTurn(state) })] : []),
          ]);
          expect(written.count, `${label}: exactly the one row`).toBe(1);

          const after = await prisma.game.findUnique({ where: { id: gameId }, select: GAME_ROW });
          expect(after, `${label}: still there`).not.toBeNull();
          expect(replay(after!).moves, `${label}: replays whole once repaired`).toHaveLength(after!.moves.length);
        }

        console.log(
          `\n${holding.length} games hold a pass: ${whole} replay whole, ${repairs} ${RUN ? "repaired" : "to repair"}, ${refused} refused.`,
        );
      } finally {
        await prisma.$disconnect();
      }
    },
    600_000,
  );
});
