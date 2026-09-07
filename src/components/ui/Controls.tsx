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
      <span className="flex items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-200">
        {label}
        {children}
      </span>
      {hint !== undefined ? (
        <span className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">
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
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-200">
        {label}
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 accent-zinc-900 dark:accent-zinc-100"
        />
      </span>
      {hint !== undefined ? (
        <span className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">
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
