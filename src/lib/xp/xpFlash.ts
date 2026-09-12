import "server-only";

import { currentEmail } from "@/lib/auth/currentSession";
import { memberRowFor } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";

import { XP_EVENT_SPECS } from "./xp.constants";
import type { XpEventType } from "./xp.types";

/**
 * XP that has been earned and not yet said out loud.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS IS A COLUMN AND NOT AN EVENT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * UmaKuma raises a DOM `CustomEvent` from the `fetch` that paid, and its host
 * in the root layout listens. That works there because the paying action is
 * always a request the client is awaiting — a review answered, a game
 * completed — so the route can return what it paid and the client can shout it.
 *
 * **Half the awards here have nobody waiting on a response.** A visit is
 * awarded during a server render. A game finishes because the OPPONENT moved,
 * or a bot moved, or a clock ran out, and the member who earned the XP is not
 * in the request at all. There is no reply to put it in. And a cookie cannot
 * carry it either: a cookie may only be set from a Server Function or a Route
 * Handler, never during a render, so the visit award has nowhere to write one —
 * and `src/proxy.ts`, which could, is the gate and is not ours to touch.
 *
 * So `awardXp` writes it onto `Member.xpFlash` inside the transaction that
 * writes the total, and this reads it back. Both halves are free:
 *
 * - **No write of its own.** It rides the `member.update` that increments `xp`.
 * - **No query of its own.** `memberRowFor` is `cache()`d per request and
 *   already runs on every server-rendered page via `currentSession()` →
 *   `touchMember()`. This reads the column off that row.
 * - **No polling.** Nothing asks on a timer. It is written once and read once,
 *   by the next page the member loads.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT IS A COURTESY, NOT THE RECORD
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The ledger is `XpEvent`. Nothing here is retried, and a missed toast is not a
 * bug worth waking anybody for. Two consequences, both deliberate:
 *
 * **It replaces rather than appends.** A member who earns twice without looking
 * at a page in between is shown the newer batch. Appending would mean reading
 * the column back inside the transaction to merge it, and the merge would
 * itself race; the ledger has both either way.
 *
 * **A toast can show twice.** A route that pays may also return what it paid so
 * a toast lands at once, and the host clears the flash after showing it — so
 * whichever arrives first wins and the other finds it empty. A race between
 * them shows one toast a second time. That is allowed: closing it would buy a
 * sequence number and a comparison for no reader's benefit.
 */

/** What `Member.xpFlash` holds. Nothing else writes this shape. */
export type XpFlash = {
  /** When the newest award in it landed, so a clear can be reasoned about. */
  at: string;
  awards: { type: string; points: number }[];
  /**
   * The level this batch crossed, or the one it left the member within one game
   * of. Absent for the ordinary award, which is most of them. See `levelNote` in
   * `awardXp.ts` for why it is not on every one.
   */
  level?: { level: number; reached: boolean };
};

/**
 * One toast, exactly as `src/components/xp/XpToastHost.tsx` takes it.
 *
 * Built on the server so the browser never ships the catalogue: forty rows of
 * label, kanji, blurb and sentence is the sort of table that quietly ends up in
 * a client bundle because one component wanted one string out of it. The
 * component never fetches; it receives.
 */
export type XpToastItem = {
  /** Unique per award, so React can key them and a dismiss can find its own. */
  id: string;
  points: number;
  label: string;
  /** May be empty: not every award has a kanji worth printing. */
  kanji: string;
  sentence: string;
  /**
   * The level to mention, if any. `reached: true` is a level-up; `reached:
   * false` is the quiet "next level" line.
   */
  level?: { name: string; reached: boolean };
};

/** What the masthead hands its host: the toasts, and the stamp that clears them. */
export type XpFlashToShow = { at: string; toasts: XpToastItem[] };

/**
 * The toasts this member is owed, or null if they are owed none.
 *
 * **Null rather than an empty list**, because the two are different facts and
 * the host does different things with them: nothing to show, versus something
 * to show and a stamp to clear it by. A flash of `{ at, toasts: [] }` would be
 * a batch the host must still clear, and flattening both into `[]` would leave
 * it stuck on the row for ever.
 *
 * Null for a signed-out reader and for a member with no flash. A flash that
 * parses but yields no toasts still comes back, with an empty list: the host
 * clears whatever it was handed, so a row whose awards this deploy cannot
 * explain is cleared on the next page rather than sitting there for ever being
 * re-parsed. `awardXp` never writes an empty batch, so this is a self-heal and
 * not a path anything takes.
 *
 * **Never throws**: this is called from the masthead, which is on every page,
 * and a malformed courtesy must not be able to take the site down.
 */
export async function xpFlashFor(): Promise<XpFlashToShow | null> {
  const email = await currentEmail();
  if (email === null) return null;
  const row = await memberRowFor(email);
  const flash = row?.xpFlash as Partial<XpFlash> | null | undefined;
  if (!flash || typeof flash.at !== "string") return null;
  return { at: flash.at, toasts: toToasts(flash) };
}

/**
 * A stored flash as toasts, dropping anything it cannot explain.
 *
 * Pure and exported so the parsing is testable without a database, and so the
 * decision about a bad row is visible: an award naming a type this deploy has
 * never heard of is **dropped**, not shown as a blank. A toast that says `+25`
 * beside nothing is worse than no toast, and the ledger still has the row —
 * which is the whole reason the flash is allowed to be lossy.
 */
export function toToasts(value: unknown): XpToastItem[] {
  const flash = value as Partial<XpFlash> | null | undefined;
  if (!flash || !Array.isArray(flash.awards)) return [];
  const level = levelOn(flash);

  return flash.awards.flatMap((award, index) => {
    const entry = award as Partial<{ type: string; points: number }> | null;
    if (!entry || typeof entry.type !== "string") return [];
    if (typeof entry.points !== "number" || !Number.isFinite(entry.points) || entry.points <= 0) return [];
    const spec = XP_EVENT_SPECS[entry.type as XpEventType];
    if (spec === undefined) return [];
    return [{
      /* The stamp plus the position in the batch. Unique, stable across a
         re-render of the same flash — so the host's dismiss keeps working — and
         not a random value, which would differ between the server's markup and
         the browser's and be reported as a hydration mismatch. */
      id: `${flash.at ?? "xp"}-${index}`,
      points: entry.points,
      label: spec.label,
      kanji: spec.kanji,
      sentence: spec.sentence,
      /* On the LAST award of the batch only. A level is crossed once however
         many awards carried you over it, and putting it on all three would say
         "you reached Pixel" three times in one stack of toasts. */
      ...(level !== null && index === flash.awards!.length - 1 ? { level } : {}),
    }];
  });
}

/**
 * The level line a batch carries, named, or null.
 *
 * **The name is the placeholder until the hundred names land.** `LEVEL_NAMES` in
 * `levelNames.constants.ts` is somebody else's file and XP-10 owns the lookup;
 * until then a level reads as `Level 42`, which is honest and legible where a
 * crash on a page is neither, and which is exactly what UmaKuma's `xpRank` does
 * for an unnamed rank. **XP-10 replaces the one line below with
 * `xpLevelName(level)` and nothing else here changes.**
 */
function levelOn(flash: Partial<XpFlash>): { name: string; reached: boolean } | null {
  const level = flash.level;
  if (!level || typeof level.level !== "number" || typeof level.reached !== "boolean") return null;
  if (!Number.isInteger(level.level) || level.level < 1) return null;
  return { name: `Level ${level.level}`, reached: level.reached };
}

/**
 * Forget a member's flash, having shown it.
 *
 * Conditional on the stamp the host was handed, so a clear cannot wipe a batch
 * that landed while the page was open. `updateMany` rather than `update`
 * because the condition may match nothing, and that is a normal outcome rather
 * than an error — the member earned something in between and will be told about
 * it on their next page.
 *
 * Not a page's job and not exported to one: the Server Function in
 * `xpFlash.actions.ts` is the only caller.
 */
export async function clearXpFlashFor(memberId: string, at: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "Member" SET "xpFlash" = NULL
      WHERE "id" = ${memberId} AND "xpFlash"->>'at' = ${at}
    `;
  } catch (problem) {
    /* A courtesy that could not be forgotten shows once more. Not worth
       failing anything for. */
    console.error("Could not clear an XP flash", memberId, problem);
  }
}
