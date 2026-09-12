import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RATING_START } from "./elo";
import { RATING_POOLS } from "./pools";

/**
 * The two ladders move together or neither moves.
 *
 * `Player` counts a name's games across every game on the site;
 * `PlayerVariantRating` counts the same games under the one game they were
 * played at. They are two tables and one fact, and the fault this file guards
 * is the two of them disagreeing: for a while the writer committed the ladder
 * half and then opened a SECOND transaction for the standings half, so
 * anything that stopped the second one — a unique violation on a standing
 * nobody had created yet, an invocation cut off mid-request — left the ladder
 * a game ahead for ever. Two computer players reached production that way.
 *
 * So the test that matters is the FAILING one: a standings write that will not
 * land must take the ladder write down with it. A test that only checks the
 * happy path passes just as well over two transactions as over one.
 *
 * The fake below is a database with Prisma's BATCH semantics rather than a
 * mock that records calls: `update` returns an unapplied write, and
 * `$transaction` applies the whole array or none of it. That is what the real
 * `$transaction([...])` does, and it is the only way an atomicity test can
 * mean anything.
 */

type Row = Record<string, unknown>;
type Write = { apply: () => void; check: () => void };

const players = new Map<string, Row>();
const standings = new Map<string, Row>();
/** Standing keys rigged to refuse their update, to stand in for a real failure. */
const refusing = new Set<string>();
/** Names rigged to lose the create race once, as two concurrent writers do. */
const racing = new Set<string>();
let transactions = 0;
/** Every write, in the order the transaction applied it — the lock order. */
let applied: string[] = [];

function standingKey(key: string, variant: string): string {
  return `${key}${variant}`;
}

function raceError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
  });
}

/** Applies `poolWrite`'s shape: plain numbers set, `{ increment }` adds. */
function merge(row: Row, data: Row): void {
  for (const [column, value] of Object.entries(data)) {
    if (typeof value === "object" && value !== null && "increment" in value) {
      const by = (value as { increment: number }).increment;
      row[column] = ((row[column] as number) ?? 0) + by;
    } else {
      row[column] = value;
    }
  }
}

const prisma = {
  member: { findMany: async () => [] as { id: string; name: string }[] },
  player: {
    upsert: async ({ where, create, update }: { where: { key: string }; create: Row; update: Row }) => {
      const found = players.get(where.key);
      if (found === undefined) {
        if (racing.has(where.key)) {
          // The other writer got there first; the row now exists.
          racing.delete(where.key);
          players.set(where.key, { ...create, ratedGames: 0, computerRatedGames: 0 });
          throw raceError();
        }
        const made: Row = { ...create, ratedGames: 0, computerRatedGames: 0 };
        players.set(where.key, made);
        return made;
      }
      merge(found, update);
      return found;
    },
    update: ({ where, data }: { where: { key: string }; data: Row }): Write => ({
      check: () => {
        if (!players.has(where.key)) throw new Error(`no player ${where.key}`);
      },
      apply: () => {
        applied.push(`player:${where.key}`);
        merge(players.get(where.key) as Row, data);
      },
    }),
  },
  playerVariantRating: {
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { key_variant: { key: string; variant: string } };
      create: Row;
      update: Row;
    }) => {
      const at = standingKey(where.key_variant.key, where.key_variant.variant);
      const found = standings.get(at);
      if (found === undefined) {
        const made: Row = { ...create, ratedGames: 0, computerRatedGames: 0 };
        standings.set(at, made);
        return made;
      }
      merge(found, update);
      return found;
    },
    update: ({
      where,
      data,
    }: {
      where: { key_variant: { key: string; variant: string } };
      data: Row;
    }): Write => {
      const at = standingKey(where.key_variant.key, where.key_variant.variant);
      return {
        check: () => {
          if (refusing.has(at)) throw new Error(`the standings write for ${at} will not land`);
        },
        apply: () => {
          applied.push(`standing:${at}`);
          merge(standings.get(at) as Row, data);
        },
      };
    },
  },
  /*
   * Prisma's own promise: every write is checked before ANY is applied, and a
   * refusal leaves the whole array undone. Without this the test could not
   * tell one transaction from two.
   */
  $transaction: async (writes: Write[]) => {
    transactions += 1;
    for (const write of writes) write.check();
    for (const write of writes) write.apply();
  },
};

vi.mock("@/lib/prisma", () => ({ prisma }));

const { recordResult } = await import("./recordResult");

function figures(row: Row | undefined) {
  return row === undefined
    ? null
    : {
        ratedGames: row.ratedGames,
        wins: row.wins ?? 0,
        losses: row.losses ?? 0,
        draws: row.draws ?? 0,
        rating: row.rating,
      };
}

beforeEach(() => {
  players.clear();
  standings.clear();
  refusing.clear();
  racing.clear();
  transactions = 0;
  applied = [];
});

describe("recording a rated result", () => {
  it("moves the ladder and the standing by the same one game, in one transaction", async () => {
    await recordResult("Ada", "Bob", "black", "freestyle", RATING_POOLS.people);

    expect(figures(players.get("ada"))).toEqual({ ratedGames: 1, wins: 1, losses: 0, draws: 0, rating: 1620 });
    expect(figures(standings.get(standingKey("ada", "freestyle")))).toEqual({
      ratedGames: 1,
      wins: 1,
      losses: 0,
      draws: 0,
      rating: 1620,
    });
    expect(figures(players.get("bob"))?.ratedGames).toBe(1);
    expect(figures(standings.get(standingKey("bob", "freestyle")))?.ratedGames).toBe(1);
    // ONE commit for all four figure writes. Two would be the bug back.
    expect(transactions).toBe(1);
    expect(applied).toHaveLength(4);
  });

  it("keeps the two counts equal over a run of games", async () => {
    for (let game = 0; game < 5; game += 1) {
      await recordResult("Ada", "Bob", game % 2 === 0 ? "black" : null, "freestyle", RATING_POOLS.people);
    }
    expect(players.get("ada")?.ratedGames).toBe(5);
    expect(standings.get(standingKey("ada", "freestyle"))?.ratedGames).toBe(5);
    expect(players.get("bob")?.ratedGames).toBe(5);
    expect(standings.get(standingKey("bob", "freestyle"))?.ratedGames).toBe(5);
  });

  /**
   * THE ONE THIS FILE EXISTS FOR. A standings write that will not land must
   * leave the ladder exactly where it was — not one game ahead of a standing
   * that never got the game.
   */
  it("leaves the ladder alone when the standing cannot be written", async () => {
    refusing.add(standingKey("meijin", "reversi"));

    await expect(
      recordResult("Hidemasa Tamenoki", "Meijin", "white", "reversi", RATING_POOLS.computer),
    ).rejects.toThrow(/will not land/);

    // The rows exist — opening them is not the fault — but no game was counted
    // on either side of either table.
    expect(players.get("meijin")?.computerRatedGames).toBe(0);
    expect(players.get("hidemasa tamenoki")?.computerRatedGames).toBe(0);
    expect(standings.get(standingKey("meijin", "reversi"))?.computerRatedGames).toBe(0);
    expect(standings.get(standingKey("hidemasa tamenoki", "reversi"))?.computerRatedGames).toBe(0);
    // And a row nobody has played is a row at the starting rating, which is
    // what every reader already filters out on `ratedGames > 0`.
    expect(players.get("meijin")?.rating).toBe(RATING_START);
  });

  it("counts the game once the standing can be written again", async () => {
    refusing.add(standingKey("meijin", "reversi"));
    await expect(
      recordResult("Hidemasa Tamenoki", "Meijin", "white", "reversi", RATING_POOLS.computer),
    ).rejects.toThrow();
    refusing.clear();

    await recordResult("Hidemasa Tamenoki", "Meijin", "white", "reversi", RATING_POOLS.computer);
    expect(players.get("meijin")?.computerRatedGames).toBe(1);
    expect(standings.get(standingKey("meijin", "reversi"))?.computerRatedGames).toBe(1);
  });

  /**
   * The likeliest trigger of the production fault, closed at the source: two
   * writers creating the same row at once. The loser wanted a row that now
   * exists, so it reads it rather than raising — the result is recorded.
   */
  it("records the result when another writer created the row first", async () => {
    racing.add("ada");
    await recordResult("Ada", "Bob", "black", "hex", RATING_POOLS.people);
    expect(players.get("ada")?.ratedGames).toBe(1);
    expect(standings.get(standingKey("ada", "hex"))?.ratedGames).toBe(1);
  });

  /**
   * A fixed lock order, so two games between the same pair with the colours
   * swapped cannot deadlock. Which seat is black decides the figures; it never
   * decides the order.
   */
  it("writes the rows in the same order whichever seat is black", async () => {
    await recordResult("Zoe", "Ada", "black", "freestyle", RATING_POOLS.people);
    const first = [...applied];
    applied = [];
    await recordResult("Ada", "Zoe", "black", "freestyle", RATING_POOLS.people);
    expect(applied).toEqual(first);
    expect(first).toEqual([
      "player:ada",
      "player:zoe",
      `standing:${standingKey("ada", "freestyle")}`,
      `standing:${standingKey("zoe", "freestyle")}`,
    ]);
  });

  it("writes nothing at all for a game no rating can be had from", async () => {
    // Both seats under one name: the rule is `rateable.ts`, and it comes first.
    await recordResult("Ada", "ada", "black", "freestyle", RATING_POOLS.people);
    await recordResult("", "Bob", "black", "freestyle", RATING_POOLS.people);
    expect(players.size).toBe(0);
    expect(standings.size).toBe(0);
    expect(transactions).toBe(0);
  });

  it("moves the pool the game was played in and leaves the other one alone", async () => {
    await recordResult("Ada", "Meijin", null, "freestyle", RATING_POOLS.computer);
    const ada = players.get("ada");
    expect(ada?.computerRatedGames).toBe(1);
    expect(ada?.computerDraws).toBe(1);
    expect(ada?.ratedGames).toBe(0);
    expect(ada?.rating).toBe(RATING_START);
    const standing = standings.get(standingKey("ada", "freestyle"));
    expect(standing?.computerRatedGames).toBe(1);
    expect(standing?.ratedGames).toBe(0);
  });
});
