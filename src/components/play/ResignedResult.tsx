import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { resignedBy, resignWinners } from "@/lib/party/resign";

import { GAME_ENDING_COPY } from "./gameEnding.constants";

/**
 * HOW A TABLE ENDED WHEN SOMEBODY RESIGNED, in the place its turn line stood:
 * "Ann resigned. Ben wins." at two seats, "Ann resigned. The game ended where
 * it stood, with nobody the winner." at more (`lib/party/resign.ts`). The
 * engine's own ending line says how its game is won, which this was not.
 */
export function ResignedResult({ game, seats, nameOf }: { game: object; seats: number; nameOf: (seat: number) => string }) {
  const resigned = resignedBy(game);
  if (resigned === null) return null;
  const winners = resignWinners(seats, resigned).map(nameOf);
  return (
    <p className={`${PANEL_CLASS} text-base font-semibold`} data-testid="game-resigned-result" data-winners={resignWinners(seats, resigned).join(",")} aria-live="polite">
      {GAME_ENDING_COPY.resignedResult(nameOf(resigned), winners)}
    </p>
  );
}
