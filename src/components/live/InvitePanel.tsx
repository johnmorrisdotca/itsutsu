"use client";

import { useState } from "react";

import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { SectionTitle } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";

export type SeatInvite = {
  stone: Stone;
  url: string;
  /** A data-URL PNG of the seat link, rendered on the server. */
  qr: string;
};

/**
 * The two seat links, each with its QR code.
 *
 * There is no sign-in, so a link *is* a seat — which is exactly why each one
 * is shown separately and labelled with the colour it holds. Handing someone
 * the wrong link hands them your side of the board.
 */
export function InvitePanel({
  invites,
  yourStone,
}: {
  invites: SeatInvite[];
  yourStone: Stone | null;
}) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
      <SectionTitle kanji="招待">Seat links</SectionTitle>
      <p className="text-xs text-muted">
        Send a player their own link. Whoever opens it plays that colour, so
        keep yours to yourself.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {invites.map((invite) => (
          <SeatCard
            key={invite.stone}
            invite={invite}
            isYours={invite.stone === yourStone}
          />
        ))}
      </div>
    </section>
  );
}

function SeatCard({ invite, isYours }: { invite: SeatInvite; isYours: boolean }) {
  const [copied, setCopied] = useState(false);
  const display = STONE_DISPLAY[invite.stone];

  async function copy() {
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the link is on screen either way.
    }
  }

  /*
   * `sms:` opens the phone's own messaging app with the link already written.
   * It needs no account, no gateway and no phone number stored anywhere, which
   * is the whole reason to prefer it over sending a message ourselves.
   */
  const smsHref = `sms:?&body=${encodeURIComponent(
    `Your seat in our gomoku game (${display.label}): ${invite.url}`,
  )}`;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-rule p-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span
          aria-hidden="true"
          className={`size-3 rounded-full ${
            invite.stone === "black"
              ? "bg-ink"
              : "border border-rule-strong bg-ivory"
          }`}
        />
        {display.label}
        <span className="font-mincho text-muted">{display.kanji}</span>
        {isYours ? (
          <span className="ml-auto rounded-full border border-rule px-2 py-0.5 text-[0.65rem] font-medium">
            You
          </span>
        ) : null}
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element -- a data URL has no origin for next/image to optimise */}
      <img
        src={invite.qr}
        alt={`QR code for the ${display.label} seat`}
        // A QR code is scanned, not themed: it stays white on every background.
        className="w-full max-w-[9rem] self-center rounded-lg bg-white p-1.5"
        width={160}
        height={160}
      />

      <input
        readOnly
        value={invite.url}
        onFocus={(event) => event.target.select()}
        className="w-full rounded-lg border border-rule bg-transparent px-2 py-1 font-mono text-[0.7rem] text-muted"
        aria-label={`${display.label} seat link`}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center rounded-lg border border-rule px-3 py-1.5 text-sm font-medium whitespace-nowrap hover:bg-shade"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={smsHref}
          className="inline-flex items-center justify-center rounded-lg border border-rule px-3 py-1.5 text-sm font-medium whitespace-nowrap hover:bg-shade"
        >
          Text it
        </a>
      </div>
    </div>
  );
}
