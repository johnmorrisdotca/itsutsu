/**
 * Sumilabu's caps, as `sumilabu-dashboard/src/lib/board/rules.ts` has them at
 * 36b3df5 (`TICKET_LIMITS`), plus the import route's own id cap (`rowSchema`,
 * `id: z.string().min(1).max(64)`). Read from that file rather than
 * remembered. The service refuses a row past any of them by name, so a row is
 * brought inside them here and its untrimmed text kept in the archive.
 *
 * They equal Itsutsu's own caps in `backlog.constants.ts` today and are kept
 * apart on purpose: these say what the other end accepts, and a change on one
 * side must not quietly move the other.
 */
export const SUMILABU_TICKET_LIMITS = {
  titleMin: 8,
  title: 120,
  detail: 4000,
  askedBy: 60,
  claimedBy: 80,
  releasedIn: 40,
  key: 80,
  id: 64,
} as const;

/** Sumilabu's `TICKET_KEY_PATTERN`: lower-case letters and digits joined by single hyphens. */
export const SUMILABU_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Rows per `POST tickets/import`. The service takes up to 1,000; half that keeps one refusal readable. */
export const IMPORT_BATCH_SIZE = 500;

/**
 * The key `targetTakesKeys` asks for. Nobody holds it; what matters is the
 * shape of the answer (see that function).
 */
export const KEY_PROBE = "board-export-key-probe";

/** Who the import is written as when `--by` names nobody. */
export const EXPORT_ACTOR = "board-export";

/** What `BOARD_EXPORT_SOURCE` says when the rows came from production, set by `board:export:prod` only. */
export const PRODUCTION_SOURCE = "production";
