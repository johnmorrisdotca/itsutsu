import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The two doors a stranger can become a member through, and the one question
 * both of them ask.
 *
 * ONE FILE FOR BOTH, deliberately, against the usual rule of a test beside its
 * source. The property worth protecting is not what either route does on its
 * own — it is that they AGREE: a mode that admitted somebody at one door and
 * turned them away at the other would be a mode the panel could not describe
 * and nobody could reason about. Two files cannot assert a relationship between
 * two routes; this one can, and the last block does.
 *
 * Google is mocked because the identity is the one thing a test cannot make for
 * real: `getServerSession` reads a cookie a live OAuth round trip sets. That is
 * also why this is here rather than in the browser suite — the branch these
 * cover is unreachable from a spec, so covering it anywhere else would be
 * covering it nowhere. What a browser CAN drive is the panel and the door's
 * copy, and `e2e/site-settings.spec.ts` drives those.
 */

const googleUser = { email: "stranger@example.com", name: "A Stranger", image: "" };
let signedInWithGoogle: typeof googleUser | null = googleUser;
let existingMember: { email: string; name: string; picture: string } | null = null;
let mode = "invite-only";

const admitMember = vi.fn(async (input: { email: string; name: string }) => ({
  email: input.email,
  name: input.name,
  picture: "",
  created: existingMember === null,
}));

vi.mock("next-auth", () => ({
  getServerSession: async () =>
    signedInWithGoogle === null ? null : { user: signedInWithGoogle },
}));
vi.mock("@/lib/auth/google", () => ({ authOptions: {}, isGoogleAuthConfigured: () => true }));
vi.mock("@/lib/api/rateLimit", () => ({
  overLimit: () => null,
  RATE_LIMITS: { read: {}, redeemCode: {}, adminSignIn: {} },
}));
vi.mock("@/lib/auth/members", () => ({
  findMember: async () => existingMember,
  admitMember: (input: { email: string; name: string }) => admitMember(input),
  foldEmail: (email: string) => email.toLowerCase(),
  isBanned: async () => false,
  touchMember: async () => ({ banned: false }),
}));
vi.mock("@/lib/site/siteStore", () => ({ registrationMode: async () => mode }));
vi.mock("@/lib/invite/inviteStore", () => ({
  redeemInviteCode: async () => ({ ok: true, code: "hoshi-kuma-nami" }),
}));

const { GET: googleDoor } = await import("./google/route");
const { POST: codeDoor } = await import("./route");

beforeEach(() => {
  process.env.AUTH_SECRET = "a-secret-long-enough-to-be-accepted";
  process.env.ADMIN_EMAILS = "operator@itsutsu.com";
  signedInWithGoogle = googleUser;
  existingMember = null;
  mode = "invite-only";
  admitMember.mockClear();
});

/** A completed Google sign-in arriving at the callback with nothing else. */
function googleReturning(): Request {
  return new Request("https://itsutsu.com/api/session/google?next=/games");
}

/** A three-word code presented while a Google identity waits at the door. */
function codePresented(): Request {
  return new Request("https://itsutsu.com/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "invite", code: "hoshi-kuma-nami" }),
  });
}

describe("a stranger arriving with Google and no code", () => {
  it("is sent back to the door under invite-only, and no member is made", async () => {
    mode = "invite-only";
    const response = await googleDoor(googleReturning());
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/join");
    expect(admitMember).not.toHaveBeenCalled();
  });

  /*
   * The whole of what John asked for: "allow the site to open up to be
   * self-registered without an invite code".
   */
  it("becomes a member when the door is open, with no code at all", async () => {
    mode = "open";
    const response = await googleDoor(googleReturning());
    expect(admitMember).toHaveBeenCalledWith(
      expect.objectContaining({ email: googleUser.email }),
    );
    expect(response.status).toBe(307);
    // Straight to choosing the name other players will see, which is what the
    // first visit has always done for a member the invite code just made.
    expect(response.headers.get("location")).toContain("/me?welcome=1");
    expect(response.headers.get("set-cookie")).toContain("gomoku_session=");
  });

  it("is turned away when the door is closed, and no member is made", async () => {
    mode = "closed";
    const response = await googleDoor(googleReturning());
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/join");
    expect(admitMember).not.toHaveBeenCalled();
  });
});

describe("a stranger arriving with a code", () => {
  it("becomes a member under invite-only, which is what the code is for", async () => {
    mode = "invite-only";
    const response = await codeDoor(codePresented());
    expect(response.status).toBe(200);
    expect(admitMember).toHaveBeenCalledWith(
      expect.objectContaining({ email: googleUser.email, invitedWith: "hoshi-kuma-nami" }),
    );
  });

  it("becomes a member when the door is open, since a code is more than enough", async () => {
    mode = "open";
    const response = await codeDoor(codePresented());
    expect(response.status).toBe(200);
    expect(admitMember).toHaveBeenCalled();
  });

  /*
   * The case that makes "nobody new" mean what the panel says it means. A mode
   * that let last week's code still make members would not be the mode the
   * panel is describing, and the operator would have shut a door that was still
   * open.
   */
  it("is refused when the door is closed, even holding a valid code", async () => {
    mode = "closed";
    const response = await codeDoor(codePresented());
    expect(response.status).toBe(401);
    expect(admitMember).not.toHaveBeenCalled();
  });

  /*
   * A browser redeeming a code with no Google identity behind it makes no
   * member row — it is a pass for this browser, which is what an invite has
   * always been for somebody with no Google account. Unchanged by all three
   * modes, and asserted so that tightening the door cannot quietly start
   * turning those away as well.
   */
  it("still lets a browser with no Google account in on a code, whatever the mode", async () => {
    signedInWithGoogle = null;
    for (const each of ["invite-only", "open", "closed"]) {
      mode = each;
      const response = await codeDoor(codePresented());
      expect(response.status, `a codeholder with no account, under ${each}`).toBe(200);
      expect(admitMember).not.toHaveBeenCalled();
    }
  });
});

/**
 * NOBODY ALREADY IN IS EVER AFFECTED. This is the near-miss UmaKuma's backlog
 * records, asserted rather than asserted-in-a-comment: a lockdown setting that
 * shuts out the people who already hold accounts is the one way this feature
 * can do real damage, and `closed` is the mode that would do it.
 */
describe("a member who is already in", () => {
  beforeEach(() => {
    existingMember = { email: googleUser.email, name: "A Member", picture: "" };
  });

  it("signs in with Google under every mode, closed included", async () => {
    for (const each of ["invite-only", "open", "closed"]) {
      mode = each;
      admitMember.mockClear();
      const response = await googleDoor(googleReturning());
      expect(response.status, `signing in under ${each}`).toBe(307);
      expect(response.headers.get("location"), `signing in under ${each}`).toContain("/games");
      expect(response.headers.get("set-cookie")).toContain("gomoku_session=");
      expect(admitMember, `${each} must still refresh the row`).toHaveBeenCalled();
    }
  });

  it("is not asked to choose a name again, whatever the mode", async () => {
    mode = "open";
    const response = await googleDoor(googleReturning());
    expect(response.headers.get("location")).not.toContain("welcome=1");
  });
});

/**
 * The relationship the two doors have to keep, which is the reason both are in
 * one file. Written as a table so a fourth mode cannot be added to the registry
 * with the two doors disagreeing about it.
 */
describe("the two doors agree about every mode", () => {
  const expected: Record<string, { withCode: boolean; without: boolean }> = {
    "invite-only": { withCode: true, without: false },
    open: { withCode: true, without: true },
    closed: { withCode: false, without: false },
  };

  it("admits exactly who mayJoin says, at both doors", async () => {
    for (const [each, answer] of Object.entries(expected)) {
      mode = each;

      admitMember.mockClear();
      signedInWithGoogle = googleUser;
      await googleDoor(googleReturning());
      expect(
        admitMember.mock.calls.length > 0,
        `${each}: Google with no code should ${answer.without ? "admit" : "refuse"}`,
      ).toBe(answer.without);

      admitMember.mockClear();
      await codeDoor(codePresented());
      expect(
        admitMember.mock.calls.length > 0,
        `${each}: a code should ${answer.withCode ? "admit" : "refuse"}`,
      ).toBe(answer.withCode);
    }
  });

  it("covers every mode the registry offers, so a new one cannot arrive untested", async () => {
    const { REGISTRATION_MODES } = await import("@/lib/site/site.constants");
    expect(Object.keys(expected).sort()).toEqual([...REGISTRATION_MODES].sort());
  });
});
