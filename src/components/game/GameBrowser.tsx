"use client";

import { useEffect, useRef, useState } from "react";

import { availableOpenings } from "@/lib/gomoku/engine";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { OpeningRule, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { GAME_COPY } from "./game.constants";
import type { GamePanelProps } from "./game.types";

/**
 * The games browser: every rule set with its full rules, and the openings each
 * one offers, in a dialog over the board. Picking one starts a new game with
 * those rules, which is the same thing the settings selects do — this is the
 * long-form version, for someone who wants to know what they are agreeing to.
 */
export function GameBrowserButton(props: GamePanelProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid="open-game-browser">
        {GAME_COPY.browser.label}
        <span className="font-mincho text-xs opacity-70">{GAME_COPY.browser.kanji}</span>
      </Button>
      {open ? <GameBrowser {...props} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function GameBrowser({
  session,
  actions,
  onClose,
}: GamePanelProps & { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { settings } = session.state;
  const { variant, opening } = settings;
  const [shown, setShown] = useState<RuleVariant>(variant);
  const openings = availableOpenings({ ...settings, variant: shown });

  // A native dialog: it traps focus, dims the page and closes on Escape.
  useEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
  }, []);

  const play = (next: RuleVariant) => {
    const offered = availableOpenings({ ...settings, variant: next });
    actions.reset({ variant: next, opening: offered.includes(opening) ? opening : "free" });
    onClose();
  };

  const pickOpening = (next: OpeningRule) => {
    actions.reset({ variant: shown, opening: next });
    onClose();
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="game-browser-title"
      className="m-auto max-h-[92vh] w-[min(60rem,calc(100vw-1.5rem))] rounded-2xl border border-rule bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/55 backdrop:backdrop-blur-sm"
      data-testid="game-browser"
    >
      <div className="flex max-h-[92vh] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4">
          <div className="flex flex-col gap-1">
            <h2 id="game-browser-title" className="flex items-baseline gap-2 text-lg font-semibold">
              {GAME_COPY.browserTitle}
              <span className="font-mincho text-sm font-normal opacity-70">
                {GAME_COPY.browser.kanji}
              </span>
            </h2>
            <p className="max-w-prose text-xs text-muted">
              {GAME_COPY.browserIntro}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
            aria-label={GAME_COPY.browserClose}
          >
            ×
          </button>
        </header>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
          <ul className="grid gap-3 sm:grid-cols-2">
            {RULE_VARIANT_LIST.map((option) => {
              const copy = RULE_VARIANT_DISPLAY[option];
              const current = option === variant;
              const focused = option === shown;
              return (
                <li key={option}>
                  <article
                    onMouseEnter={() => setShown(option)}
                    onFocus={() => setShown(option)}
                    className={`flex h-full flex-col gap-2 rounded-xl border p-4 transition-colors ${
                      focused
                        ? "border-ink bg-ivory"
                        : "border-rule bg-ivory/60"
                    }`}
                    data-testid={`game-card-${option}`}
                  >
                    <h3 className="flex items-baseline justify-between gap-2">
                      <span className="flex items-baseline gap-2 text-base font-semibold">
                        {copy.label}
                        <span className="font-mincho text-sm font-normal opacity-70">
                          {copy.kanji}
                        </span>
                      </span>
                      {current ? (
                        <span className="rounded-full bg-moss-soft px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-moss uppercase">
                          {GAME_COPY.browserCurrent}
                        </span>
                      ) : null}
                    </h3>
                    <p className="text-sm font-medium">{copy.tagline}</p>
                    <p className="text-xs text-muted italic">
                      {copy.origin}
                    </p>
                    {copy.inspiredBy !== undefined ? (
                      <p className="text-xs text-muted" data-testid={`inspired-${option}`}>
                        Inspired by {copy.inspiredBy}
                      </p>
                    ) : null}
                    <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-snug text-ink-soft">
                      {copy.rules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted">{copy.board}</p>
                    <div className="mt-auto pt-2">
                      <Button
                        onClick={() => play(option)}
                        strong={!current}
                        disabled={current}
                        data-testid={`play-${option}`}
                      >
                        {current ? GAME_COPY.browserCurrent : GAME_COPY.browserPlay(copy.label)}
                      </Button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>

          <section className="flex flex-col gap-3">
            <SectionTitle kanji={GAME_COPY.browserOpenings.kanji}>
              {GAME_COPY.browserOpenings.label} · {RULE_VARIANT_DISPLAY[shown].label}
            </SectionTitle>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {openings.map((option) => {
                const copy = OPENING_DISPLAY[option];
                const active = shown === variant && option === opening;
                return (
                  <li
                    key={option}
                    className="flex flex-col gap-2 rounded-xl border border-rule bg-ivory/60 p-3"
                  >
                    <h4 className="flex items-baseline gap-2 text-sm font-semibold">
                      {copy.label}
                      <span className="font-mincho text-xs font-normal opacity-70">
                        {copy.kanji}
                      </span>
                    </h4>
                    <p className="text-xs font-medium">{copy.tagline}</p>
                    <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-snug text-ink-soft">
                      {copy.rules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-1">
                      <Button
                        onClick={() => pickOpening(option)}
                        disabled={active}
                        data-testid={`use-opening-${option}`}
                      >
                        {active ? GAME_COPY.browserCurrent : GAME_COPY.browserUse}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </dialog>
  );
}
