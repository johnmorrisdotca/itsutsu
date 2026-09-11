import { afterEach, describe, expect, it } from "vitest";

import { PHRASE_LENGTH } from "./phrase";
import {
  completedPhrase,
  drop,
  filledSlots,
  freshTicket,
  keep,
  readTicket,
  reroll,
  sealTicket,
} from "./pickTicket";

const SECRET = "a-secret-long-enough-to-be-accepted";
const ME = "m3mb3rjdxxxxxxxx";

afterEach(() => {
  delete process.env.AUTH_SECRET;
});

describe("freshTicket", () => {
  it("opens with four empty slots and four words offered", () => {
    process.env.AUTH_SECRET = SECRET;
    const state = freshTicket(ME);
    expect(state.slots).toEqual([null, null, null, null]);
    expect(state.slots).toHaveLength(PHRASE_LENGTH);
    expect(state.offered).toHaveLength(4);
    expect(state.member).toBe(ME);
  });
});

describe("keep", () => {
  it("fills the first empty slot and offers four more", () => {
    const first = freshTicket(ME);
    const wanted = first.offered[1];
    const next = keep(first, 1);
    expect(next.slots[0]).toBe(wanted);
    expect(next.slots.slice(1)).toEqual([null, null, null]);
    expect(next.offered).toHaveLength(4);
  });

  it("never offers a word already kept", () => {
    let state = freshTicket(ME);
    for (let round = 0; round < PHRASE_LENGTH; round += 1) {
      for (const word of state.offered) expect(filledSlots(state)).not.toContain(word);
      if (round < PHRASE_LENGTH - 1) state = keep(state, 0);
    }
  });

  it("offers nothing once four are kept — there is no fifth round", () => {
    let state = freshTicket(ME);
    for (let round = 0; round < PHRASE_LENGTH; round += 1) state = keep(state, 0);
    expect(filledSlots(state)).toHaveLength(PHRASE_LENGTH);
    expect(state.offered).toEqual([]);
  });

  it("ignores a slot index that is not on offer rather than inventing a word", () => {
    const state = freshTicket(ME);
    expect(keep(state, 9).slots).toEqual(state.slots);
    expect(keep(state, -1).slots).toEqual(state.slots);
  });
});

describe("reroll", () => {
  it("keeps the slots and offers four different words", () => {
    const state = freshTicket(ME);
    const again = reroll(state);
    expect(again.slots).toEqual(state.slots);
    expect(again.offered).toHaveLength(4);
  });

  it("still withholds the words already kept, however many times it is asked", () => {
    let state = keep(freshTicket(ME), 0);
    const kept = filledSlots(state);
    for (let look = 0; look < 30; look += 1) {
      state = reroll(state);
      for (const word of state.offered) expect(kept).not.toContain(word);
    }
    // Rerolling never changes what has been kept, only what is on offer.
    expect(filledSlots(state)).toEqual(kept);
  });
});

describe("drop", () => {
  it("takes one word out and leaves the others where they were", () => {
    let state = freshTicket(ME);
    for (let round = 0; round < PHRASE_LENGTH; round += 1) state = keep(state, 0);
    const before = [...state.slots];
    const after = drop(state, 1);
    expect(after.slots[0]).toBe(before[0]);
    expect(after.slots[1]).toBeNull();
    expect(after.slots[2]).toBe(before[2]);
    expect(after.slots[3]).toBe(before[3]);
  });

  it("offers candidates again once a slot is empty, and not the ones still held", () => {
    let state = freshTicket(ME);
    for (let round = 0; round < PHRASE_LENGTH; round += 1) state = keep(state, 0);
    const after = drop(state, 1);
    expect(after.offered).toHaveLength(4);
    for (const word of after.offered) expect(filledSlots(after)).not.toContain(word);
  });

  it("fills the slot that was emptied, not the end of the row", () => {
    let state = freshTicket(ME);
    for (let round = 0; round < PHRASE_LENGTH; round += 1) state = keep(state, 0);
    const emptied = drop(state, 2);
    const refilled = keep(emptied, 0);
    expect(refilled.slots[2]).toBe(emptied.offered[0]);
    expect(refilled.slots[3]).toBe(state.slots[3]);
  });

  it("ignores a slot that is not there", () => {
    const state = freshTicket(ME);
    expect(drop(state, 9).slots).toEqual(state.slots);
  });
});

describe("completedPhrase", () => {
  it("is the four words once every slot is filled", () => {
    let state = freshTicket(ME);
    for (let round = 0; round < PHRASE_LENGTH; round += 1) state = keep(state, 0);
    expect(completedPhrase(state)).toHaveLength(PHRASE_LENGTH);
  });

  it("is null while a slot is still empty — not a short list", () => {
    const state = keep(freshTicket(ME), 0);
    expect(completedPhrase(state)).toBeNull();
  });
});

describe("sealTicket and readTicket", () => {
  it("round-trips the picking state", async () => {
    process.env.AUTH_SECRET = SECRET;
    const state = keep(freshTicket(ME), 2);
    const sealed = await sealTicket(state);
    expect(sealed).not.toBeNull();
    const read = await readTicket(sealed ?? "", ME);
    expect(read?.slots).toEqual(state.slots);
    expect(read?.offered).toEqual(state.offered);
  });

  it("refuses a ticket belonging to somebody else", async () => {
    process.env.AUTH_SECRET = SECRET;
    const sealed = await sealTicket(freshTicket(ME));
    expect(await readTicket(sealed ?? "", "someoneelsexxxx")).toBeNull();
  });

  it("refuses a ticket whose words were altered", async () => {
    process.env.AUTH_SECRET = SECRET;
    const sealed = (await sealTicket(freshTicket(ME))) ?? "";
    const [body, signature] = sealed.split(".");
    const tampered = `${body.slice(0, -4)}AAAA.${signature}`;
    expect(await readTicket(tampered, ME)).toBeNull();
  });

  it("refuses everything when there is no secret to sign with", async () => {
    expect(await sealTicket(freshTicket(ME))).toBeNull();
    process.env.AUTH_SECRET = SECRET;
    const sealed = (await sealTicket(freshTicket(ME))) ?? "";
    delete process.env.AUTH_SECRET;
    expect(await readTicket(sealed, ME)).toBeNull();
  });

  it("refuses a missing or malformed ticket", async () => {
    process.env.AUTH_SECRET = SECRET;
    expect(await readTicket("", ME)).toBeNull();
    expect(await readTicket("nonsense", ME)).toBeNull();
  });

  it("refuses a ticket that does not hold four slots", async () => {
    process.env.AUTH_SECRET = SECRET;
    const { signPayload } = await import("@/lib/auth/signing");
    const forged = await signPayload({
      kind: "phrase-pick",
      member: ME,
      slots: ["acid", "zebra"],
      offered: [],
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    expect(await readTicket(forged ?? "", ME)).toBeNull();
  });

  it("refuses a ticket holding a word that is not on the list", async () => {
    process.env.AUTH_SECRET = SECRET;
    const { signPayload } = await import("@/lib/auth/signing");
    const forged = await signPayload({
      kind: "phrase-pick",
      member: ME,
      slots: ["acid", "zebra", "mango", "xyzzy"],
      offered: [],
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    expect(await readTicket(forged ?? "", ME)).toBeNull();
  });
});
