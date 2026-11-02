"use client";

import { GameName } from "@/components/games/GameName";
import { PartyTableCard } from "@/components/party/PartyTableCard";

import { passAndPlayPath } from "@/lib/gomoku/slugs";
import type { SugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";
import { sugorokuOver, sugorokuToPlay } from "@/lib/party/sugoroku/sugorokuTable";
import { sugorokuNames, sugorokuScoreWords } from "@/lib/party/sugoroku/sugorokuWords";

import { useKeptSugoroku } from "./sugorokuStore";
import { partyScreenWords, sugorokuScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A MATCH OF ONE OF THE SEVEN, WAITING IN MY GAMES. "Anything a person plays is
 * kept until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games. Only while it is not finished.
 */
export function SugorokuCard({ kind }: { kind: SugorokuKind }) {
  const say = useSpeaker();
  const PARTY_COPY = partyScreenWords(say.locale);
  const SUGOROKU_COPY = sugorokuScreenWords(say.locale);
  const [table] = useKeptSugoroku(kind);
  if (table === undefined || table === null || sugorokuOver(table)) return null;
  const to = sugorokuToPlay(table);
  return (
    <PartyTableCard thumb={kind} heading={SUGOROKU_COPY.card} href={passAndPlayPath(kind)} resume={PARTY_COPY.resume} dataVariant={kind}>
      <GameName variant={kind} /> · {sugorokuScoreWords(table, say)}
      {to === null ? "" : ` · ${say.say("party.toPlay", { name: sugorokuNames(table, say)[to] })}`}
    </PartyTableCard>
  );
}
