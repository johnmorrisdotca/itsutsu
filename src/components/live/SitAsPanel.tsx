"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_QUIET, BUTTON_STRONG, BUTTON_TAP, PANEL_CLASS } from "@/components/ui/ui.constants";
import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { PHRASE_LENGTH } from "@/lib/phrase/phrase";
import type { SeatPickMember } from "@/lib/phrase/seatPick.types";
import { padStep } from "@/lib/phrase/wordIndex";

/** Which word the pad is filling, said as a person would — it read "fourth" for all four. */
const ORDINAL = ["first", "second", "third", "fourth"] as const;

/**
 * The other seat, taken with four words instead of a link — the kitchen
 * table. John is signed in on the iPad; his daughter FINDS HER NAME and taps
 * her four words, and takes the free seat AS HERSELF, so the game counts for her.
 *
 * NOTHING IS TYPED ANYWHERE ON THIS SCREEN. It used to have one text box, for
 * the name, and John's answer to the whole question of which account a name
 * means removed it: "let them find their name. Once they find their name, the
 * four words will match up with them. And everyone doesn't have to type anything
 * when finding their name." So step one is a list of names to tap, and what a tap
 * carries is the member's id — not the name it printed, which is why two members
 * called the same thing are now two rows to choose between rather than a string
 * the server would have to guess at.
 *
 * NOT A SEARCH BOX. A list, tapped. Filtering as you type is a keyboard wearing a
 * list, and this screen exists for somebody who should not need one.
 *
 * THE WORD PAD IS UNCHANGED: each of the four slots is found by narrowing a
 * letter at a time (`padStep`) and then tapping the word itself. Tapping a
 * filled slot takes it back out and reopens that slot at the top of the pad.
 *
 * ONE STEP AT A TIME, because the whole panel at once is a wall to a child: the
 * names show until one is picked, and the words show after. Picking a name again
 * is one tap back.
 *
 * THE WORDS NEVER OUTLIVE THIS SCREEN: they live only in this component's
 * state, are never put in the address, and `reset` below clears them the
 * moment the seat is taken or the panel is closed.
 */
export function SitAsPanel({
  gameId,
  freeSeats,
  members,
}: {
  gameId: string;
  freeSeats: readonly Stone[];
  /** Everyone who could claim a seat here, from `seatPickList`. */
  members: readonly SeatPickMember[];
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  /** The member tapped, by id. Null until somebody has found themselves. */
  const [who, setWho] = useState<SeatPickMember | null>(null);
  const [seat, setSeat] = useState<Stone | undefined>(freeSeats.length === 1 ? freeSeats[0] : undefined);
  const [slots, setSlots] = useState<(string | null)[]>(Array.from({ length: PHRASE_LENGTH }, () => null));
  const [prefix, setPrefix] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justBound, setJustBound] = useState(false);

  const activeSlot = slots.indexOf(null);

  function reset(): void {
    setOpen(false);
    setWho(null);
    setSeat(freeSeats.length === 1 ? freeSeats[0] : undefined);
    setSlots(Array.from({ length: PHRASE_LENGTH }, () => null));
    setPrefix("");
    setError(null);
  }

  function fillSlot(index: number, word: string): void {
    setSlots((current) => current.map((held, at) => (at === index ? word : held)));
    setPrefix("");
  }

  function dropSlot(index: number): void {
    setSlots((current) => current.map((held, at) => (at === index ? null : held)));
    setPrefix("");
  }

  /** Picking a name again: the words already tapped belonged to the last one. */
  function pick(member: SeatPickMember | null): void {
    setWho(member);
    setSlots(Array.from({ length: PHRASE_LENGTH }, () => null));
    setPrefix("");
    setError(null);
  }

  async function submit(): Promise<void> {
    if (activeSlot !== -1 || who === null || (freeSeats.length > 1 && seat === undefined)) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/games/${gameId}/sit-as`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      /*
       * THE ID, NOT THE NAME. The list printed "Hanako M." and may print it for
       * two different people; what goes over the wire is the row it meant.
       */
      body: JSON.stringify({
        memberId: who.id,
        words: slots.filter((word): word is string => word !== null),
        seat,
      }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Could not take that seat.");
      return;
    }
    /*
     * Words that were NEW to this account are worth saying out loud once. The
     * person has just acquired a way back into their own account from any
     * device, and nothing else on this screen would tell them — they would
     * find out by trying it somewhere else, or not at all.
     */
    const payload = (await response.json().catch(() => null)) as { bound?: boolean } | null;
    reset();
    if (payload?.bound === true) setJustBound(true);
    router.refresh();
  }

  const boundNotice =
    justBound ? (
      <p className="text-sm" data-testid="phrase-just-bound">
        Those four words are yours now. They will let you play as yourself on any device — nobody has to sign out.
      </p>
    ) : null;

  if (!open) {
    return (
      <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="sit-as-closed" {...readyMark(hydrated)}>
        {boundNotice}
        <p className="text-sm text-muted">
          Not you signed in? Sit in here as yourself with four words — and if you have none yet, the four you pick
          become yours.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${BUTTON_TAP} ${BUTTON_QUIET} self-start`}
          data-testid="sit-as-open"
        >
          Sit in with your four words
        </button>
      </div>
    );
  }

  const step = activeSlot === -1 ? null : padStep(prefix);

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="sit-as-panel" {...readyMark(hydrated)}>
      {boundNotice}
      <p className="text-xs text-muted">
        Find your name, then tap your four words — nothing to type. The seat becomes yours on this device, and if your
        account has no words yet these become them.
      </p>

      {who === null ? (
        /*
         * STEP ONE, AND ON ITS OWN. Everybody who could sit down, in order, as
         * buttons big enough for a fingertip. A wrong tap costs one attempt —
         * John: "If we pick the wrong user, obviously it's not going to work" —
         * so there is nothing printed beside a name to tell two of them apart.
         */
        <ul className="flex flex-wrap gap-2" data-testid="sit-as-members">
          {members.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => pick(member)}
                className={`${BUTTON_TAP} ${BUTTON_QUIET}`}
                data-testid={`sit-as-member-${member.id}`}
              >
                {member.shown}
              </button>
            </li>
          ))}
          {/*
            An empty list is data, not a reason to hide the panel: it says what
            this screen is for, and that nobody here can use it yet.
          */}
          {members.length === 0 ? (
            <li className="text-sm text-muted" data-testid="sit-as-nobody">
              Nobody here has an account that can take a seat this way yet.
            </li>
          ) : null}
        </ul>
      ) : (
        /*
         * Chosen, not committed — so it wears the same moss as a filled word
         * slot rather than the dark of a button that does something. "Sit down"
         * is the only strong thing on the screen, which is what makes it
         * findable.
         */
        <button
          type="button"
          onClick={() => pick(null)}
          className={`${BUTTON_TAP} self-start border-moss bg-moss-soft text-ink`}
          data-testid="sit-as-who"
        >
          {who.shown} — tap to pick somebody else
        </button>
      )}

      {who !== null && freeSeats.length > 1 ? (
        <div className="flex gap-2" data-testid="sit-as-seat-choice">
          {freeSeats.map((stone) => (
            <button
              key={stone}
              type="button"
              onClick={() => setSeat(stone)}
              data-testid={`sit-as-seat-${stone}`}
              className={`${BUTTON_TAP} ${seat === stone ? BUTTON_STRONG : BUTTON_QUIET}`}
            >
              {STONE_DISPLAY[stone].label} <span className="font-mincho">{STONE_DISPLAY[stone].kanji}</span>
            </button>
          ))}
        </div>
      ) : null}

      {who === null ? null : (
        <ol className="flex flex-wrap gap-2" data-testid="sit-as-slots">
          {slots.map((word, index) => (
            <li key={index}>
              <button
                type="button"
                disabled={word === null || busy}
                onClick={() => dropSlot(index)}
                data-testid={`sit-as-slot-${index}`}
                className={`min-h-12 min-w-24 rounded-xl border px-4 py-3 text-base ${
                  word === null ? "border-dashed border-rule text-muted" : "border-moss bg-moss-soft text-ink"
                }`}
                title={word === null ? "Empty" : "Tap to take this word back out"}
              >
                {word ?? "—"}
              </button>
            </li>
          ))}
        </ol>
      )}

      {who === null ? null : step !== null ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted" data-testid="sit-as-prefix">
            {prefix === "" ? `Tap a letter to start the ${ORDINAL[activeSlot] ?? "next"} word.` : `Starting with "${prefix}"`}
          </p>
          {step.kind === "letters" ? (
            <div className="flex flex-wrap gap-2" data-testid="sit-as-letters">
              {step.letters.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setPrefix(prefix + letter)}
                  className={`${BUTTON_TAP} ${BUTTON_QUIET} min-w-12 uppercase`}
                  data-testid={`sit-as-letter-${letter}`}
                >
                  {letter}
                </button>
              ))}
            </div>
          ) : step.kind === "words" ? (
            <div className="flex flex-wrap gap-2" data-testid="sit-as-words">
              {step.words.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => fillSlot(activeSlot, word)}
                  className={`${BUTTON_TAP} ${BUTTON_QUIET}`}
                  data-testid={`sit-as-word-${word}`}
                >
                  {word}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-shu">Nothing starts that way. Start the word over.</p>
          )}
          {prefix !== "" ? (
            <button
              type="button"
              onClick={() => setPrefix(prefix.slice(0, -1))}
              className={`${BUTTON_TAP} ${BUTTON_QUIET} self-start`}
              data-testid="sit-as-back"
            >
              Back a letter
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          disabled={busy || who === null || (freeSeats.length > 1 && seat === undefined)}
          onClick={() => void submit()}
          className={`${BUTTON_TAP} ${BUTTON_STRONG} self-start`}
          data-testid="sit-as-submit"
        >
          Sit down
        </button>
      )}

      <button
        type="button"
        onClick={reset}
        className="min-h-12 self-start px-1 py-2 text-sm text-muted underline underline-offset-4"
        data-testid="sit-as-cancel"
      >
        Cancel
      </button>

      {error !== null ? (
        <p className="text-xs text-shu" data-testid="sit-as-error">
          {error}
        </p>
      ) : null}
    </section>
  );
}
