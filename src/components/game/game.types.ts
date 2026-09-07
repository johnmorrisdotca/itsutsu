import type { GameSettings, GameState } from "@/lib/gomoku/gomoku.types";

export type GamePanelProps = {
  state: GameState;
  onUndo: () => void;
  onReset: (settings?: Partial<GameSettings>) => void;
};
