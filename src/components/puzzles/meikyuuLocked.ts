/**
 * WHAT A FINISHED MAZE REFUSES. The board's own keys take the line back (Ctrl or Cmd with Z, Backspace, Delete), which on a finished maze would
 * unsolve what the page has already handed in. A finished maze is a map to be read, so every touch and the wheel still reach it (the view is the reader's);
 * only these keys are stopped, on the way down to the board, and every other key (Esc leaving Just the board among them) goes on as it was.
 */
export function takesLineBack(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey">): boolean {
  if (event.key === "Backspace" || event.key === "Delete") return true;
  return (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
}

/** Stops those keys at `column`, above the board, in the capture phase; returns what takes the stop away. */
export function shutUndo(column: HTMLElement | null): (() => void) | undefined {
  if (column === null) return undefined;
  const stop = (event: KeyboardEvent): void => {
    if (!takesLineBack(event)) return;
    event.stopPropagation();
    event.preventDefault();
  };
  column.addEventListener("keydown", stop, true);
  return () => column.removeEventListener("keydown", stop, true);
}
