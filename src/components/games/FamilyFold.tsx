"use client";

import { useEffect, useRef, type ReactNode } from "react";

import {
  FAMILY_FOLD,
  FAMILY_FOLDS_STORAGE,
  familyFoldName,
  foldsFrom,
  type FamilyFoldKey,
} from "@/lib/catalogue/familyFolds";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/** This browser's folds, for a reader with no account; nothing where storage is refused or unreadable. */
function storedFolds(): ReturnType<typeof foldsFrom> {
  try {
    return foldsFrom(JSON.parse(window.localStorage.getItem(FAMILY_FOLDS_STORAGE) ?? "{}"));
  } catch {
    return {};
  }
}

/**
 * ONE FAMILY ON THE FAMILIES TAB, OPEN OR SHUT AS THE READER LAST LEFT IT.
 *
 * A member's answer arrives with the page (`initialOpen`, read from the
 * account in the render that draws it), so reading costs nothing; pressing
 * the family writes that one family's answer, once, and only when it changed —
 * a `<details>` also says it toggled when drawn open. A reader with no account
 * keeps the same answers in this browser instead (`FAMILY_FOLDS_STORAGE`),
 * applied once the page has arrived, and a browser that refuses storage simply
 * opens the page as it always did.
 */
export function FamilyFold({
  familyKey,
  initialOpen,
  saves,
  className,
  summary,
  children,
}: {
  familyKey: FamilyFoldKey;
  initialOpen: boolean;
  /** Whether there is an account to keep it on; otherwise this browser keeps it. */
  saves: boolean;
  className: string;
  /** The `<summary>` the reader presses. */
  summary: ReactNode;
  children: ReactNode;
}) {
  const hydrated = useHydrated();
  const fold = useRef<HTMLDetailsElement>(null);
  const kept = useRef(initialOpen);

  useEffect(() => {
    if (saves) return;
    const stored = storedFolds()[familyKey];
    if (stored === undefined) return;
    const open = stored === FAMILY_FOLD.open;
    // Kept first, so the toggle this causes is not taken for the reader's own.
    kept.current = open;
    if (fold.current !== null) fold.current.open = open;
  }, [saves, familyKey]);

  function toggled(open: boolean) {
    if (open === kept.current) return;
    kept.current = open;
    const now = open ? FAMILY_FOLD.open : FAMILY_FOLD.shut;
    if (saves) {
      void fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { [familyFoldName(familyKey)]: now } }),
      }).catch(() => undefined);
      return;
    }
    try {
      window.localStorage.setItem(FAMILY_FOLDS_STORAGE, JSON.stringify({ ...storedFolds(), [familyKey]: now }));
    } catch {
      // Storage refused (a private window, a full disk): the fold still works, it is only not remembered.
    }
  }

  return (
    <details
      ref={fold}
      className={className}
      open={initialOpen}
      onToggle={(event) => toggled(event.currentTarget.open)}
      data-testid="lobby-family"
      data-family={familyKey}
      {...readyMark(hydrated)}
    >
      {summary}
      {children}
    </details>
  );
}
