import { beforeEach, describe, expect, it, vi } from "vitest";

import { OPERATOR_ACTIONS, OPERATOR_DETAIL_MAX } from "./operatorLog.constants";

/**
 * The operator log's writer.
 *
 * THE PROPERTY THESE EXIST FOR is that a row holds who, what, to whom, when and
 * a capped line of fact — and nothing a caller happens to be holding. The four
 * words a member picks are a password; the writer is shaped so there is no
 * field they could arrive in.
 */

type ActionRow = {
  id: string;
  at: Date;
  actorMemberId: string | null;
  actorEmail: string | null;
  action: string;
  subjectId: string;
  detail: string;
};

let created: Record<string, unknown>[] = [];
let actionRows: ActionRow[] = [];
let memberRows: { id: string; name: string }[] = [];
let findManyArgs: unknown[] = [];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    operatorAction: {
      create: ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return Promise.resolve(data);
      },
      findMany: async (args: { take: number }) => {
        findManyArgs.push(args);
        return [...actionRows].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, args.take);
      },
    },
    member: {
      findMany: async ({ where }: { where: { id: { in: string[] } } }) => memberRows.filter((row) => where.id.in.includes(row.id)),
    },
  },
}));

const { listOperatorActions, operatorActionData, operatorActor, operatorDetail, recordOperatorAction } = await import(
  "./operatorLog"
);

const OPERATOR = { memberId: "op1dxxxxxxxxxxxx", email: "operator@example.test" };

beforeEach(() => {
  created = [];
  actionRows = [];
  memberRows = [];
  findManyArgs = [];
});

describe("who acted", () => {
  it("keeps both what the session knows", () => {
    expect(operatorActor({ memberId: " op1dxxxxxxxxxxxx ", email: "operator@example.test" })).toEqual(OPERATOR);
  });

  it("is null, not blank, for whatever the session does not say", () => {
    expect(operatorActor({ email: "operator@example.test" })).toEqual({ memberId: null, email: "operator@example.test" });
    expect(operatorActor({ memberId: "  ", email: "" })).toEqual({ memberId: null, email: null });
    expect(operatorActor(null)).toEqual({ memberId: null, email: null });
  });
});

describe("the line of fact", () => {
  it("is one line, capped, and empty when nothing is said", () => {
    expect(operatorDetail("replaced   words\nset on\tMonday")).toBe("replaced words set on Monday");
    expect(operatorDetail("x".repeat(OPERATOR_DETAIL_MAX + 50))).toHaveLength(OPERATOR_DETAIL_MAX);
    expect(operatorDetail(undefined)).toBe("");
  });
});

describe("the row an act becomes", () => {
  it("holds exactly who, what, to whom and the fact — no field for anything else to ride in on", () => {
    const data = operatorActionData({
      actor: OPERATOR,
      action: OPERATOR_ACTIONS.wordsSet,
      subjectId: " hanakoxxxxxxxxx ",
      detail: "replaced words set on 2026-03-03T10:00:00.000Z",
    });
    expect(data).toEqual({
      actorMemberId: OPERATOR.memberId,
      actorEmail: OPERATOR.email,
      action: "wordsSet",
      subjectId: "hanakoxxxxxxxxx",
      detail: "replaced words set on 2026-03-03T10:00:00.000Z",
    });
    expect(Object.keys(data).sort()).toEqual(["action", "actorEmail", "actorMemberId", "detail", "subjectId"]);
  });

  it("refuses an act done to nobody rather than writing one", () => {
    expect(() => operatorActionData({ actor: OPERATOR, action: OPERATOR_ACTIONS.shut, subjectId: "  " })).toThrow(/names the member/);
  });

  it("is written once when recorded on its own", async () => {
    await recordOperatorAction({ actor: OPERATOR, action: OPERATOR_ACTIONS.wordsPickOpened, subjectId: "hanakoxxxxxxxxx" });
    expect(created).toEqual([
      { actorMemberId: OPERATOR.memberId, actorEmail: OPERATOR.email, action: "wordsPickOpened", subjectId: "hanakoxxxxxxxxx", detail: "" },
    ]);
  });
});

describe("the list the Admin tab reads", () => {
  it("asks for the newest first, as many as it was given, and names each member as they are now", async () => {
    actionRows = [
      { id: "a", at: new Date("2026-09-15T10:00:00Z"), actorMemberId: null, actorEmail: "operator@example.test", action: "shut", subjectId: "m1", detail: "" },
      { id: "b", at: new Date("2026-09-15T11:00:00Z"), actorMemberId: null, actorEmail: "operator@example.test", action: "restore", subjectId: "m1", detail: "" },
    ];
    memberRows = [{ id: "m1", name: "Hanako M." }];
    const listed = await listOperatorActions(10);
    expect(findManyArgs[0]).toMatchObject({ orderBy: [{ at: "desc" }, { id: "desc" }], take: 10 });
    expect(listed.map((act) => [act.action, act.subjectName])).toEqual([
      ["restore", "Hanako M."],
      ["shut", "Hanako M."],
    ]);
  });

  it("keeps an act whose member row has gone, and one this version cannot name", async () => {
    actionRows = [
      { id: "a", at: new Date("2026-09-15T10:00:00Z"), actorMemberId: "op", actorEmail: null, action: "somethingNewer", subjectId: "gone", detail: "" },
    ];
    const [act] = await listOperatorActions(10);
    expect(act.subjectName).toBeNull();
    expect(act.known).toBe(false);
    expect(act.action).toBe("somethingNewer");
    expect(act.actor).toEqual({ memberId: "op", email: null });
  });
});
