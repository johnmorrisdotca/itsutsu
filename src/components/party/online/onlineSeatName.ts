import { COMPUTER_SEAT_NAME, ONLINE_SEAT_KINDS } from "@/lib/party/online/online.constants";

/**
 * A SEAT'S NAME AS THE READER IS TOLD IT: the name the seat was given, or when it was given none, or is a
 * computer's under the site's own default name (`COMPUTER_SEAT_NAME`, kept with the table in English), what the
 * reader's language calls that place: `fallback` for a person's seat, `computerLabel` for a computer's.
 */
export function onlineSeatName(seat: { name: string; kind: string; memberId: string | null }, fallback: string, computerLabel: string): string {
  if (seat.kind === ONLINE_SEAT_KINDS.computer && seat.memberId === null && (seat.name === "" || seat.name === COMPUTER_SEAT_NAME)) return computerLabel;
  return seat.name || (seat.kind === ONLINE_SEAT_KINDS.computer ? computerLabel : fallback);
}
