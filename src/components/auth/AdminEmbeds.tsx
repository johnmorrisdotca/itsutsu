"use client";

import { useId, useState } from "react";
import useSWR from "swr";

import { Button, SectionTitle } from "@/components/ui/Controls";
import { INPUT_CLASS, TONE_CLASS } from "@/components/ui/ui.constants";

type SessionInfo = { signedIn: boolean; admin: boolean; email: string | null };

type MintedEmbed = {
  token: string;
  url: string;
  label: string;
  scope: "board" | "data";
  expiresInDays: number;
  snippet: string;
};

const json = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(String(response.status));
  return response.json() as Promise<T>;
};

/**
 * Embed tokens, for the operator.
 *
 * What gets handed over is the whole iframe snippet rather than a bare token,
 * because assembling the URL by hand is where the parameter name gets typed
 * wrong. There is no list of issued tokens to show: they carry their own proof
 * rather than living in a table, which is what lets the gate check them on the
 * Edge runtime. Expiry retires them, and EMBED_TOKEN_EPOCH retires them all.
 */
export function AdminEmbeds() {
  const { data: session } = useSWR<SessionInfo>("/api/session", json);
  const [label, setLabel] = useState("");
  const [withData, setWithData] = useState(false);
  const [minted, setMinted] = useState<MintedEmbed | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const labelId = useId();

  if (session?.admin !== true) return null;

  async function mint() {
    if (label.trim() === "") return;
    setBusy(true);
    try {
      const response = await fetch("/api/embed-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          scope: withData ? "data" : "board",
        }),
      });
      if (response.ok) {
        setMinted((await response.json()) as MintedEmbed);
        setLabel("");
        setCopied(false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The snippet is on screen regardless.
    }
  }

  return (
    <section className="flex flex-col gap-3" data-testid="admin-embeds">
      <SectionTitle kanji="埋め込み">Embed a board</SectionTitle>
      <p className="text-xs text-muted">
        A token that lets one site put the board in an iframe. It unlocks the
        board and nothing else.
      </p>

      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={withData}
          onChange={(event) => setWithData(event.target.checked)}
          className="size-3.5 accent-ink"
          data-testid="embed-with-data"
        />
        Also let it read games played and player names
      </label>

      {/*
        Named by a label, the same way and for the same reason as the invite
        note beside it in AdminInvites.tsx: a placeholder vanishes as soon as
        somebody types and is no name to rely on. The placeholder stays, as an
        example of what to write.
      */}
      <div className="flex flex-col gap-1">
        <label htmlFor={labelId} className="text-sm text-ink-soft">
          Which site it is for
        </label>
        <div className="flex gap-2">
          <input
            id={labelId}
            className={INPUT_CLASS}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="The family blog"
            maxLength={120}
            data-testid="embed-label"
          />
          <Button onClick={mint} disabled={busy || label.trim() === ""} strong>
            {busy ? "…" : "New embed"}
          </Button>
        </div>
      </div>

      {minted !== null ? (
        <div
          className={`flex flex-col gap-2 rounded-xl border px-3 py-3 ${TONE_CLASS.good}`}
          data-testid="minted-embed"
        >
          <p className="text-xs font-semibold">
            {minted.label} · {minted.scope === "data" ? "board and data" : "board only"} ·
            expires in {minted.expiresInDays} days
          </p>
          <pre className="overflow-x-auto rounded-lg bg-shade p-2 text-[0.65rem] leading-relaxed">
            <code>{minted.snippet}</code>
          </pre>
          <Button onClick={() => copy(minted.snippet)}>
            {copied ? "Copied" : "Copy the iframe"}
          </Button>
          <p className="text-[0.7rem] opacity-85">
            The host&apos;s origin must also be listed in{" "}
            <code className="font-mono">EMBED_ALLOWED_ORIGINS</code>, or the
            browser will refuse to frame it.
          </p>
        </div>
      ) : null}
    </section>
  );
}
