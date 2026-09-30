/**
 * The table's own styles, scoped to `.tk-root`, with every colour a CSS
 * variable so a page can wear it in its own colours (set them on the element
 * or any ancestor). Light and dark follow the reader's system.
 */
export const TENKA_STYLE = `
.tk-root {
  --tk-sea: #b9d3dc; --tk-ink: #1f2320; --tk-panel: #f7f3ea; --tk-line: rgba(20,20,20,.55);
  --tk-border: rgba(10,10,10,.8); --tk-link: #1d3440; --tk-accent: #2f5d4a; --tk-accent-ink: #fff;
  display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); color: var(--tk-ink);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 15px;
}
@media (prefers-color-scheme: dark) {
  .tk-root { --tk-sea: #22343b; --tk-ink: #ece8dc; --tk-panel: #1d201e; --tk-link: #e8eef0; --tk-accent: #6fb08f; --tk-accent-ink: #10150f; }
}
@media (min-width: 900px) { .tk-root { grid-template-columns: minmax(0, 1fr) 260px; } }
.tk-main { display: grid; gap: 10px; min-width: 0; }
.tk-status { margin: 0; min-height: 2.6em; }
.tk-zoom { display: flex; flex-wrap: wrap; gap: 6px; }
.tk-zoom .tk-button { padding: 4px 10px; font-size: 13px; }
.tk-zoom [aria-pressed="true"] { background: var(--tk-accent); color: var(--tk-accent-ink); }
.tk-board { border-radius: 10px; overflow: hidden; line-height: 0; background: var(--tk-sea); }
.tk-map { width: 100%; height: auto; display: block; cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; }
.tk-sea { fill: var(--tk-sea); }
.tk-land { fill-opacity: .82; stroke: var(--tk-line); stroke-width: 1.2; }
.tk-land:hover { fill-opacity: 1; }
.tk-borders { stroke: var(--tk-border); stroke-width: 3; stroke-linecap: round; pointer-events: none; }
.tk-sea-link { stroke: var(--tk-link); stroke-width: 2; stroke-dasharray: 8 6; pointer-events: none; }
.tk-counter circle { stroke: #111; }
.tk-counter text { font-family: system-ui, sans-serif; font-weight: 700; fill: #fff; paint-order: stroke; stroke: rgba(0,0,0,.55); }
.tk-controls { display: flex; flex-wrap: wrap; gap: 8px; min-height: 40px; align-items: center; }
.tk-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tk-button { font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--tk-line); background: var(--tk-panel); color: var(--tk-ink); cursor: pointer; }
.tk-primary { background: var(--tk-accent); color: var(--tk-accent-ink); border-color: transparent; }
.tk-dice { min-height: 1.6em; }
.tk-roll { margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.tk-faces { display: inline-flex; gap: 3px; }
.tk-die { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 5px; font-weight: 700; font-size: 13px; }
.tk-attack .tk-die { background: #c8463d; color: #fff; }
.tk-defend .tk-die { background: #f4efe4; color: #1f2320; border: 1px solid #1f2320; }
.tk-side { display: grid; gap: 12px; align-content: start; }
.tk-players { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.tk-player { display: grid; grid-template-columns: 16px 1fr; column-gap: 8px; padding: 6px 8px; border-radius: 8px; background: var(--tk-panel); }
.tk-to-play { outline: 2px solid var(--tk-accent); }
.tk-out { opacity: .45; text-decoration: line-through; }
.tk-marble { width: 14px; height: 14px; border-radius: 50%; grid-row: span 2; align-self: center; border: 1px solid rgba(0,0,0,.4); }
.tk-name { font-weight: 600; }
.tk-count { font-size: 12px; opacity: .75; }
.tk-hand { display: flex; flex-wrap: wrap; gap: 6px; }
.tk-hand-title { width: 100%; margin: 0; font-weight: 600; }
.tk-card { padding: 4px 8px; border-radius: 6px; background: var(--tk-panel); border: 1px solid var(--tk-line); font-size: 12px; text-transform: capitalize; }
`;
