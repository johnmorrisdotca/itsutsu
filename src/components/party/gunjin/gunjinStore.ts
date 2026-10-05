"use client";

import { GUNJIN_STORAGE_KEY } from "@/lib/party/gunjin/gunjin.constants";
import { resignGunjin } from "@/lib/party/gunjin/gunjin";
import { decodeGunjin, encodeGunjin } from "@/lib/party/gunjin/gunjinCodec";
import type { GunjinGame } from "@/lib/party/gunjin/gunjin.types";
import { GUNJIN_RULES } from "@/lib/party/gunjin/gunjinRules";

import { keptInBrowser } from "../keptInBrowser";
import { partyRecord } from "../keptRules";

/**
 * THE GAME OF GUNJIN KEPT IN THIS BROWSER: one at a time, as its board, its two
 * names and its moves (`encodeGunjin`), written after every move. The text holds
 * both sides' arrangements, so a reload deals nothing again: it replays the
 * moves. A resignation ends the game in the engine's own terms
 * (`resignGunjin`). How it is kept, and why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<GunjinGame>(GUNJIN_STORAGE_KEY, encodeGunjin, decodeGunjin, partyRecord("gunjin", GUNJIN_RULES), resignGunjin);

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptGunjin = kept.useKept;

/** Opens a game filed in the history as this browser's own (`keptStores.ts`). */
export const adoptKeptGunjinGame = kept.adopt;
