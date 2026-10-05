"use client";

import { useEffect, useRef, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, SECTION_TITLE, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { choiceOfTheme, isDefaultChoice, themeOf, resolveFrame } from "@/lib/puzzles/meikyuu/look";
import { FRAME_LIST, FRAMES, INK_LIST, INKS, LOOK_COPY, PAPER_LIST, PAPERS, THEME_LIST, THEMES, type FrameId, type InkId, type PaperId } from "@/lib/puzzles/meikyuu/look.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MOVE_COPY } from "./meikyuu.constants";
import { useEdgePan } from "./meikyuuEdgeStore";
import { useMeikyuuLook } from "./meikyuuLookStore";

/** A swatch a fingertip can hit, in the chosen colour, ringed when chosen. */
const SWATCH = "relative size-11 shrink-0 cursor-pointer rounded-full border-2 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 sm:size-9";

/** The look as a few cells of maze, in the colours it will be drawn in: what the chooser shows before the board behind it can be seen. */
function Sample() {
  const { look, choice } = useMeikyuuLook();
  const frame = resolveFrame(choice.frame);
  return (
    <svg viewBox="0 0 9 7" className="mx-auto w-full max-w-52 rounded-md" role="img" aria-label="A little maze in these colours" data-testid="meikyuu-colours-sample" style={{ background: `linear-gradient(135deg, ${frame.light}, ${frame.base} 50%, ${frame.deep})`, padding: "0.4rem" }}>
      <rect x="0.5" y="0.5" width="8" height="6" fill={look.paper} />
      <path d="M1.5 1.5H7.5V5.5H1.5ZM1.5 3.5H3.5M4.5 1.5V3.5H6.5M3.5 5.5V4.5H5.5V3.5" fill="none" stroke={look.wall} strokeWidth="0.16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 2.2H4V2.9H5.5V4.5H7" fill="none" stroke={look.trail} strokeWidth="0.42" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="2" cy="2.2" r="0.3" fill={look.start} stroke={look.paper} strokeWidth="0.06" />
      <circle cx="7" cy="4.5" r="0.34" fill={look.goal} stroke={look.wall} strokeWidth="0.1" />
      <circle cx="4.5" cy="4.5" r="0.32" fill={look.stone} stroke={look.wall} strokeWidth="0.07" />
      <circle cx="4.4" cy="4.39" r="0.09" fill="#fff" opacity="0.55" />
    </svg>
  );
}

/** One row of swatches: a name, and a press for each choice. */
function Row<T extends string>({ title, name, list, chosen, onChoose, paint }: { title: string; name: string; list: readonly T[]; chosen: T; onChoose: (id: T) => void; paint: (id: T) => { label: string; style: React.CSSProperties } }) {
  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label={title} data-testid={`meikyuu-${name}-row`}>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</p>
      <div className="flex flex-wrap gap-2">
        {list.map((id) => {
          const { label, style } = paint(id);
          const on = id === chosen;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChoose(id)}
              aria-pressed={on}
              aria-label={`${title}: ${label}`}
              title={label}
              className={`${SWATCH} ${on ? "border-ink shadow-[0_0_0_2px_var(--color-ivory,#fff),0_0_0_4px_var(--color-ink,#000)]" : "border-rule-strong/60"}`}
              style={style}
              data-testid={`meikyuu-${name}-${id}`}
              data-chosen={on ? "true" : "false"}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * THE COLOURS OF A MEIKYUU BOARD, CHOSEN: a small press, "Colours 色", beside the board
 * wherever one is drawn (the set-up's preview, the play screen, a finished level and a
 * finished solve's page), and a window with the choices.
 *
 * John, 2026-10-02: "allow the user to change the colour for the border… the background
 * colour and even the colour of the maze. We have to be smart with colours that work
 * together and not make something that makes it very hard to see the thing, but it allows
 * kids and people to decorate their design even before and after playing."
 *
 * Eight ready-made sets are one press each; "Make your own" is three rows of swatches (the
 * border, the background, the maze). No choice is refused: whatever is chosen is drawn
 * readable (`meikyuu/look.ts`, proved for every combination), and when the maze's own colours
 * had to change to stay easy to see the window says so. A press draws at once on every board
 * on the page, is kept on this device, and on the account where there is one.
 *
 * A control of fixed size, and the window is a top-layer <dialog> like the wallpaper's
 * (Esc closes it, and works in Just the board too), so choosing a colour moves nothing on the page.
 */
export function MeikyuuColours({ className = "" }: { className?: string }) {
  const hydrated = useHydrated();
  const { choice, look, choose, reset } = useMeikyuuLook();
  const { edgePan, choose: chooseEdgePan } = useEdgePan();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element === null) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  const theme = themeOf(choice);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} px-3 py-1 text-sm ${className}`}
        aria-haspopup="dialog"
        data-testid="meikyuu-colours"
        data-look={`${choice.frame}.${choice.paper}.${choice.ink}`}
        {...readyMark(hydrated)}
      >
        {LOOK_COPY.press} <span className="font-mincho">{LOOK_COPY.kanji}</span>
      </button>
      {open ? (
        <dialog
          ref={dialog}
          onClose={() => setOpen(false)}
          aria-labelledby="meikyuu-colours-title"
          className="m-auto max-h-[calc(100dvh-1rem)] w-[min(34rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-rule bg-paper p-4 text-ink shadow-2xl backdrop:bg-ink/45 sm:p-5"
          data-testid="meikyuu-colours-dialog"
          data-look={`${choice.frame}.${choice.paper}.${choice.ink}`}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <h2 id="meikyuu-colours-title" className={SECTION_TITLE}>
                {LOOK_COPY.title} <span className="font-mincho normal-case tracking-normal">{LOOK_COPY.kanji}</span>
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-full border border-rule-strong px-4 text-sm font-semibold text-ink hover:bg-shade" data-testid="meikyuu-colours-done">
                {LOOK_COPY.done} <span aria-hidden="true">×</span>
              </button>
            </div>
            <p className="text-sm text-muted">{LOOK_COPY.blurb}</p>
            <Sample />
            <div className="flex flex-col gap-1.5" role="group" aria-label={LOOK_COPY.themes}>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">{LOOK_COPY.themes}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {THEME_LIST.map((id) => {
                  const set = THEMES[id];
                  const on = theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => choose(choiceOfTheme(id))}
                      aria-pressed={on}
                      className={`flex min-h-11 items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-moss ${on ? "border-ink bg-shade font-semibold" : "border-rule-strong/60 hover:bg-shade"}`}
                      data-testid={`meikyuu-theme-${id}`}
                      data-chosen={on ? "true" : "false"}
                    >
                      <span className="flex shrink-0" aria-hidden="true">
                        <span className="size-4 rounded-full border border-black/20" style={{ background: FRAMES[set.frame].base }} />
                        <span className="-ml-1 size-4 rounded-full border border-black/20" style={{ background: PAPERS[set.paper].colour }} />
                        <span className="-ml-1 size-4 rounded-full border border-black/20" style={{ background: INKS[set.ink].wall }} />
                      </span>
                      <span className="min-w-0 leading-tight">{set.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3" role="group" aria-label={LOOK_COPY.own}>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">{LOOK_COPY.own}</p>
              <Row<FrameId>
                title={LOOK_COPY.frame}
                name="frame"
                list={FRAME_LIST}
                chosen={choice.frame}
                onChoose={(frame) => choose({ frame })}
                paint={(id) => ({ label: FRAMES[id].label, style: { background: `linear-gradient(135deg, ${resolveFrame(id).light}, ${FRAMES[id].base} 55%, ${resolveFrame(id).deep})` } })}
              />
              <Row<PaperId> title={LOOK_COPY.paper} name="paper" list={PAPER_LIST} chosen={choice.paper} onChoose={(paper) => choose({ paper })} paint={(id) => ({ label: PAPERS[id].label, style: { background: PAPERS[id].colour } })} />
              <Row<InkId>
                title={LOOK_COPY.ink}
                name="ink"
                list={INK_LIST}
                chosen={choice.ink}
                onChoose={(ink) => choose({ ink })}
                paint={(id) => ({ label: INKS[id].label, style: { background: `radial-gradient(circle at 50% 50%, ${INKS[id].trail} 0 28%, ${INKS[id].wall} 31% 100%)` } })}
              />
            </div>
            {/* How the view behaves for a hand that wants it to stay where it is put: kept on this device (`meikyuuEdgeStore.ts`). */}
            <label className="flex min-h-11 cursor-pointer items-start gap-2.5 text-sm" title={MOVE_COPY.edge.says}>
              <input type="checkbox" checked={edgePan} onChange={(event) => chooseEdgePan(event.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-moss,#2f7a4f)]" data-testid="meikyuu-edge-pan" />
              <span>{MOVE_COPY.edge.label}</span>
            </label>
            {/* Its room is always kept, so the window does not change height when a choice is adjusted. */}
            <p className="min-h-10 text-xs text-muted" data-testid="meikyuu-look-adjusted" data-adjusted={look.adjusted ? "true" : "false"} aria-live="polite">
              {look.adjusted ? LOOK_COPY.adjusted : ""}
            </p>
            <div className="flex justify-between gap-2">
              {/* Not `disabled` when there is nothing to reset: a button that goes dead takes the focus with it, and Esc stops reaching the window. */}
              <button type="button" onClick={() => !isDefaultChoice(choice) && reset()} aria-disabled={isDefaultChoice(choice)} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1 text-sm ${isDefaultChoice(choice) ? "opacity-35" : ""}`} data-testid="meikyuu-colours-reset">
                {LOOK_COPY.reset}
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
