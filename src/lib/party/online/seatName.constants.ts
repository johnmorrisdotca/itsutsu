import { ONLINE_COPY } from "@/components/party/online/online.constants";

/**
 * What a computer's seat is called at a table when its game gives it no name of its own: the NAME it is stored under,
 * and the mark `onlineSeatName.ts` and `partyNames.ts` compare against to draw the reader's own word for it (`コンピュータ`
 * for a reader of Japanese). It is the English of that word, read from the table that holds it, and it is never shown
 * as it is. Rows keep what was written, so changing that word needs a look at the rows that already hold the old one.
 */
export const COMPUTER_SEAT_NAME = ONLINE_COPY.computerSeat;
