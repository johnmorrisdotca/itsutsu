"use client";

import { useState } from "react";
import useSWR from "swr";

import { Button, SectionTitle } from "@/components/ui/Controls";
import { INPUT_CLASS, TONE_CLASS } from "@/components/ui/ui.constants";
import type { InviteSummary } from "@/lib/invite/inviteStore";

/** How many codes the list shows before it folds. */
const RECENT_INVITES = 5;

type SessionInfo = { signedIn: boolean; admin: boolean; email: string | null };

const json = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(String(response.status));
  return response.json() as Promise<T>;
};

/**
 * Minting invitations, from the game page.
 *
 * Only rendered for the operator, and the endpoints behind it check that again
 * on the server — this component going missing is a convenience, not the
 * control. A minted code is shown once, large and copyable, because it is
 * about to be read aloud or texted to somebody.
 */
export function AdminInvites() {
  const { data: session } = useSWR<SessionInfo>("/api/session", json);
  const isAdmin = session?.admin === true;

  const { data, mutate } = useSWR<{ items: InviteSummary[] }>(
    isAdmin ? "/api/invites" : null,
    json,
  );

  const [note, setNote] = useState("");
  const [minted, setMinted] = useState<InviteSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (!isAdmin) return null;

  async function mint() {
    setBusy(true);
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (response.ok) {
        setMinted((await response.json()) as InviteSummary);
        setNote("");
        setCopied(false);
        await mutate();
      }
    } finally {
      setBusy(false);
    }
  }

  async function revoke(code: string) {
    await fetch(`/api/invites/${encodeURIComponent(code)}`, { method: "DELETE" });
    if (minted?.code === code) setMinted(null);
    await mutate();
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The code is on screen regardless.
    }
  }

  const active = (data?.items ?? []).filter((invite) => invite.active);
  /*
   * A few at a time. Every code ever minted stays valid, and on a site that
   * has been running a while that is a long list; the newest are the ones
   * being handed out, so those are shown and the rest fold away.
   */
  const shown = showAll ? active : active.slice(0, RECENT_INVITES);

  return (
    <section className="flex flex-col gap-3" data-testid="admin-invites">
      <SectionTitle kanji="招待状">Invite codes</SectionTitle>
      <p className="text-xs text-muted">
        Signed in as {session?.email}. A code lets one person through the door.
      </p>

      <div className="flex gap-2">
        <input
          className={INPUT_CLASS}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Who is it for?"
          maxLength={120}
          data-testid="invite-note"
        />
        <Button onClick={mint} disabled={busy} strong data-testid="mint-invite">
          {busy ? "…" : "New code"}
        </Button>
      </div>

      {minted !== null ? (
        <div
          className={`flex flex-col gap-2 rounded-xl border px-3 py-3 ${TONE_CLASS.good}`}
          data-testid="minted-code"
        >
          <p className="font-mono text-xl font-semibold tracking-wide">
            {minted.code}
          </p>
          <p className="text-xs opacity-85">
            Three words. Read it out, or send it — they enter it at /join.
          </p>
          <Button onClick={() => copy(minted.code)}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      ) : null}

      {active.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm" data-testid="active-invites">
          {shown.map((invite) => (
            <li
              key={invite.code}
              className="flex items-center gap-2 rounded-lg border border-rule px-2.5 py-1.5"
            >
              <span className="font-mono text-xs">{invite.code}</span>
              {invite.note ? (
                <span className="truncate text-xs text-muted">{invite.note}</span>
              ) : null}
              <span className="ml-auto text-xs text-muted tabular-nums">
                {invite.uses} used
              </span>
              <button
                type="button"
                onClick={() => revoke(invite.code)}
                className="text-xs text-shu underline underline-offset-4"
              >
                Revoke
              </button>
            </li>
          ))}
          {active.length > RECENT_INVITES ? (
            <li>
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-muted underline underline-offset-4"
                data-testid="toggle-all-invites"
              >
                {showAll ? "Show the newest only" : `Show all ${active.length}`}
              </button>
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="text-xs text-muted">No codes in circulation.</p>
      )}
    </section>
  );
}
