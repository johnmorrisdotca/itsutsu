"use client";

import { useEffect, useRef, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Paired } from "@/components/i18n/Paired";
import { SECTION_HEADING, SECTION_HEADING_KANJI, SECTION_TITLE } from "@/components/ui/ui.constants";
import type { RulesPage } from "@/lib/learn/rulesPage";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/** The four parts of a rules page, the same headings as `/games/<slug>/rules`. */
const PARTS = [
  { key: "object", heading: "gamepages.rulesObjective", kanji: "目的" },
  { key: "board", heading: "gamepages.rulesBoard", kanji: "盤" },
  { key: "play", heading: "gamepages.rulesPlay", kanji: "手順" },
  { key: "house", heading: "gamepages.rulesHouse", kanji: "細則" },
] as const;

/** What of a rules page the modal carries: the name and the four parts, no more. */
export type RulesInModal = Pick<RulesPage, "title" | "kanji" | "object" | "board" | "play" | "house">;

/**
 * THE RULES, OVER THE GAME BEING PLAYED, rather than a link away from it.
 *
 * John, 2026-09-25, in the middle of a puzzle: "if you're in a Game, pressing
 * the Rules shouldn't take you out of the game... A Modal of just the Rules???
 * a modified rules Modal where you don't show the Play button again". So on a
 * board — a game's or a puzzle's — Rules opens the same four parts as the
 * rules page, and nothing else: no picture, no Play, no ways elsewhere.
 * Closing it (×, Escape, or outside it) leaves the board exactly as it was.
 */
export function RulesModal({ rules }: { rules: RulesInModal }) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element === null) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="underline underline-offset-4 hover:text-ink"
        data-testid="open-rules"
        {...readyMark(hydrated)}
      >
        {say.say("gamepages.rulesOpen")}
      </button>
      {open ? (
        <dialog
          ref={dialog}
          onClose={() => setOpen(false)}
          // A press on the backdrop lands on the dialog itself, never on what is inside it.
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          aria-labelledby="rules-modal-title"
          className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-rule bg-paper p-4 text-ink shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm sm:p-6"
          data-testid="rules-dialog"
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="rules-modal-title" className={SECTION_HEADING}>
                {rules.title}
                {say.pairsWithKanji ? <span className={SECTION_HEADING_KANJI}> {rules.kanji}</span> : null}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-2 text-2xl leading-none text-muted hover:text-ink"
                aria-label={say.say("gamepages.rulesClose")}
                data-testid="close-rules"
              >
                ×
              </button>
            </div>
            {PARTS.map((part) => (
              <section key={part.key} className="flex flex-col gap-2">
                <h3 className={`flex items-baseline gap-2 ${SECTION_TITLE}`}>
                  <Paired en={say.say(part.heading)} kanji={part.kanji} kanjiClassName="font-mincho text-xs normal-case tracking-normal" />
                </h3>
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
                  {rules[part.key].map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
