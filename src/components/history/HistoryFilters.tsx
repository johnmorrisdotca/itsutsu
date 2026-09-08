"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import {
  GAME_RESULT_DISPLAY,
  GAME_RESULT_FILTERS,
  GAME_SIZE_FILTERS,
  GAME_SORT_BY,
  GAME_SORT_DISPLAY,
  GAME_VARIANT_FILTERS,
} from "@/lib/history/gameHistory.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { Field, Select } from "@/components/ui/Controls";
import { INPUT_CLASS } from "@/components/ui/ui.constants";

/**
 * The filter bar writes to the URL rather than to local state, so a filtered
 * view can be linked, bookmarked and reloaded — and so the server component
 * beside it stays the only thing that reads the query.
 */
export function HistoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value === "" || value === "all") next.delete(key);
      else next.set(key, value);
      // Any change to the filters invalidates which page you were on.
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const value = (key: string, fallback = "") => params.get(key) ?? fallback;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
        <span className="text-sm text-ink-soft">Player</span>
        <input
          type="search"
          className={INPUT_CLASS}
          placeholder="Search names"
          defaultValue={value("search")}
          onChange={(event) => update("search", event.target.value)}
          data-testid="history-search"
        />
      </label>

      <Field label="Result">
        <Select
          value={value("result", "all")}
          onChange={(event) => update("result", event.target.value)}
          data-testid="history-result"
        >
          {GAME_RESULT_FILTERS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Any" : GAME_RESULT_DISPLAY[option].label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Board">
        <Select
          value={value("size", "all")}
          onChange={(event) => update("size", event.target.value)}
        >
          {GAME_SIZE_FILTERS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Any" : `${option}×${option}`}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Rules">
        <Select
          value={value("variant", "all")}
          onChange={(event) => update("variant", event.target.value)}
        >
          {GAME_VARIANT_FILTERS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Any" : variantLabel(option)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Sort">
        <Select
          value={`${value("sortBy", "playedAt")}:${value("sortDir", "desc")}`}
          onChange={(event) => {
            const [by, dir] = event.target.value.split(":");
            const next = new URLSearchParams(params.toString());
            next.set("sortBy", by);
            next.set("sortDir", dir);
            next.delete("page");
            router.replace(`${pathname}?${next.toString()}`);
          }}
          data-testid="history-sort"
        >
          {GAME_SORT_BY.flatMap((by) =>
            (["desc", "asc"] as const).map((dir) => (
              <option key={`${by}:${dir}`} value={`${by}:${dir}`}>
                {GAME_SORT_DISPLAY[by].label} {dir === "desc" ? "↓" : "↑"}
              </option>
            )),
          )}
        </Select>
      </Field>
    </div>
  );
}
