"use client";

import { useEffect, useState } from "react";

import { SeatCard } from "@/components/live/SeatCard";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { ONLINE_SEAT_KINDS, ONLINE_STATUS } from "@/lib/party/online/online.constants";
import type { OnlineSeatView, OnlineTableView } from "@/lib/party/online/online.types";
import type { NameTag } from "@/lib/xp/nameTag.types";

import { MarbleChip } from "../MarbleChip";
import { onlineWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { playerNumberName } from "@/lib/gomoku/seatWords";

/**
 * WHO SITS AT THE TABLE, in seat order, with their colour, how each stands in
 * the game, and whose turn it is — a member's name leading to their page, an
 * open seat saying it waits for its link, a computer saying so. Under the list,
 * every open seat's link in the card every seat link on the site is handed
 * over in (`SeatCard`), for anybody at the table to send.
 */
export function OnlineSeats({
  view,
  standing,
  gameLabel,
  tags,
}: {
  view: OnlineTableView;
  standing: (seat: number) => string;
  gameLabel: string;
  /** Each member's flag and badge, read where the page rendered; a member seated since has none until the next load. */
  tags: Readonly<Record<string, NameTag>>;
}) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const open = view.status === ONLINE_STATUS.playing ? view.seats.filter((seat) => seat.link !== null) : [];
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="online-seats">
      <h2 className={SECTION_TITLE}>
        {ONLINE_COPY.seatsHeading} {say.pairsWithKanji ? <span className="font-mincho normal-case tracking-normal">席</span> : null}
      </h2>
      <ol className="flex flex-col gap-1.5">
        {view.seats.map((seat) => (
          <li
            key={seat.seat}
            className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
              seat.seat === view.toPlay && view.status === ONLINE_STATUS.playing ? "bg-rule/60 font-semibold" : ""
            }`}
            data-testid="online-seat"
            data-seat={seat.seat}
            data-kind={seat.kind}
            data-yours={seat.yours ? "true" : undefined}
          >
            <MarbleChip player={seat.seat} />
            <span className="min-w-0 flex-1 truncate">
              <SeatName seat={seat} tag={seat.memberId === null ? undefined : tags[seat.memberId]} />
              {seat.yours ? <span className="text-muted"> {ONLINE_COPY.yours}</span> : null}
            </span>
            <span className="shrink-0 text-xs text-muted tabular-nums">{standing(seat.seat)}</span>
          </li>
        ))}
      </ol>
      {open.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{ONLINE_COPY.sendLink}</p>
          {open.map((seat) => (
            <SeatLink key={seat.seat} seat={seat} gameLabel={gameLabel} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** A seat's name: the member's, leading to their page; or what an open or a computer's seat is. */
function SeatName({ seat, tag }: { seat: OnlineSeatView; tag: NameTag | undefined }) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  // A member's seat, or a computer that is one of the site's programs: the name leads to their page.
  if (seat.kind === ONLINE_SEAT_KINDS.member || (seat.kind === ONLINE_SEAT_KINDS.computer && seat.memberId !== null)) {
    return <PlayerName name={seat.name} memberId={seat.memberId} fallback={playerNumberName(say, seat.seat + 1)} tag={tag} testId="online-seat-name" />;
  }
  if (seat.kind === ONLINE_SEAT_KINDS.computer) return <span>{ONLINE_COPY.computerSeat}</span>;
  return <span className="text-muted italic">{ONLINE_COPY.openSeat}</span>;
}

/**
 * One open seat's link, whole — the page is on this site, the link is an
 * address on it — and its QR code, drawn in this browser: the table's answers
 * carry the link, and a seat left mid-game gets a fresh one the server page
 * never drew.
 */
function SeatLink({ seat, gameLabel }: { seat: OnlineSeatView; gameLabel: string }) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const [qr, setQr] = useState<{ for: string; data: string } | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const url = origin === null || seat.link === null ? null : `${origin}${seat.link}`;

  useEffect(() => {
    const timer = window.setTimeout(() => setOrigin(window.location.origin), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (url === null) return;
    let live = true;
    void import("qrcode").then((made) => made.toDataURL(url, { width: 320, margin: 1 })).then((data) => {
      if (live) setQr({ for: url, data });
    });
    return () => {
      live = false;
    };
  }, [url]);

  if (url === null || qr?.for !== url) return <div className="min-h-[18rem] rounded-xl border border-rule" data-testid="online-seat-link-waiting" />;
  return (
    <div className="w-full max-w-xs" data-width-reason="a seat's card, a QR code with its link under it: the size a phone's camera reads it at, as every seat link on the site is handed over">
      <SeatCard
        url={url}
        qr={qr.data}
        name={ONLINE_COPY.linkName}
        mark={<MarbleChip player={seat.seat} />}
        message={ONLINE_COPY.linkMessage(gameLabel, url)}
        isYours={false}
        testId="online-seat-link"
      />
    </div>
  );
}
