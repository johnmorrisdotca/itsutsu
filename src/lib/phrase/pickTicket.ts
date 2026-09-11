/**
 * The picking session: four slots, four words on offer, and nothing written
 * down.
 *
 * THE PICKER IS THE SECURITY DESIGN, so it is worth saying what it is before
 * the mechanics. Four words are offered and the player keeps one; four more,
 * keep another; four rounds and that is the phrase. It READS as choosing and is
 * as strong as random, because an attacker never learns WHICH four words were
 * offered — the space is still the whole list, however deliberately the player
 * felt they were choosing.
 *
 * WHICH IS WHY NOBODY MAY TYPE THEIR OWN WORDS. If the browser could post four
 * words of its choosing, the strength would be whatever a person happened to
 * pick, and people pick badly. So the state of a picking session travels in a
 * SIGNED ticket: the server can prove it offered every word in it, and a
 * request naming a word the server never offered verifies as nothing.
 *
 * AND NOTHING IS PERSISTED — not the candidates, not the picks, not how many
 * times somebody looked. The ticket is signed, not stored: it exists in a
 * response, in the next request, and in the browser's memory. There is no
 * "words offered" column and no log line, so there is nothing for anybody to
 * read back later. Rerolling is therefore free, and unlimited on purpose: an
 * attacker cannot see a reroll, so a reroll cannot cost anything.
 *
 * The slots are FOUR SLOTS and stay four. A word already kept can be tapped to
 * take it back out, and the others do not move — pulling out the second word
 * must not cost the third and the fourth.
 */
import { signPayload, verifyPayload, type Signed } from "@/lib/auth/signing";

import { PHRASE_LENGTH, drawCandidates, isListWord } from "./phrase";

/** How long a half-finished pick stays good. Long enough to be interrupted. */
const TICKET_MINUTES = 30;

const KIND = "phrase-pick";

/** A slot holds a kept word, or nothing yet. */
export type Slots = (string | null)[];

export type PickState = {
  /** The member this pick belongs to, by opaque id. */
  member: string;
  /** Four slots, in the order they will be shown. */
  slots: Slots;
  /** The words on offer now. Empty once every slot is full. */
  offered: string[];
};

type PickTicket = Signed & {
  kind: typeof KIND;
  member: string;
  slots: Slots;
  offered: string[];
};

/** The words kept so far, in slot order, with the empty slots left out. */
export function filledSlots(state: PickState): string[] {
  return state.slots.filter((word): word is string => word !== null);
}

/**
 * The four words, or null while a slot is still empty.
 *
 * Null and not a short list. A three-word answer would be a perfectly valid
 * array that also means "not finished", and somewhere downstream it would be
 * hashed as though it were the phrase.
 */
export function completedPhrase(state: PickState): string[] | null {
  const kept = filledSlots(state);
  return kept.length === PHRASE_LENGTH ? kept : null;
}

/**
 * Words to offer for the current state: four of them, or none when there is no
 * empty slot to fill.
 *
 * Withholds every word already kept. That is an interface decision rather than
 * a rule about phrases — a tile that has to be tapped twice is a confusing
 * control, and the grid stays simpler without one. See `phrase.ts` on why the
 * ENTRY path must never refuse a repeat.
 */
function offerFor(slots: Slots, random?: () => number): string[] {
  if (!slots.includes(null)) return [];
  const kept = slots.filter((word): word is string => word !== null);
  return drawCandidates(kept, random);
}

export function freshTicket(member: string, random?: () => number): PickState {
  const slots: Slots = Array.from({ length: PHRASE_LENGTH }, () => null);
  return { member, slots, offered: offerFor(slots, random) };
}

/**
 * Keeps the word at this position in the offer, putting it in the first empty
 * slot, and offers four more.
 *
 * An index that is not on offer changes nothing. A request can say anything,
 * and inventing a word — or filling a slot with `undefined` — would put
 * something in the phrase that the player never saw.
 */
export function keep(state: PickState, index: number, random?: () => number): PickState {
  const word = state.offered[index];
  if (!Number.isInteger(index) || index < 0 || word === undefined) return state;

  const at = state.slots.indexOf(null);
  if (at === -1) return state;

  const slots = [...state.slots];
  slots[at] = word;
  return { member: state.member, slots, offered: offerFor(slots, random) };
}

/** Four different words for the same slot. As many times as the player likes. */
export function reroll(state: PickState, random?: () => number): PickState {
  return { member: state.member, slots: [...state.slots], offered: offerFor(state.slots, random) };
}

/**
 * Takes the word in this slot back out, leaving the others exactly where they
 * are, and offers four fresh words for the gap.
 *
 * Fresh ones rather than the candidates that slot was chosen from: those were
 * never stored, so there is nothing to restore, and four new words is what
 * somebody changing their mind expects anyway.
 */
export function drop(state: PickState, index: number, random?: () => number): PickState {
  if (!Number.isInteger(index) || index < 0 || index >= state.slots.length) return state;
  if (state.slots[index] === null) return state;

  const slots = [...state.slots];
  slots[index] = null;
  return { member: state.member, slots, offered: offerFor(slots, random) };
}

/** The signed form, to hand to the browser. Null with no AUTH_SECRET to sign with. */
export async function sealTicket(state: PickState): Promise<string | null> {
  return signPayload<PickTicket>({
    kind: KIND,
    member: state.member,
    slots: state.slots,
    offered: state.offered,
    exp: Math.floor(Date.now() / 1000) + TICKET_MINUTES * 60,
  });
}

/**
 * The state a ticket carries, or null for anything this server did not write,
 * did not write for THIS member, or cannot make sense of.
 *
 * The member check is not a formality. Without it one member's ticket would
 * drive another member's pick, which is a way to set somebody else's password —
 * and a parent setting a child's phrase is the one thing John ruled out by
 * name, because a credential an adult can set stops proving it is her.
 *
 * Every word is re-checked against the list on the way back in. The signature
 * already says we wrote it, so this is belt and braces — but a list that
 * shrinks in some future release would otherwise let an old ticket seat a word
 * that is no longer offered.
 */
export async function readTicket(token: string, member: string): Promise<PickState | null> {
  const payload = await verifyPayload<PickTicket>(token, KIND);
  if (payload === null) return null;
  if (payload.member !== member) return null;

  if (!Array.isArray(payload.slots) || payload.slots.length !== PHRASE_LENGTH) return null;
  for (const slot of payload.slots) {
    if (slot === null) continue;
    if (!isListWord(slot)) return null;
  }
  if (!Array.isArray(payload.offered)) return null;
  for (const word of payload.offered) if (!isListWord(word)) return null;

  return { member: payload.member, slots: payload.slots, offered: payload.offered };
}
