import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_ACTIONS } from "@/lib/auth/operatorLog.constants";
import { PLAYER_SESSION_DAYS } from "@/lib/auth/session";
import { CONTACT_ADDRESS, NOTICES } from "@/lib/mail/mail.constants";
import { PHRASES } from "@/lib/i18n/i18n.constants";

import { CONTACT, PRIVACY_CHANGED, privacySections, wordsAccountSentence } from "./privacy.constants";

/*
 * THE PRIVACY PAGE IS HELD TO THE CODE.
 *
 * Every sentence on /privacy is a claim about what this site keeps and who
 * sees it, and nothing else would notice when one stops being true: the page
 * renders, the sentence reads, and a reader is told something the site no
 * longer does. So this test reads the page's sentences against the things
 * they describe, and fails the build when they part.
 *
 * It checks the claims that CAN be read from source. The ones that cannot —
 * that the operator does not read messages except when one is reported, that
 * host logs are read only to find a fault — are policy, stated as policy, and
 * listed for John in docs/plans/privacy/README.md.
 *
 * What it reads, and what parts it:
 *  - every cookie constant under src/lib is described on the page;
 *  - the contact address on the page is the site's one address;
 *  - every operator action is named where the page says what the operator can do;
 *  - the sentence about move notices agrees with the mail switch;
 *  - the sign-in libraries and hosts named are the ones in package.json, and
 *    no analytics or advertising package has arrived;
 *  - the gate, robots.txt, the footer and the doorstep all carry /privacy;
 *  - the date at the top is a real date, not in the future, and moves when a
 *    sentence does (the sentence hash is not stored; the date being today or
 *    earlier is what can be checked);
 *  - every section has a heading, its kanji, an id and at least one paragraph.
 */

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const sections = privacySections(PLAYER_SESSION_DAYS);
const text = sections
  .flatMap((section) => [section.heading, ...section.paragraphs, ...(section.points ?? [])])
  .join("\n");
const section = (id: string) => {
  const found = sections.find((s) => s.id === id);
  if (found === undefined) throw new Error(`no section ${id}`);
  return [...found.paragraphs, ...(found.points ?? [])].join("\n");
};

function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = join(dir, name);
    return statSync(join(ROOT, path)).isDirectory() ? filesUnder(path) : [path];
  });
}

describe("the privacy page", () => {
  it("has a heading, its kanji, an id and at least one paragraph in every section", () => {
    const ids = sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of sections) {
      expect(s.heading.trim(), s.id).not.toBe("");
      expect(s.kanji.trim(), s.id).not.toBe("");
      expect(/^[a-z]+$/.test(s.id), `${s.id} is not a plain anchor`).toBe(true);
      expect(s.paragraphs.length, s.id).toBeGreaterThan(0);
    }
  });

  it("is dated, and the date is real and not in the future", () => {
    expect(PRIVACY_CHANGED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const changed = new Date(`${PRIVACY_CHANGED}T00:00:00Z`).getTime();
    expect(Number.isNaN(changed)).toBe(false);
    expect(changed).toBeLessThanOrEqual(Date.now());
  });

  it("gives the site's one contact address, and gives it where removal is offered", () => {
    expect(CONTACT).toBe(CONTACT_ADDRESS);
    expect(section("keeping")).toContain(CONTACT);
    expect(section("children")).toContain(CONTACT);
  });

  /*
   * A cookie the site sets that the page does not describe is the classic
   * privacy-page fault. The constants are found by shape rather than listed
   * here, so a new one fails this until the page says what it is for.
   */
  it("describes every cookie the site sets", () => {
    const cookies = section("cookies");
    const names = new Set<string>();
    for (const path of filesUnder("src/lib").filter((p) => p.endsWith(".ts") && !p.endsWith(".test.ts"))) {
      for (const match of read(path).matchAll(/\b[A-Z_]*COOKIE\s*=\s*"([^"]+)"/g)) names.add(match[1] as string);
    }
    expect([...names].sort()).toEqual(["itsutsu_session", "lang", "lang-chosen"]);
    // Signed in, language, and the just-changed marker: one clause each.
    expect(cookies).toContain("keeps you signed in");
    expect(cookies).toContain("remembers your language");
    expect(cookies).toContain("notes you just changed it");
    // And the seat cookie, which has a prefix rather than a name.
    expect(read("src/lib/history/seatCookie.ts")).toContain("export function seatCookieName");
    expect(cookies).toContain("one for each game you took a seat at");
    // And what the browser keeps in its own storage, the one piece of which that is sent anywhere included.
    expect(cookies).toContain("in its own storage");
    expect(cookies).toContain("a random id");
  });

  /*
   * One phrase per action, typed over the whole enum, so a new operator act
   * fails the typecheck AND this test until the page says what it is.
   */
  it("names every action the operator can take on an account", () => {
    const who = section("who");
    const said: Record<(typeof OPERATOR_ACTIONS)[keyof typeof OPERATOR_ACTIONS], string> = {
      shut: "shut an account",
      restore: "restore it",
      rename: "rename it",
      wordsSet: "set new words",
      wordsPickOpened: "open the picker",
      recordClaimed: "attach a record",
      ageBand: "set a member's age band",
      remove: "remove an account",
    };
    for (const action of Object.values(OPERATOR_ACTIONS)) {
      expect(who, `the operator can "${action}" and the page does not say so`).toContain(said[action]);
    }
    // And there is no impersonation to describe: the page says so, and it is true.
    // Looked for where such a door would be built: the auth library and the admin routes.
    const impersonation = [...filesUnder("src/lib/auth"), ...filesUnder("src/app/api/admin"), ...filesUnder("src/app/api/session")]
      .filter((p) => !p.endsWith(".test.ts"))
      .filter((p) => /impersonat|signInAs|actAs\(/.test(read(p)));
    expect(impersonation).toEqual([]);
    expect(who).toContain("Nobody at the site can sign in as you");
  });

  it("agrees with the mail switch about move notices", () => {
    const email = section("email");
    if (NOTICES.sending) {
      expect(email).not.toContain("switched off for now");
    } else {
      expect(email).toContain("switched off for now");
    }
  });

  it("fills the words-only account's lifetime from the cookie, never by hand", () => {
    expect(section("what")).toContain(wordsAccountSentence(PLAYER_SESSION_DAYS));
    const source = read("src/app/privacy/privacy.constants.ts");
    expect(source).not.toMatch(/for \d+ days/);
    expect(read("src/app/privacy/page.tsx")).toContain("privacySections(PLAYER_SESSION_DAYS)");
  });

  it("names the services that really handle the data, and no advertising or analytics has arrived", () => {
    const pkg = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };
    const deps = Object.keys(pkg.dependencies);
    const services = section("services");
    expect(deps).toContain("next-auth");
    expect(services).toContain("Google");
    expect(services).toContain("Vercel");
    expect(services).toContain("Neon");
    // Resend is reached over HTTP, not through a package; its transport is the proof.
    expect(read("src/lib/mail/resendTransport.ts")).toContain("resend");
    expect(services).toContain("Resend");
    expect(read("src/lib/reports/reports.actions.ts")).toContain("sumilabu");
    expect(services).toContain("Sumilabu");
    const trackers = /analytics|gtag|segment|posthog|sentry|mixpanel|hotjar|amplitude|plausible|fathom|speed-insights/i;
    expect(deps.filter((dep) => trackers.test(dep)), "a tracking package arrived; the page says there are none").toEqual([]);
    // The layout's one script is inline and ours; nothing is loaded from another host.
    expect(read("src/app/layout.tsx")).not.toMatch(/<[Ss]cript\b[^>]*\bsrc=/);
  });

  it("is open to strangers, invited to crawlers, and linked from the footer and the doorstep", () => {
    const proxy = read("src/proxy.ts");
    const openExactly = proxy.match(/const OPEN_EXACTLY = \[([\s\S]*?)\n\];/)?.[1] ?? "";
    expect(openExactly).toContain('"/privacy"');
    const robots = read("src/app/robots.ts");
    expect(robots.match(/allow: \[([^\]]*)\]/)?.[1] ?? "").toContain('"/privacy"');
    expect(read("src/components/layout/SiteFooter.tsx")).toContain('href: "/privacy", phrase: "nav.privacy"');
    expect(PHRASES["nav.privacy"]).toBe("Privacy");
    expect(read("src/app/join/page.tsx")).toContain('href="/privacy"');
  });

  it("says what an invite request keeps, which is nothing, in the mail's own words", () => {
    expect(read("src/lib/mail/inviteRequest.ts")).toContain("Nothing about this request was saved by the site.");
    expect(section("not")).toContain("the site saves none of it");
  });

  it("says a report keeps the page without its query, as the draft really strips it", () => {
    expect(read("src/lib/reports/reportDraft.ts")).toContain("split(/[?#]/)[0]");
    expect(section("reports")).toContain("without anything after the question mark");
    // A screenshot travels with a report since 0.279.0, and only when the reader adds one.
    expect(read("src/components/reports/ReportProblem.tsx")).toContain("screenshot");
    expect(section("reports")).toContain("a screenshot if you add one");
  });

  it("does not describe an age question the profile does not ask yet", () => {
    const schema = read("prisma/schema.prisma");
    if (/\bageBand\b/.test(schema)) {
      expect(section("children"), "the schema has an age band; PRIV-02 rewrites the Children section").not.toContain(
        "does not ask your age yet",
      );
      // And says the three facts the consent row keeps, which the model beside it holds.
      expect(schema).toMatch(/model ParentalConsent \{[\s\S]*\bname\b[\s\S]*\brelationship\b[\s\S]*\bcreatedAt\b/);
      expect(section("children")).toContain("parent's or guardian's consent");
      expect(section("what")).toContain("whether they are the parent or a guardian, and when");
    } else {
      expect(section("children")).toContain("does not ask your age yet");
    }
    expect(text).not.toMatch(/\bwill\b/);
  });
});

/*
 * THE PROMISE TO REMOVE IS A DOOR NOW, NOT A CHORE (PRIV-04). While nothing in
 * the code removed a member the page said "we do it by hand"; with
 * `removeMember` in the tree it must name the control instead, and must not
 * go on saying removal waits on somebody being awake.
 */
describe("removal is described as the control it is", () => {
  it("names Remove this account and What Itsutsu holds about you, and not removal by hand", () => {
    expect(existsSync("src/lib/auth/removeMember.ts")).toBe(true);
    const keeping = section("keeping");
    expect(keeping).toContain("Remove this account");
    expect(keeping).toContain("What Itsutsu holds about you");
    expect(keeping).not.toContain("by hand");
    // The control's heading is the words the page points at, and the control draws that heading.
    expect(read("src/components/mine/mine.constants.ts")).toContain('heading: "Remove this account"');
    expect(read("src/components/mine/RemoveAccount.tsx")).toContain("REMOVE_COPY.heading");
    expect(read("src/components/mine/WhatWeHold.tsx")).toContain("What Itsutsu holds about you");
  });
});

/*
 * WHAT CHANGES FOR A CHILD IS WRITTEN WHERE A PARENT READS IT (PRIV-03). John:
 * "as long as you document the restrictions". Each rule in childRules.ts has
 * its sentence in the Children section, and each sentence a rule behind it.
 */
describe("the Children section says what changes for a member under 13", () => {
  const children = () => {
    const found = privacySections(PLAYER_SESSION_DAYS).find((one) => one.id === "children")!;
    return [...found.paragraphs, ...(found.points ?? [])].join("\n");
  };
  it("names each rule, and each rule is in the code", () => {
    const rules = read("src/lib/social/childRules.ts");
    const said = children();
    expect(said).toContain("keeps no city, country or line about themselves");
    expect(rules).toContain('CHILD_WITHHELD_FIELDS = ["city", "country", "bio"]');
    expect(said).toContain("Only the people on the child's own buddy list");
    expect(read("src/lib/messages/messages.ts")).toContain("mayReachMember(toId, fromId)");
    expect(read("src/lib/history/liveAgainst.ts")).toContain("CHILD_BUDDIES_ONLY");
    expect(said).toContain("never listed as here now");
    expect(read("src/lib/social/presence.ts")).toContain("AGE_BANDS.under13");
    expect(said).toContain("never sends an email to a member under 13");
    expect(read("src/lib/mail/sendMail.ts")).toContain('notSent("to-a-child")');
  });
});
