"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, INPUT_CLASS, PANEL_CLASS } from "@/components/ui/ui.constants";
import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { PHRASE_LENGTH } from "@/lib/phrase/phrase";
import { padStep } from "@/lib/phrase/wordIndex";

/**
 * The other seat, taken with four words instead of a link — the kitchen
 * table. John is signed in on the iPad; his daughter taps her name and her
 * four words and takes the free seat AS HERSELF, so the game counts for her.
 *
 * ENTRY IS BY TAPPING, NEVER TYPING. Each of the four slots is found by
 * narrowing a letter at a time (`padStep`, the same pad the pick screen's
 * sibling uses to browse the list) and then tapping the word itself — never a
 * text box a phrase could be typed into. Tapping a filled slot takes it back
 * out and reopens that slot at the top of the pad, fresh.
 *
 * THE WORDS NEVER OUTLIVE THIS SCREEN: they live only in this component's
 * state, are never put in the address, and `reset` below clears them the
 * moment the seat is taken or the panel is closed.
 */
export function SitAsPanel({ gameId, freeSeats }: { gameId: string; freeSeats: readonly Stone[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [seat, setSeat] = useState<Stone | undefined>(freeSeats.length === 1 ? freeSeats[0] : undefined);
  const [slots, setSlots] = useState<(string | null)[]>(Array.from({ length: PHRASE_LENGTH }, () => null));
  const [prefix, setPrefix] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSlot = slots.indexOf(null);

  function reset(): void {
    setOpen(false);
    setName("");
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

  async function submit(): Promise<void> {
    if (activeSlot !== -1 || name.trim() === "" || (freeSeats.length > 1 && seat === undefined)) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/games/${gameId}/sit-as`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, words: slots.filter((word): word is string => word !== null), seat }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Could not take that seat.");
      return;
    }
    reset();
    router.refresh();
  }

  if (!open) {
    return (
      <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="sit-as-closed" {...readyMark(hydrated)}>
        <p className="text-sm text-muted">Not you signed in? Somebody with four words can sit in here as themselves.</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${BUTTON_BASE} ${BUTTON_QUIET} self-start`}
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
      <p className="text-xs text-muted">
        Your name, then your four words — tapped, never typed. The seat becomes yours on this device.
      </p>

      <label className="flex flex-col gap-1 text-sm">
        Your name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          className={INPUT_CLASS}
          data-testid="sit-as-name"
        />
      </label>

      {freeSeats.length > 1 ? (
        <div className="flex gap-2" data-testid="sit-as-seat-choice">
          {freeSeats.map((stone) => (
            <button
              key={stone}
              type="button"
              onClick={() => setSeat(stone)}
              data-testid={`sit-as-seat-${stone}`}
              className={`${BUTTON_BASE} ${seat === stone ? BUTTON_STRONG : BUTTON_QUIET}`}
            >
              {STONE_DISPLAY[stone].label} <span className="font-mincho">{STONE_DISPLAY[stone].kanji}</span>
            </button>
          ))}
        </div>
      ) : null}

      <ol className="flex flex-wrap gap-2" data-testid="sit-as-slots">
        {slots.map((word, index) => (
          <li key={index}>
            <button
              type="button"
              disabled={word === null || busy}
              onClick={() => dropSlot(index)}
              data-testid={`sit-as-slot-${index}`}
              className={`min-w-20 rounded-lg border px-3 py-2 text-sm ${
                word === null ? "border-dashed border-rule text-muted" : "border-moss bg-moss-soft text-ink"
              }`}
              title={word === null ? "Empty" : "Tap to take this word back out"}
            >
              {word ?? "—"}
            </button>
          </li>
        ))}
      </ol>

      {step !== null ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted" data-testid="sit-as-prefix">
            {prefix === "" ? "Tap a letter to start the fourth word." : `Starting with "${prefix}"`}
          </p>
          {step.kind === "letters" ? (
            <div className="flex flex-wrap gap-1.5" data-testid="sit-as-letters">
              {step.letters.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setPrefix(prefix + letter)}
                  className={`${BUTTON_BASE} ${BUTTON_QUIET} min-w-9 uppercase`}
                  data-testid={`sit-as-letter-${letter}`}
                >
                  {letter}
                </button>
              ))}
            </div>
          ) : step.kind === "words" ? (
            <div className="flex flex-wrap gap-1.5" data-testid="sit-as-words">
              {step.words.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => fillSlot(activeSlot, word)}
                  className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
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
              className="self-start text-xs text-muted underline underline-offset-4"
              data-testid="sit-as-back"
            >
              Back a letter
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          disabled={busy || name.trim() === "" || (freeSeats.length > 1 && seat === undefined)}
          onClick={() => void submit()}
          className={`${BUTTON_BASE} ${BUTTON_STRONG} self-start px-4`}
          data-testid="sit-as-submit"
        >
          Sit down
        </button>
      )}

      <button type="button" onClick={reset} className="self-start text-xs text-muted underline underline-offset-4" data-testid="sit-as-cancel">
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
