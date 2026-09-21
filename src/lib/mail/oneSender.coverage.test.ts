import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NOTICES } from "./mail.constants";

/**
 * THERE IS ONE WAY OUT OF THIS SITE, AND THE CAPS ARE ON IT.
 *
 * This site sends through Resend's free plan, and `mailCounter.ts` keeps it
 * under that plan by counting every send. A counter only works if everything
 * passes it, so the danger is not a bug in the caps — it is a SECOND SENDER
 * that never meets them. The site had one: `lib/notify/email.ts` answered
 * "not sent" for every game notice and read an `EMAIL_PROVIDER` variable set
 * nowhere, sitting directly under nine notification tickets. For each of
 * those, giving that file its own transport was the smaller diff, and the
 * first one to do it would have put the site's whole notification volume
 * outside the caps. Resend cuts the ACCOUNT off at a hundred a day, so the
 * invitations people clicked for would have stopped too.
 *
 * It reads the source, like the other coverage gates here, because what it is
 * guarding is a property of the tree rather than of any one function: nothing
 * anywhere may grow a way of its own to send.
 */

const MAIL_DIR = join(process.cwd(), "src", "lib", "mail");
const SRC = join(process.cwd(), "src");

/** Every .ts/.tsx file under src/, with its path relative to src/. */
function sourceFiles(dir: string = SRC, prefix = ""): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const here = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) out.push(...sourceFiles(join(dir, entry.name), here));
    else if (/\.tsx?$/.test(entry.name)) out.push({ path: here, text: readFileSync(join(dir, entry.name), "utf8") });
  }
  return out;
}

describe("one sender, and the caps are on it", () => {
  it("lets only sendMail reach the transport", () => {
    const reaching = sourceFiles()
      .filter(({ path }) => !path.endsWith(".test.ts"))
      .filter(({ text }) => /\bfrom\s+["'][^"']*resendTransport["']/.test(text))
      .map(({ path }) => path);
    // Its own test imports it to test it, which is the one honest reason to.
    expect(
      reaching,
      "a module other than lib/mail/sendMail.ts imports the transport, which is a way out with no caps on it",
    ).toEqual(["lib/mail/sendMail.ts"]);
  });

  it("lets nothing but the constant name the provider", () => {
    const naming = sourceFiles()
      .filter(({ path }) => !path.endsWith(".test.ts"))
      .filter(({ text }) => text.includes("api.resend.com"))
      .map(({ path }) => path);
    // One file writes the address down and one file posts to it, through
    // RESEND_EMAILS_URL. Anything else spelling it out is a second road.
    expect(naming.sort(), "the provider's address is named outside mail.constants.ts").toEqual([
      "lib/mail/mail.constants.ts",
    ]);
  });

  /**
   * Callers that may ask the sender themselves, each because the email is one
   * PERSON'S OWN ACTION and the route is where that action arrives. A caller
   * added here has to be that; anything that sends because the SITE decided to
   * — a notice, a digest, a reminder, anything on a timer — goes through a
   * door in lib/mail, where the volume can be reasoned about in one place.
   */
  const OWN_ACTION = ["app/api/invites/mine/route.ts"];

  it("keeps anything the site decides to send behind a door in lib/mail", () => {
    const callers = sourceFiles()
      .filter(({ path }) => !path.startsWith("lib/mail/") && !path.endsWith(".test.ts"))
      .filter(({ text }) => /\bsendMail\s*\(/.test(text))
      .map(({ path }) => path);
    expect(callers.sort(), "a caller outside lib/mail sends without being named as a person's own action").toEqual(
      OWN_ACTION,
    );
  });

  it("has no second sender left where the old placeholder stood", () => {
    const notify = sourceFiles().filter(({ path }) => path.startsWith("lib/notify/"));
    expect(notify.length, "lib/notify is empty; this gate is now about nothing").toBeGreaterThan(0);
    for (const { path, text } of notify) {
      expect(text, `${path} names a mail provider of its own`).not.toMatch(/resend|EMAIL_PROVIDER|fetch\(/i);
    }
  });

  it("keeps notices switched off until somebody decides otherwise", () => {
    /*
     * Not a style rule. A your-turn notice fires on every move somebody else
     * makes, and the site allows itself fifty emails a day; turning this on
     * without a digest or a per-member choice spends the day before lunch and
     * refuses the invitations people clicked for. The digest and the choice
     * are their own tickets. If this test is failing because somebody set it
     * deliberately, one of those has to have shipped first.
     */
    expect(NOTICES.sending, "game notices were switched on; see NOTICES for what has to exist first").toBe(false);
  });
});
