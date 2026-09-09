"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";

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
} & { "data-testid"?: string }) {
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
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between gap-3 text-sm text-ink-soft">
        {label}
        {children}
      </span>
      {hint !== undefined ? (
        <span className="text-xs leading-snug text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={SELECT_CLASS} />;
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
  return (
    <label className={`flex flex-col gap-1 ${disabled ? "opacity-55" : ""}`}>
      <span className="flex items-center justify-between gap-3 text-sm text-ink-soft">
        {label}
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 accent-ink disabled:cursor-not-allowed"
        />
      </span>
      {hint !== undefined ? (
        <span className="text-xs leading-snug text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function SectionTitle({
  children,
  kanji,
}: {
  children: ReactNode;
  kanji?: string;
}) {
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
