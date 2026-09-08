"use client";

import QRCode from "qrcode";
import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, INPUT_CLASS, PANEL_CLASS } from "@/components/ui/ui.constants";

/**
 * A link that lets one friend in. The member asks for it, gets a one-use
 * code wrapped in the join address, and sends it however they like — the
 * QR is for a phone across the table. Email comes later.
 */
export function InviteFriends() {
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function invite() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/invites/mine", { method: "POST" });
    if (!response.ok) {
      setError("That invitation could not be made.");
      setBusy(false);
      return;
    }
    const { code } = (await response.json()) as { code: string };
    const url = `${window.location.origin}/join?code=${encodeURIComponent(code)}`;
    setLink(url);
    setQr(await QRCode.toDataURL(url, { width: 240, margin: 1 }));
    setBusy(false);
  }

  async function copy() {
    if (link === null) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="invite-friends">
      <h2 className="flex items-baseline gap-2 font-semibold">
        Invite a friend <span className="font-mincho text-xs font-normal opacity-70">招待</span>
      </h2>
      <p className="text-sm text-muted">
        A link that lets one person in, good for a month. Send it any way you like; once they are in,
        challenge them from the players page.
      </p>
      {link === null ? (
        <span>
          <button type="button" onClick={invite} disabled={busy} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1.5 text-sm`}>
            Make an invitation
          </button>
        </span>
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input readOnly value={link} className={`${INPUT_CLASS} font-mono text-xs`} onFocus={(e) => e.currentTarget.select()} />
            <span className="flex gap-2">
              <button type="button" onClick={copy} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1 text-xs`}>
                {copied ? "Copied" : "Copy link"}
              </button>
              <button type="button" onClick={invite} disabled={busy} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1 text-xs`}>
                Another
              </button>
            </span>
          </div>
          {qr !== null ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data URL drawn here
            <img src={qr} alt="QR code for the invitation" className="size-32 rounded-md border border-rule bg-ivory p-1" />
          ) : null}
        </div>
      )}
      {error !== null ? <p className="text-xs text-shu">{error}</p> : null}
    </section>
  );
}
