import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * EVERY TABLE THAT POINTS AT A MEMBER IS ANSWERED FOR WHEN ONE IS REMOVED.
 *
 * `removeMember` has to know every place a member's id is written, and the
 * schema is where a new one appears. So this reads `schema.prisma` and asks,
 * for every model: does a field hold a member's id — a relation to `Member`,
 * or a column named for one — and if so, is it either a relation that
 * cascades, or a model `removeMember.ts` writes to by name? A table added
 * next month with a `memberId` fails here until removal says what happens to
 * it, rather than leaving that member's rows behind after they asked to go.
 */

const schema = readFileSync("prisma/schema.prisma", "utf8");
const removal = readFileSync("src/lib/auth/removeMember.ts", "utf8");

/** Columns that hold a member's id without saying so in their name, by model. */
const UNNAMED_MEMBER_COLUMNS: Record<string, string[]> = {
  AutoMatchRequest: ["member"],
  SocialRowWithoutMember: ["owner", "target"],
};

/** Columns named for a member that are not one, with the reason. */
const NOT_A_MEMBER: Record<string, string> = {
  // A seat's display name under a game, and a kept record's key: removed with the ladder rows under blankSeats, never read as an id.
};

type Field = { model: string; field: string; line: string };

function fields(): Field[] {
  const out: Field[] = [];
  for (const [, model, body] of schema.matchAll(/model (\w+) \{([\s\S]*?)\n\}/g)) {
    for (const raw of body!.split("\n")) {
      const line = raw.trim();
      if (line === "" || line.startsWith("//") || line.startsWith("@@")) continue;
      const field = line.split(/\s+/)[0]!;
      out.push({ model: model!, field, line });
    }
  }
  return out;
}

const camel = (model: string) => model[0]!.toLowerCase() + model.slice(1);

describe("removing a member answers for every table that points at one", () => {
  const pointing = fields().filter(
    ({ model, field, line }) =>
      model !== "Member" &&
      (/\bMember\b.*@relation/.test(line) ||
        /(^m|M)emberId$/.test(field) ||
        (UNNAMED_MEMBER_COLUMNS[model] ?? []).includes(field)) &&
      !(`${model}.${field}` in NOT_A_MEMBER),
  );

  it("finds the tables it is checking", () => {
    expect(pointing.length).toBeGreaterThan(10);
  });

  it.each(pointing.map((one) => [`${one.model}.${one.field}`, one] as const))("%s cascades or is written by removeMember", (_, one) => {
    const relation = /\bMember\b.*@relation/.test(one.line);
    if (relation) {
      expect(one.line, `${one.model}.${one.field} must cascade when its member goes`).toMatch(/onDelete:\s*Cascade/);
      return;
    }
    // A column a Member relation in the same model is built on cascades with it.
    const cascadesVia = fields().some(
      (other) =>
        other.model === one.model &&
        /\bMember\b.*@relation/.test(other.line) &&
        new RegExp(`fields:\\s*\\[${one.field}\\]`).test(other.line) &&
        /onDelete:\s*Cascade/.test(other.line),
    );
    if (cascadesVia) return;
    // A plain column: removal must write that model and name that column.
    const writes = new RegExp(`prisma\\.${camel(one.model)}\\.[\\s\\S]*?\\b${one.field}\\b`);
    expect(removal, `removeMember.ts never says what happens to ${one.model}.${one.field}`).toMatch(writes);
  });

  it("never deletes a game or a move", () => {
    expect(removal).not.toMatch(/prisma\.(game|move)\.delete/);
  });
});
