import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClaimOutcome } from "@/lib/auth/claimRecord.types";

/**
 * The operator's door onto attaching a kept record, from the route in.
 *
 * `claimRecord.test.ts` pins every refusal as a rule. This pins that the ROUTE
 * proves the operator rather than a member, looks before it writes unless told
 * to attach, sends the member named in the PATH, gives the modal a status and a
 * sentence for each refusal, and never puts the typed name in a log line.
 */

const NAME = "Little Hana";
const PLAN = { games: 3, seats: 3, rating: true, standings: 2 };

const currentAdmin = vi.fn<() => Promise<{ email?: string } | null>>(async () => ({ email: "op@example.com" }));
const previewClaim = vi.fn<(name: string, memberId: string) => Promise<ClaimOutcome>>(async (_name, memberId) => ({
  ok: true,
  member: { id: memberId, name: "Hanako" },
  plan: PLAN,
}));
const claimRecord = vi.fn<(input: { name: string; memberId: string; by: unknown }) => Promise<ClaimOutcome>>(
  async ({ memberId }) => ({ ok: true, member: { id: memberId, name: "Hanako" }, plan: PLAN }),
);
const logOperatorAction = vi.fn<(who: string | null | undefined, what: string) => void>(() => undefined);

vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null, RATE_LIMITS: {} }));
vi.mock("@/lib/auth/requireAdmin", () => ({ currentAdmin: () => currentAdmin() }));
vi.mock("@/lib/auth/claimRecord", () => ({
  previewClaim: (...args: Parameters<typeof previewClaim>) => previewClaim(...args),
  claimRecord: (...args: Parameters<typeof claimRecord>) => claimRecord(...args),
}));
vi.mock("@/lib/auth/operatorLog", () => ({
  logOperatorAction: (...args: Parameters<typeof logOperatorAction>) => logOperatorAction(...args),
  operatorActor: (session: { memberId?: string; email?: string } | null) => ({
    memberId: session?.memberId ?? null,
    email: session?.email ?? null,
  }),
}));

const { POST } = await import("./route");

function post(body: unknown, id = "hanako0000xxxxxx") {
  return POST(
    new Request(`https://itsutsu.com/api/admin/members/${id}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

beforeEach(() => {
  currentAdmin.mockClear().mockResolvedValue({ email: "op@example.com" });
  previewClaim.mockClear();
  claimRecord.mockClear();
  logOperatorAction.mockClear();
});

describe("POST /api/admin/members/[id]/claim", () => {
  it("is not there for anybody but the operator, and neither looks nor claims", async () => {
    currentAdmin.mockResolvedValue(null);
    expect((await post({ name: NAME, confirm: true })).status).toBe(404);
    expect(previewClaim).not.toHaveBeenCalled();
    expect(claimRecord).not.toHaveBeenCalled();
  });

  it("asks for a name rather than looking up nothing", async () => {
    expect((await post({ name: "   " })).status).toBe(400);
    expect(previewClaim).not.toHaveBeenCalled();
  });

  it("looks, and writes nothing, when it is not told to attach", async () => {
    const response = await post({ name: `  ${NAME} ` });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ member: { id: "hanako0000xxxxxx", name: "Hanako" }, plan: PLAN });
    expect(previewClaim).toHaveBeenCalledWith(NAME, "hanako0000xxxxxx");
    expect(claimRecord).not.toHaveBeenCalled();
  });

  it("claims for the member in the path, as the operator, when told to attach", async () => {
    const response = await post({ name: NAME, confirm: true }, "otherxxxxxxxxxxx");
    expect(response.status).toBe(200);
    expect(claimRecord).toHaveBeenCalledWith({
      name: NAME,
      memberId: "otherxxxxxxxxxxx",
      by: { memberId: null, email: "op@example.com" },
    });
    expect(previewClaim).not.toHaveBeenCalled();
  });

  it("keeps a console line of what moved, without the name", async () => {
    await post({ name: NAME, confirm: true });
    expect(logOperatorAction).toHaveBeenCalledTimes(1);
    expect(logOperatorAction.mock.calls[0][1]).toContain("3 finished games");
    expect(logOperatorAction.mock.calls[0][1]).not.toContain(NAME);
  });

  it("answers 404 for a member who is not there", async () => {
    claimRecord.mockResolvedValueOnce({ ok: false, reason: "no-member" });
    expect((await post({ name: NAME, confirm: true })).status).toBe(404);
    expect(logOperatorAction).not.toHaveBeenCalled();
  });

  it("answers 422 with the reason and a sentence for every other refusal, and no name", async () => {
    previewClaim.mockResolvedValueOnce({ ok: false, reason: "record-unclaimable" });
    const response = await post({ name: NAME });
    expect(response.status).toBe(422);
    const body = (await response.json()) as { error: string; reason: string };
    expect(body.reason).toBe("record-unclaimable");
    expect(body.error).toMatch(/can never be claimed/);
    expect(JSON.stringify(body)).not.toContain(NAME);
  });
});
