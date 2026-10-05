import { toDisplay, turnedBox, type Maze } from "@johnmorrisdotca/meikyuu";
import { fitView } from "@johnmorrisdotca/meikyuu/play";

/**
 * A KEPT LINE DRAWN AGAIN ON A BOARD JUST MOUNTED. The package's board has no way to be handed a line that
 * was drawn before (`mountMeikyuu` starts every board empty), so the line is drawn the way a finger draws
 * it: a pointer pressed on the start, taken through the middle of each cell of the line in turn, and lifted.
 * The board follows it by its own rules, so a line that is not a way through the maze is not drawn (a
 * wall stops it), and nothing here can make a state the board could not have been in. The package's own
 * surface treats a pointer it cannot capture (one a script made) as it treats a finger.
 *
 * The board has just been mounted, so it is fitted: the pixel of a cell is worked out from the whole of the
 * maze in the box, as the surface does (`fitView`, its default margin). A tall maze lying down is shown a quarter
 * turn counter-clockwise (`turned`, the board's `data-turned`): the box holds the TURNED maze, so the area fitted is
 * the turned one and every cell is where the package would show it (`turnedBox`, `toDisplay`), and the line is the
 * same line. A box with no room yet (hidden, not laid out) takes none.
 */
export function drawAgain(host: HTMLElement, maze: Maze, cells: readonly number[], turned = false): void {
  const box = host.querySelector<HTMLElement>(".mk-box");
  if (box === null || cells.length === 0) return;
  const rect = box.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;
  const turn = turned ? 1 : 0;
  const view = fitView({ width: rect.width, height: rect.height, area: turnedBox(turn, maze.grid.box) });
  const at = (cell: number): { clientX: number; clientY: number } => {
    const [x, y] = toDisplay(turn, maze.grid.centres[cell]!);
    return { clientX: rect.left + (x - view.x) * view.scale, clientY: rect.top + (y - view.y) * view.scale };
  };
  const send = (type: string, cell: number): void => {
    box.dispatchEvent(new PointerEvent(type, { ...at(cell), pointerId: 4001, pointerType: "touch", isPrimary: true, button: 0, bubbles: true, cancelable: true }));
  };
  send("pointerdown", cells[0]!);
  for (const cell of cells.slice(1)) send("pointermove", cell);
  send("pointerup", cells[cells.length - 1]!);
}
