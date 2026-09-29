import { COMPUTER_MARK } from "@/components/puzzles/kumimoji.constants";

import { TRAIN_COPY } from "./party.constants";

/** "Bot", beside a seat a computer plays: the same mark Kumimoji's table gives its computers, so a computer looks the same at every table. */
export function TrainComputerMark() {
  return (
    <span className={COMPUTER_MARK} data-testid="train-computer-mark" title={TRAIN_COPY.computerHelp}>
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2.5" y="5" width="11" height="8" rx="2" />
        <path d="M8 5V2.5M6 9h.01M10 9h.01M6 11.25h4" strokeLinecap="round" />
      </svg>
      Bot
    </span>
  );
}
