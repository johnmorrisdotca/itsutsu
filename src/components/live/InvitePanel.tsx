"use client";

import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { SectionTitle } from "@/components/ui/Controls";
import { SeatCard } from "./SeatCard";
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
        Send a player their own link. Whoever opens it plays that colour, so it
        is only shown while the seat is still waiting for somebody — once
        they have sat down it is their credential, not an invitation.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {invites.map((invite) => (
          <SeatCard
            key={invite.stone}
            url={invite.url}
            qr={invite.qr}
            name={{ en: STONE_DISPLAY[invite.stone].label, kanji: STONE_DISPLAY[invite.stone].kanji }}
            mark={<StoneDot stone={invite.stone} />}
            message={`Your seat in our gomoku game (${STONE_DISPLAY[invite.stone].label}): ${invite.url}`}
            isYours={invite.stone === yourStone}
            stone={invite.stone}
          />
        ))}
      </div>
    </section>
  );
}

/** The seat's colour, as the small stone beside its name. */
function StoneDot({ stone }: { stone: Stone }) {
  return (
    <span
      aria-hidden="true"
      className={`size-3 rounded-full ${stone === "black" ? "bg-ink" : "border border-rule-strong bg-ivory"}`}
    />
  );
}
