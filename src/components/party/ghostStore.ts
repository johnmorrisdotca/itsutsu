"use client";

import { resignGhost } from "@/lib/party/resignTables";
import { decodeGhost, encodeGhost } from "@/lib/party/superghost/superghost";
import type { GhostGame } from "@/lib/party/superghost/superghost.types";

import { keptInBrowser } from "./keptInBrowser";
import { GHOST_STORAGE_KEY } from "./party.constants";
import { SUPERGHOST_RULES } from "@/lib/party/superghost/ghostRules";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { partyRecord } from "./keptRules";

/**
 * THE GAME OF SUPERGHOST KEPT IN THIS BROWSER: one at a time, as its table and
 * its moves round by round (`encodeGhost`), written after every move. Read
 * back with the verdicts it was played with, so My games can show it without
 * fetching a word list. How it is kept, and why only here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<GhostGame>(GHOST_STORAGE_KEY, encodeGhost, decodeGhost, partyRecord(PARTY_KINDS.superghost, SUPERGHOST_RULES), resignGhost);

/** Write a game down, or forget the kept one; everybody reading it hears. */
export const keepGhostGame = kept.keep;

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptGhostGame = kept.useKept;
export const adoptKeptGhostGame = kept.adopt;
