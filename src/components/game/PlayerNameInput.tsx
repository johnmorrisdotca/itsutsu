"use client";

import { useEffect, useId, useState } from "react";

import type { PlayerSuggestion } from "@/lib/history/gameHistory.types";

/** Long enough that typing does not fire a request per keystroke. */
const DEBOUNCE_MS = 180;

/**
 * A name box that completes against the names games have been recorded under.
 *
 * It uses a native `datalist`, so the suggestion popup is the browser's own —
 * keyboard behaviour, screen-reader support and mobile rendering come for free
 * rather than being rebuilt.
 */
export function PlayerNameInput({
  value,
  placeholder,
  className,
  onChange,
}: {
  value: string;
  placeholder: string;
  className: string;
  onChange: (name: string) => void;
}) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);

  const query = value.trim();

  useEffect(() => {
    if (query.length === 0) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/players?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const body = (await response.json()) as { items: PlayerSuggestion[] };
        setSuggestions(body.items);
      } catch {
        // An aborted or failed lookup just means no suggestions this keystroke.
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  /*
   * Derived rather than cleared in the effect: an empty box has no
   * suggestions by definition, so there is no state to synchronise.
   */
  const visible = query.length === 0 ? [] : suggestions;

  return (
    <>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        className={className}
        list={listId}
        autoComplete="off"
        maxLength={64}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {visible.map((suggestion) => (
          <option key={suggestion.name} value={suggestion.name}>
            {suggestion.games} game{suggestion.games === 1 ? "" : "s"}
          </option>
        ))}
      </datalist>
    </>
  );
}
