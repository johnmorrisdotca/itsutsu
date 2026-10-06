import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { partyPlayerName } from "@/lib/party/partyNames";
import { GHOST_PHASE, GHOST_WORD, ghostLettersOf, ghostStillIn } from "@/lib/party/superghost/superghost";

import { MarbleChip } from "./MarbleChip";
import type { GhostPlayersProps } from "./party.types";
import { ghostWords, partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * EVERYBODY AT THE TABLE, in turn order, each with the letters of the ghost
 * they hold — G, H, O, S, T in English, お, ば, け, だ, ぞ in Japanese — written
 * out in full, the ones taken in ink and the ones still to come faint. The one
 * whose turn it is is marked.
 *
 * Nothing here is said by colour alone: a player's marble carries their
 * letter, the letters taken are filled AND written, and a player who is out
 * is greyed, struck through and labelled Out.
 */
export function GhostPlayers({ game, room = 0 }: GhostPlayersProps) {
  const say = useSpeaker();
  const GHOST_COPY = ghostWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const word = [...GHOST_WORD[game.language]];
  const playing = game.phase !== GHOST_PHASE.finished;
  const rows = Math.max(room, game.players.length);
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="ghost-players">
      <h2 className={SECTION_TITLE}>
        {GHOST_COPY.table} {say.pairsWithKanji ? <span className="font-mincho normal-case tracking-normal">席</span> : null}
      </h2>
      <ol className="flex flex-col gap-1.5">
        {Array.from({ length: rows }, (_, seat) => {
          if (seat >= game.players.length) return <li key={seat} className="invisible h-8" aria-hidden="true" />;
          const name = partyPlayerName(game, seat, say);
          const out = !ghostStillIn(game, seat);
          const held = game.letters[seat];
          const current = playing && seat === game.toPlay;
          return (
            <li
              key={seat}
              className={`flex min-h-8 items-center gap-2 rounded-md px-2 py-1 text-sm ${current ? "bg-rule/60 font-semibold" : ""} ${out ? "opacity-55" : ""}`}
              data-testid="ghost-player"
              data-player={seat}
              data-letters={held}
              data-out={out ? "true" : undefined}
              aria-label={`${GHOST_COPY.lettersLeft(name, ghostLettersOf(game, seat))}${out ? `, ${GHOST_COPY.out}` : ""}`}
            >
              <MarbleChip player={seat} />
              <span className={`min-w-0 flex-1 truncate ${out ? "line-through" : ""}`} data-testid="ghost-player-name">
                {name}
              </span>
              {out ? (
                <span className="shrink-0 rounded border border-rule-strong px-1 text-[0.65rem] font-semibold tracking-wide uppercase" data-testid="ghost-out">
                  {GHOST_COPY.out}
                </span>
              ) : null}
              <span className="flex shrink-0 gap-0.5" aria-hidden="true" data-testid="ghost-letters">
                {word.map((letter, at) => (
                  <span
                    key={at}
                    className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-bold ${
                      at < held ? "border-ink bg-ink text-paper" : "border-dashed border-rule-strong text-muted/60"
                    }`}
                    data-taken={at < held ? "true" : undefined}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted">
        {GHOST_COPY.rounds(game.rounds.length)} {GHOST_COPY.outAt} {PARTY_COPY.kept}
      </p>
    </section>
  );
}
