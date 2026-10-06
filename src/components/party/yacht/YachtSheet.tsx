import { Fragment } from "react";

import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { YACHT_BOXES, YACHT_UPPER } from "@/lib/party/yacht/yacht.constants";
import { YACHT_PHASES } from "@/lib/party/yacht/yacht";
import { boxScore, sheetTotal, upperBonus, upperTotal } from "@/lib/party/yacht/yachtScore";
import type { YachtGame } from "@/lib/party/yacht/yacht.types";

import { MarbleChip } from "../MarbleChip";
import { yachtBoxWords, yachtWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { seatedName } from "@/lib/party/partyNames";

/**
 * THE SCORE SHEET: a row for every box, a column for every player, the upper
 * half's total and bonus after Sixes, and the grand total at the foot. The
 * player to move's column is shaded; once they have rolled, every empty box
 * of theirs shows what the dice would score there, as a button that writes it
 * down (`onBox`) — so nobody has to work out a full house in their head.
 */
export function YachtSheet({ game, onBox }: { game: YachtGame; onBox?: (box: number) => void }) {
  const say = useSpeaker();
  const YACHT_BOX_WORDS = yachtBoxWords(say.locale);
  const YACHT_COPY = yachtWords(say.locale);
  const playing = game.phase === YACHT_PHASES.playing;
  const choosing = playing && game.rolls > 0 && onBox !== undefined;
  const column = (seat: number) => (playing && seat === game.toPlay ? "bg-rule/50" : "");
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="yacht-sheet">
      <h2 className={SECTION_TITLE}>
        {YACHT_COPY.sheet} {say.pairsWithKanji ? <span className="font-mincho normal-case tracking-normal">得点表</span> : null}
      </h2>
      <div className={TABLE_SCROLL}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1 pr-2 font-normal">{YACHT_COPY.box}</th>
              {game.players.map((_, seat) => (
                <th key={seat} className={`px-1 py-1 text-center font-normal ${column(seat)}`} data-testid="yacht-sheet-player" data-seat={seat}>
                  <span className="flex flex-col items-center gap-0.5">
                    <MarbleChip player={seat} />
                    <span className="max-w-20 truncate">{seatedName(game, seat, say)}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {YACHT_BOXES.map((key, box) => (
              <Fragment key={key}>
                <tr className="border-t border-rule" data-testid="yacht-row" data-box={box}>
                  <th scope="row" className="py-1 pr-2 text-left font-normal">
                    <span className="block leading-tight">{YACHT_BOX_WORDS[key].name}</span>
                    <span className="block text-[0.7rem] leading-tight text-muted" data-yacht-hint>
                      {YACHT_BOX_WORDS[key].hint}
                    </span>
                  </th>
                  {game.sheets.map((sheet, seat) => {
                    const written = sheet[box];
                    const open = choosing && seat === game.toPlay && written === null;
                    return (
                      <td key={seat} className={`px-1 py-0.5 text-center tabular-nums ${column(seat)}`} data-testid="yacht-cell" data-seat={seat} data-box={box} data-score={written ?? undefined}>
                        {open ? (
                          <button
                            type="button"
                            onClick={() => onBox?.(box)}
                            className="yacht-box min-h-9 w-full min-w-9 rounded-md border border-dashed border-shu px-1 font-semibold text-shu hover:bg-shu/10"
                            data-testid="yacht-box"
                            data-box={box}
                            data-would={boxScore(key, game.dice)}
                            aria-label={say.say("party.yacht.boxAria", { score: String(boxScore(key, game.dice)), box: YACHT_BOX_WORDS[key].name })}
                          >
                            {boxScore(key, game.dice)}
                          </button>
                        ) : (
                          (written ?? "")
                        )}
                      </td>
                    );
                  })}
                </tr>
                {box === YACHT_UPPER - 1 ? (
                  <>
                    <tr className="border-t border-rule-strong text-xs text-muted">
                      <th scope="row" className="py-1 pr-2 text-left font-normal">
                        {YACHT_COPY.upper}
                      </th>
                      {game.sheets.map((sheet, seat) => (
                        <td key={seat} className={`px-1 text-center tabular-nums ${column(seat)}`}>
                          {upperTotal(sheet)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-rule text-xs text-muted">
                      <th scope="row" className="py-1 pr-2 text-left font-normal">
                        {YACHT_COPY.bonus}
                      </th>
                      {game.sheets.map((sheet, seat) => (
                        <td key={seat} className={`px-1 text-center tabular-nums ${column(seat)}`} data-testid="yacht-bonus" data-seat={seat}>
                          {upperBonus(sheet) > 0 ? upperBonus(sheet) : ""}
                        </td>
                      ))}
                    </tr>
                  </>
                ) : null}
              </Fragment>
            ))}
            <tr className="border-t-2 border-ink font-semibold">
              <th scope="row" className="py-1 pr-2 text-left">
                {YACHT_COPY.total}
              </th>
              {game.sheets.map((sheet, seat) => (
                <td key={seat} className={`px-1 text-center tabular-nums ${column(seat)}`} data-testid="yacht-total" data-seat={seat} data-total={sheetTotal(sheet)}>
                  {sheetTotal(sheet)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{game.players.length > 1 ? YACHT_COPY.highestWins : YACHT_COPY.alone}</p>
    </section>
  );
}
