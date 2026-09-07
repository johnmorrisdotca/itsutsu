import { afterEach, describe, expect, it } from "vitest";

import { signEmbedToken, verifyEmbedToken } from "./embedToken";
import { signPayload } from "./signing";

const SECRET = "an-embed-secret-long-enough-to-pass";

function env(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => env({ AUTH_SECRET: undefined, EMBED_TOKEN_EPOCH: undefined }));

describe("embed tokens", () => {
  it("round-trips a token it signed", async () => {
    env({ AUTH_SECRET: SECRET });
    const token = await signEmbedToken("umakuma");

    await expect(verifyEmbedToken(token!)).resolves.toMatchObject({
      kind: "embed",
      label: "umakuma",
    });
  });

  it("issues nothing without a secret, so no embed is accepted", async () => {
    env({ AUTH_SECRET: undefined });
    expect(await signEmbedToken("umakuma")).toBeNull();
    expect(await verifyEmbedToken("anything")).toBeNull();
  });

  it("refuses a token signed with a different secret", async () => {
    env({ AUTH_SECRET: SECRET });
    const token = (await signEmbedToken("umakuma"))!;

    env({ AUTH_SECRET: "a-completely-different-embed-secret" });
    expect(await verifyEmbedToken(token)).toBeNull();
  });

  it("refuses an expired token", async () => {
    env({ AUTH_SECRET: SECRET });
    expect(await verifyEmbedToken((await signEmbedToken("old", -1))!)).toBeNull();
  });

  /**
   * The important one. Both are signed with the same key, so only the `kind`
   * check stops a session cookie being pasted into an iframe URL as an embed
   * token, or an embed token being presented as a signed-in session.
   */
  it("refuses a session cookie presented as an embed token", async () => {
    env({ AUTH_SECRET: SECRET });
    const session = await signPayload({
      kind: "admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    expect(session).not.toBeNull();
    expect(await verifyEmbedToken(session!)).toBeNull();
  });

  it("refuses every token issued before the epoch", async () => {
    env({ AUTH_SECRET: SECRET });
    const token = (await signEmbedToken("umakuma"))!;
    expect(await verifyEmbedToken(token)).not.toBeNull();

    // Turning the big red button: everything outstanding stops working.
    env({ EMBED_TOKEN_EPOCH: String(Math.floor(Date.now() / 1000) + 1) });
    expect(await verifyEmbedToken(token)).toBeNull();
  });

  it("ignores a malformed epoch rather than locking everyone out", async () => {
    env({ AUTH_SECRET: SECRET, EMBED_TOKEN_EPOCH: "not-a-number" });
    const token = (await signEmbedToken("umakuma"))!;
    expect(await verifyEmbedToken(token)).not.toBeNull();
  });

  it("refuses rubbish without throwing", async () => {
    env({ AUTH_SECRET: SECRET });
    for (const token of ["", "a", "a.b", "...", undefined]) {
      expect(await verifyEmbedToken(token)).toBeNull();
    }
  });
});
