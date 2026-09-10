"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import {
  GAME_OUTCOME_DISPLAY,
  GAME_OUTCOME_FILTERS,
  GAME_POOL_DISPLAY,
  GAME_RATED_DISPLAY,
  GAME_RESULT_DISPLAY,
  GAME_RESULT_FILTERS,
  GAME_SIZE_FILTERS,
  outcomeLabel,
  GAME_SORT_BY,
  GAME_SORT_DISPLAY,
  GAME_VARIANT_FILTERS,
} from "@/lib/history/gameHistory.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { recordPath } from "@/lib/gomoku/slugs";
import { sortWord } from "@/lib/history/gameHistoryQuery";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { Field, Select } from "@/components/ui/Controls";
import { INPUT_CLASS } from "@/components/ui/ui.constants";

/**
 * The filter bar writes to the URL rather than to local state, so a filtered
 * view can be linked, bookmarked and reloaded — and so the server component
 * beside it stays the only thing that reads the query.
 */
export function HistoryFilters({ variant }: { variant: RuleVariant | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  /*
   * The game is not a filter but a collection: /history/<slug> is one game's
   * record, with its own address, so choosing a game goes there, and the
   * other filters come along in the query.
   */
  const chooseGame = useCallback(
    (next: string) => {
      const query = new URLSearchParams(params.toString());
      query.delete("page");
      const base = next === "all" ? "/history" : recordPath(next);
      const search = query.toString();
      router.replace(search === "" ? base : `${base}?${search}`);
    },
    [params, router],
  );

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

  /*
   * What a link narrowed this record to, said out loud.
   *
   * Every count on this site now leads here carrying a filter — whose games,
   * how they went, which ladder was counting. A page that applied those
   * silently would be showing a reader eleven games and calling it the record,
   * with nothing on screen to say why it was not the record. So each one
   * arrives as a chip that names itself and can be taken off, which also
   * makes the link's promise checkable: the chips are exactly what was asked.
   */
  const player = value("player");
  const narrowings = [
    player === "" ? null : { key: "player", label: `${player}'s games` },
    value("outcome") === ""
      ? null
      : {
          key: "outcome",
          label: outcomeLabel(value("outcome")),
        },
    value("pool") === ""
      ? null
      : {
          key: "pool",
          label: GAME_POOL_DISPLAY[value("pool")]?.label ?? value("pool"),
        },
    value("rated") === ""
      ? null
      : {
          key: "rated",
          label: GAME_RATED_DISPLAY[value("rated")]?.label ?? value("rated"),
        },
  ].filter((one): one is { key: string; label: string } => one !== null);

  return (
    <div className="flex flex-col gap-3">
      {narrowings.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-2 text-xs"
          data-testid="history-narrowed"
        >
          <span className="text-muted">Narrowed to</span>
          {narrowings.map((one) => (
            <button
              key={one.key}
              type="button"
              onClick={() => update(one.key, "all")}
              className="flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 hover:border-ink-soft"
              title={`Stop narrowing to ${one.label}`}
              data-testid="history-narrowing"
              data-narrowing={one.key}
            >
              {one.label}
              <span aria-hidden className="text-muted">
                ×
              </span>
              <span className="sr-only">— remove</span>
            </button>
          ))}
        </div>
      ) : null}
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

        {/*
        Two questions, and only one of them can be asked at a time. Without a
        name, the record knows which COLOUR won and nothing more. With one, the
        reader almost always means "how did it go for them", and offering both
        selects at once would be offering a choice between a question and its
        own rephrasing.
      */}
        {player === "" ? (
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
        ) : (
          <Field label={`How it went for ${player}`}>
            <Select
              value={value("outcome", "all")}
              onChange={(event) => update("outcome", event.target.value)}
              data-testid="history-outcome"
            >
              {GAME_OUTCOME_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === "all"
                    ? "Any"
                    : GAME_OUTCOME_DISPLAY[option].label}
                </option>
              ))}
            </Select>
          </Field>
        )}

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
            value={variant ?? "all"}
            onChange={(event) => chooseGame(event.target.value)}
            data-testid="history-game"
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
            value={`${value("sort", "played")}:${value("order", "desc")}`}
            onChange={(event) => {
              const [by, dir] = event.target.value.split(":");
              const next = new URLSearchParams(params.toString());
              next.set("sort", by);
              next.set("order", dir);
              next.delete("page");
              router.replace(`${pathname}?${next.toString()}`);
            }}
            data-testid="history-sort"
          >
            {GAME_SORT_BY.flatMap((by) =>
              (["desc", "asc"] as const).map((dir) => (
                <option key={`${by}:${dir}`} value={`${sortWord(by)}:${dir}`}>
                  {GAME_SORT_DISPLAY[by].label} {dir === "desc" ? "↓" : "↑"}
                </option>
              )),
            )}
          </Select>
        </Field>
      </div>
    </div>
  );
}
