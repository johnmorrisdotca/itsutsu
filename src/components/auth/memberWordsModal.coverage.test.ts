import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * The operator's Words modal, guarded the way the member's own Words tab is
 * guarded: by reading the source, because vitest here is node-only and the
 * browser suite is one somebody has to be holding the browser to run.
 *
 * IT IS THE SAME GATE AS `phraseSetup.coverage.test.ts` AND IT HAS TO BE. That
 * one stops a text box appearing on the member's screen; a second screen that
 * sets the same credential with a box on it would be the same hole, reached by
 * a different door, and the gate over the first screen cannot see the second.
 * Every property below is a property of setting a phrase, not of that tab.
 *
 * The operator-only half is here too — the replace question, no Remove, the
 * words handed over rather than kept — because those are the three things that
 * make this screen different, and each of them is the kind of thing a later
 * edit removes as redundant.
 */
const sources = {
  modal: readFileSync("src/components/auth/MemberWordsModal.tsx", "utf8"),
  list: readFileSync("src/components/auth/AdminMembers.tsx", "utf8"),
  copy: readFileSync("src/components/auth/admin.constants.ts", "utf8"),
};

describe("nothing in the operator's modal is typed", () => {
  /*
   * THE PICKER IS THE SECURITY DESIGN. Four words offered at random are as
   * strong as random however deliberately anybody felt they were choosing, and
   * a text box — added for an operator's convenience, which is exactly how it
   * would arrive — would make the phrase as strong as an adult's taste in
   * words. The one input on this screen is the box that says the words have
   * been written down, which types nothing.
   */
  it("has no text box of any kind", () => {
    expect(sources.modal, "a text box reached the screen that sets a credential").not.toMatch(
      /<input(?![^>]*type="checkbox")/,
    );
    expect(sources.modal).not.toMatch(/<textarea/);
    expect(sources.modal, "INPUT_CLASS is the shared look of a text box").not.toContain("INPUT_CLASS");
    expect(sources.modal).not.toMatch(/contentEditable/i);
  });

  it("has exactly one change handler, on that checkbox", () => {
    expect(sources.modal.match(/onChange/g)).toHaveLength(1);
  });

  /*
   * THE WORDS COME OUT OF THE SIGNED TICKET. The boxes the operator arranged
   * them into are the browser's business alone — a phrase is a set, sorted
   * before it is hashed — and a save that sent the arrangement would be a
   * browser naming words, which is the one thing the ticket exists to make
   * impossible.
   */
  it("saves from the ticket alone, never from what the browser arranged", () => {
    expect(sources.modal).toContain("{ ticket, acknowledged: true }");
    expect(sources.modal).not.toMatch(/JSON\.stringify\([^)]*arranged/);
  });

  it("draws the member's own tiles and candidates rather than a second picker", () => {
    // Imported, not copied. Two pickers that drift apart are two things to
    // learn, and one of them will be the one his daughter used last.
    expect(sources.modal).toContain('from "@/components/mine/WordTiles"');
    expect(sources.modal).toContain('from "@/components/mine/WordCandidates"');
    expect(sources.modal).toContain('from "@/components/mine/phraseArrangement"');
  });

  it("uses the tap-sized button class and never the mouse-sized one", () => {
    expect(sources.modal).toContain("BUTTON_TAP");
    expect(sources.modal, "the operator's picker is the same picker, at the same size").not.toContain("BUTTON_BASE");
  });
});

describe("replacing somebody's words is asked about first", () => {
  it("asks before it draws, and the question carries the date they were set", () => {
    expect(sources.modal).toContain('data-testid="member-words-replace"');
    expect(sources.modal).toContain("replaceQuestion");
    expect(sources.copy).toMatch(/replaceQuestion: \(date: string\)/);
  });

  it("offers both answers, so leaving them alone is as easy as replacing them", () => {
    expect(sources.modal).toContain('data-testid="member-words-replace-confirm"');
    expect(sources.modal).toContain('data-testid="member-words-replace-cancel"');
  });

  /*
   * The server is the authority, not the list: a member who set their own words
   * in the minutes since the page was drawn must still be asked about. The
   * route answers 409 with `confirmNeeded`, and the modal has to act on the
   * FLAG rather than on the status, because an expired ticket is also a 409.
   */
  it("acts on the route's refusal as well as on what the list knew", () => {
    expect(sources.modal).toContain("confirmNeeded");
  });

  it("only claims to be replacing when it was told to", () => {
    // `replacing: true` or the field left off. Sending `false` would be
    // answering a question nobody asked, and the route refuses it.
    expect(sources.modal).toContain("replacing: true");
    expect(sources.modal).not.toContain("replacing: false");
  });
});

describe("the words leave with the operator or they are lost", () => {
  it("says they have to be handed over, and that nobody can be shown them again", () => {
    expect(sources.copy).toContain("handOver");
    expect(sources.copy).toMatch(/cannot be shown again/);
  });

  it("will not save until the operator says they wrote them down", () => {
    expect(sources.modal).toContain('data-testid="member-words-acknowledge"');
    expect(sources.modal).toMatch(/disabled=\{!acknowledged/);
  });

  /*
   * NO REMOVE. Taking somebody's last way into their own account away is not an
   * operator's convenience — `credentials.ts` refuses it even for the member
   * themselves — so this screen does not offer it at all.
   */
  it("offers no way to take a member's words off", () => {
    expect(sources.modal).not.toMatch(/method: "DELETE"/);
  });
});

describe("the list pays nothing for the link", () => {
  /*
   * THE LINK IS A LINK. Everything the row shows about words — that there are
   * some, and when they were set — came down with the list it was already
   * fetching; the modal is what asks the server anything, and only once it is
   * open. A status fetched per row would be two hundred requests on the one
   * page that shows two hundred members.
   */
  it("asks the server for nothing per row", () => {
    const rows = sources.list.slice(sources.list.indexOf("members.map"));
    expect(rows, "the members list fetches something per row").not.toMatch(/fetch\(/);
    expect(rows).not.toMatch(/useSWR/);
  });

  it("mounts the modal only while it is open", () => {
    expect(sources.list).toMatch(/words === null \? null : \(/);
  });

  it("offers it only where there is an account to get into", () => {
    // `mayHavePhrase` is `canBeClaimed`, answered on the server: a kept record,
    // a seeded row and a computer player have nobody to hand four words to.
    expect(sources.list).toContain("member.mayHavePhrase");
  });
});

describe("the members list is people", () => {
  it("leaves the computer players to their own tab", () => {
    expect(sources.list).toContain("MEMBER_KINDS.robot");
  });

  it("counts the people rather than every row, in the heading over them", () => {
    // `total` counts every Member row, robots included. A heading saying 207
    // over a list of 200 people is the fault the total was added to fix, one
    // category along.
    expect(sources.list).toContain("data?.people");
  });
});
