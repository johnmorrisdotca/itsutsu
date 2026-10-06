"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { stoneName } from "@/lib/gomoku/seatWords";
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
  const say = useSpeaker();
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
      <SectionTitle kanji="招待">{say.say("live.inviteTitle")}</SectionTitle>
      <p className="text-xs text-muted">{say.say("live.inviteBody")}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {invites.map((invite) => (
          <SeatCard
            key={invite.stone}
            url={invite.url}
            qr={invite.qr}
            name={{ en: stoneName(say, invite.stone), kanji: STONE_DISPLAY[invite.stone].kanji }}
            mark={<StoneDot stone={invite.stone} />}
            message={say.say("live.inviteMessage", { colour: stoneName(say, invite.stone), url: invite.url })}
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
