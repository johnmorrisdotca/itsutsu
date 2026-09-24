"use client";

import { useState, type ReactNode } from "react";

import { Paired } from "@/components/i18n/Paired";
import type { Stone } from "@/lib/gomoku/gomoku.types";

/**
 * ONE SEAT'S LINK, TO SEND: its name, a QR code, the address, Copy and Text.
 *
 * The one way a seat is handed to somebody on this site — a game's seat links
 * (`InvitePanel`) and a puzzle race's other seat (`RaceControls`) draw this.
 * The race first drew a box of its own, a dashed border round the bare path,
 * the same day the puzzles' own size picture was found beside the site's
 * (John: "Why does those size boards look different than every other single
 * size board we have ever created").
 *
 * `qr` is a data-URL PNG of `url`, made on the server. `message` is what the
 * phone's own messaging app opens with, through `sms:`: no account, no
 * gateway and no number stored anywhere. `stone`, for a game's seat, is kept
 * on the card as `data-stone`, which is how a spec tells the two apart.
 */
export function SeatCard({
  url,
  qr,
  name,
  mark,
  message,
  isYours,
  stone,
  testId = "seat-invite",
}: {
  url: string;
  qr: string;
  name: { en: string; kanji: string };
  /** A small picture before the name: a game seat's stone; nothing for a race. */
  mark: ReactNode;
  message: string;
  isYours: boolean;
  stone?: Stone;
  testId?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the link is on screen either way.
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-rule p-3" data-testid={testId} data-stone={stone}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        {mark}
        <Paired en={name.en} kanji={name.kanji} kanjiClassName="text-muted" />
        {isYours ? (
          <span className="ml-auto rounded-full border border-rule px-2 py-0.5 text-[0.65rem] font-medium">
            You
          </span>
        ) : null}
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element -- a data URL has no origin for next/image to optimise */}
      <img
        src={qr}
        alt={`QR code for the ${name.en} seat`}
        // A QR code is scanned, not themed: it stays white on every background.
        className="w-full max-w-[9rem] self-center rounded-lg bg-white p-1.5"
        width={160}
        height={160}
      />

      <input
        readOnly
        value={url}
        onFocus={(event) => event.target.select()}
        className="w-full rounded-lg border border-rule bg-transparent px-2 py-1 font-mono text-[0.7rem] text-muted"
        aria-label={`${name.en} seat link`}
        data-testid={`${testId}-address`}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center rounded-lg border border-rule px-3 py-1.5 text-sm font-medium whitespace-nowrap hover:bg-shade"
          data-testid={`${testId}-copy`}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={`sms:?&body=${encodeURIComponent(message)}`}
          className="inline-flex items-center justify-center rounded-lg border border-rule px-3 py-1.5 text-sm font-medium whitespace-nowrap hover:bg-shade"
        >
          Text it
        </a>
      </div>
    </div>
  );
}
