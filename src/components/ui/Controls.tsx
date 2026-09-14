"use client";

import { createContext, useContext, useId, type ReactNode, type SelectHTMLAttributes } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

import {
  BUTTON_BASE,
  BUTTON_QUIET,
  BUTTON_STRONG,
  SECTION_TITLE,
  SELECT_CLASS,
} from "./ui.constants";

export function Button({
  children,
  onClick,
  disabled = false,
  strong = false,
  title,
  ...rest
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  strong?: boolean;
  title?: string;
  /*
   * The hydration mark, for a button a spec has to wait for. `readyMark`
   * spells the attribute in one place; this only has to let it through the
   * props rather than swallow it as unknown.
   */
} & { "data-testid"?: string; "data-ready"?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${BUTTON_BASE} ${strong ? BUTTON_STRONG : BUTTON_QUIET}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * THE HINT IS A DESCRIPTION, NEVER PART OF THE NAME.
 *
 * A `<label>` names its control, and everything inside the label is the name.
 * So a hint written inside one — which is where both of these used to put it —
 * became part of the control's accessible name. Read off the rendered page
 * before this change, one of the profile's two switches was called
 * `checkbox "Show when I am here Listed on the players page while you are on
 * the site. Off, and nobody sees you come and go."` — a screen reader
 * announces that whole paragraph as the name of the control, and somebody
 * driving the site by voice has to say it to reach the box.
 *
 * `aria-describedby` is the other half of the pair and exists for exactly
 * this: the name is the label, the description is read after it, and a reader
 * skipping through the controls hears the names alone. Nothing moves on
 * screen — the hint sits under the control, styled as before — so this is a
 * change to what the page SAYS about itself and to nothing a reader sees.
 *
 * The id is carried down in a context rather than written onto whatever
 * `Field` was handed. `Field` takes its control as `children`, so it cannot
 * put an attribute on it without reaching into somebody else's element —
 * `cloneElement` would do it and would break the moment a caller wrapped the
 * select in anything. Every caller today passes exactly one `<Select>`, which
 * is in this module and can read the context itself; a caller passing its own
 * `<select>` or `<input>` can take `aria-describedby` from `useFieldHint()`.
 *
 * `useId` rather than a counter or a random: the markup is rendered on the
 * server and hydrated in the browser, and an id those two do not agree on is
 * a mismatch that throws the server's tree away. `useId` is the one generator
 * that promises the same answer in both.
 */
const FieldHint = createContext<string | undefined>(undefined);

/** The id of the hint the surrounding `Field` is describing its control with. */
export function useFieldHint(): string | undefined {
  return useContext(FieldHint);
}

/** A labelled select. The label is the control, so the whole row is clickable. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const hintId = useId();
  return (
    /*
      The label wraps the NAME and the control, and the hint is its sibling
      rather than its last child. The column and its spacing are the label's
      old ones, moved out one level, so the two lines sit exactly where they
      did; what changed is that clicking the hint no longer focuses the
      control, which is the price of the hint not being its name.
    */
    <div className="flex flex-col gap-1">
      {/*
        `min-w-0` on the row and on the label: without it a flex item refuses
        to shrink below its own content, so one long option in a select takes
        the control past the edge of the panel and the panel with it.
      */}
      <label className="flex min-w-0 items-center justify-between gap-3 text-sm text-ink-soft">
        <span className="min-w-0">{label}</span>
        <FieldHint.Provider value={hint === undefined ? undefined : hintId}>
          {children}
        </FieldHint.Provider>
      </label>
      {hint !== undefined ? (
        <span id={hintId} className="text-xs leading-snug text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const hintId = useFieldHint();
  /*
   * Both, where a caller describes its select by something of its own as
   * well: `aria-describedby` is a list of ids, so the field's hint joins the
   * caller's rather than replacing it.
   */
  const describedBy = [props["aria-describedby"], hintId].filter(Boolean).join(" ");
  return (
    <select
      {...props}
      aria-describedby={describedBy === "" ? undefined : describedBy}
      className={SELECT_CLASS}
    />
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  hint?: string;
  /** Greyed and inert, but still shown, so a rule the game fixes stays visible. */
  disabled?: boolean;
}) {
  const hintId = useId();
  /*
   * The box is rendered here rather than handed in, so the description goes
   * straight onto it — see `FieldHint` above for why the name is the label
   * alone and the hint is read after it.
   */
  return (
    <div className={`flex flex-col gap-1 ${disabled ? "opacity-55" : ""}`}>
      <label className="flex items-center justify-between gap-3 text-sm text-ink-soft">
        {label}
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={hint === undefined ? undefined : hintId}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 accent-ink disabled:cursor-not-allowed"
        />
      </label>
      {hint !== undefined ? (
        <span id={hintId} className="text-xs leading-snug text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/**
 * The heading over a panel, in the LOCALE + JP pattern.
 *
 * Nineteen panels across the site use this, which is why it is the single
 * most valuable place on the site to know the reader's language: a Japanese
 * reader gets nineteen headings in Japanese from one change, and every one of
 * them is a word John already wrote. The kanji beside the English *is* the
 * Japanese, so there is no translation here and nothing to review.
 *
 * English is untouched, deliberately: the kanji stays beside it, because the
 * sprinkle of Japanese on the English site is a thing the site wants, not a
 * side effect of not having got round to removing it.
 */
export function SectionTitle({
  children,
  kanji,
}: {
  children: ReactNode;
  kanji?: string;
}) {
  const say = useSpeaker();
  /*
   * `children` is a node, not a string, so it cannot be swapped for the kanji
   * the way a label can — the heading asks the reader's language instead, and
   * draws the kanji on its own.
   */
  if (!say.pairsWithKanji && kanji !== undefined && kanji !== "") {
    return (
      <h2 className={`flex items-baseline gap-2 ${SECTION_TITLE}`}>
        <span className="font-mincho normal-case tracking-normal">{kanji}</span>
      </h2>
    );
  }
  return (
    <h2 className={`flex items-baseline gap-2 ${SECTION_TITLE}`}>
      {children}
      {kanji !== undefined ? (
        <span className="text-[0.8rem] font-normal tracking-normal opacity-70">
          {kanji}
        </span>
      ) : null}
    </h2>
  );
}

/**
 * The cell a table row's controls sit in, whether or not it has any.
 *
 * A row's height belongs to the table, not to what that particular row
 * happens to offer. Your own row has nothing to befriend or ignore, a kept
 * record has nobody to challenge, and a row that shrinks when its buttons go
 * reads as a different kind of thing from the rows around it — which was the
 * complaint, and would come back the next time a control learned a new
 * condition.
 *
 * So the space is held rather than the absence patched: the height is that of
 * one of these small controls, reserved whether anything is rendered into it
 * or not. Using this is what makes a row the same height as its neighbours;
 * there is nothing to remember per table.
 */
export function RowActions({ children }: { children?: ReactNode }) {
  return (
    <span className="flex min-h-8 items-center justify-end gap-1">{children}</span>
  );
}
