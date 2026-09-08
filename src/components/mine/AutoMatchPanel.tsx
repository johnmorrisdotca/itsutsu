"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

import { Select } from "@/components/ui/Controls";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

/** The paces a request may ask for, matching the shared-game clock choices. */
const PACES: { value: number | null; label: string }[] = [
  { value: null, label: "No clock" },
  { value: 5 * 60_000, label: "5 minutes a move" },
  { value: 30 * 60_000, label: "30 minutes a move" },
  { value: 60 * 60_000, label: "1 hour a move" },
  { value: 6 * 60 * 60_000, label: "6 hours a move" },
  { value: 24 * 60 * 60_000, label: "1 day a move" },
  { value: 3 * 24 * 60 * 60_000, label: "3 days a move" },
  { value: 7 * 24 * 60 * 60_000, label: "7 days a move" },
];

type Waiting = { id: string; variant: string; moveTimeMs: number | null; since: string };

const fetcher = async (url: string): Promise<{ items: Waiting[] }> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("not signed in");
  return response.json();
};

const paceLabel = (ms: number | null) => PACES.find((pace) => pace.value === ms)?.label ?? "";

/**
 * Auto-match, as the elder sites had it: say which game and how fast, and
 * the site pairs you with the next person who wants the same. Paired at
 * once if someone is already waiting; otherwise the request waits, up to
 * five at a time, and the game appears in your list when it comes.
 */
export function AutoMatchPanel({ waiting }: { waiting: Record<string, number> }) {
  const router = useRouter();
  const { data, mutate } = useSWR("/api/automatch", fetcher);
  const [variant, setVariant] = useState<string>("freestyle");
  const [pace, setPace] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function ask() {
    setBusy(true);
    setNote(null);
    const response = await fetch("/api/automatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant, moveTimeMs: pace === "" ? null : Number(pace) }),
    });
    setBusy(false);
    const payload = (await response.json().catch(() => null)) as { matched?: boolean; path?: string; error?: string } | null;
    if (!response.ok) {
      setNote(payload?.error ?? "That could not be asked.");
      return;
    }
    if (payload?.matched && payload.path) {
      router.push(payload.path);
      return;
    }
    setNote("Nobody is waiting for that yet. Your request is in; the game will appear in your list when someone asks for the same.");
    await mutate();
  }

  async function cancel(id: string) {
    await fetch("/api/automatch", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await mutate();
  }

  const others = waiting[variant] ?? 0;

  return (
    <div className="flex flex-col gap-3" data-testid="auto-match">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Game
          <Select value={variant} onChange={(event) => setVariant(event.target.value)} data-testid="auto-match-game">
            {RULE_VARIANT_LIST.map((option) => (
              <option key={option} value={option}>
                {RULE_VARIANT_DISPLAY[option].label}
                {waiting[option] ? ` · ${waiting[option]} waiting` : ""}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Pace
          <Select value={pace} onChange={(event) => setPace(event.target.value)} data-testid="auto-match-pace">
            {PACES.map((option) => (
              <option key={option.label} value={option.value === null ? "" : String(option.value)}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
        <button type="button" onClick={ask} disabled={busy} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4 py-1.5 text-sm`} data-testid="auto-match-ask">
          Find me a game
        </button>
      </div>
      <p className="text-xs text-muted">
        {others > 0 ? `${others} waiting for ${RULE_VARIANT_DISPLAY[variant as keyof typeof RULE_VARIANT_DISPLAY].label} right now.` : "Nobody waiting for this game at the moment; asking puts you first in line."}{" "}
        Colours are drawn at random. Someone you ignore, or already play this game against, is skipped.
      </p>
      {note !== null ? <p className="text-xs text-ink-soft" data-testid="auto-match-note">{note}</p> : null}
      {data && data.items.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm" data-testid="auto-match-waiting">
          {data.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border border-rule px-3 py-1.5">
              <span>{RULE_VARIANT_DISPLAY[item.variant as keyof typeof RULE_VARIANT_DISPLAY]?.label ?? item.variant}</span>
              <span className="text-xs text-muted">{paceLabel(item.moveTimeMs)}</span>
              <button type="button" onClick={() => cancel(item.id)} className={`${BUTTON_BASE} ${BUTTON_QUIET} ml-auto px-2 py-0.5 text-xs`}>
                Cancel
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
