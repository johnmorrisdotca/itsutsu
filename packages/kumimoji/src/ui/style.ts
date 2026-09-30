/**
 * The table's own styles, scoped to `.km-root`, every colour a CSS variable
 * so a page can wear it in its own colours. Light and dark follow the
 * reader's system.
 */
export const KUMIMOJI_STYLE = `
.km-root {
  --km-square: 36px; --km-felt: #2f5d4a; --km-grid-line: rgba(255,255,255,.12); --km-tile: #f3e6c8; --km-tile-ink: #2a2118;
  --km-wild: #f6d27a; --km-wrong: #d9534f; --km-apart: #9aa3a0; --km-held: #ffcf3f; --km-ink: #1f2320; --km-panel: #f7f3ea;
  --km-line: rgba(20,20,20,.35); --km-accent: #2f5d4a; --km-accent-ink: #fff;
  display: grid; gap: 10px; color: var(--km-ink); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 15px;
}
@media (prefers-color-scheme: dark) {
  .km-root { --km-felt: #1e3a2f; --km-ink: #ece8dc; --km-panel: #1d201e; --km-line: rgba(255,255,255,.25); --km-accent: #6fb08f; --km-accent-ink: #10150f; }
}
.km-status { margin: 0; min-height: 1.4em; font-variant-numeric: tabular-nums; }
.km-board { background: var(--km-felt); border-radius: 12px; padding: 10px; overflow: auto; max-height: 70vh; }
.km-grid { display: grid; gap: 2px; width: max-content; margin: 0 auto; }
.km-square { width: var(--km-square); height: var(--km-square); border: 0; border-radius: 5px; background: var(--km-grid-line); padding: 0; cursor: pointer; }
.km-tile { display: grid; place-items: center; width: var(--km-square); height: var(--km-square); border-radius: 6px; border: 0; padding: 0;
  background: var(--km-tile); color: var(--km-tile-ink); font: 700 20px/1 system-ui, sans-serif; text-transform: uppercase;
  box-shadow: 0 2px 0 rgba(0,0,0,.35); cursor: pointer; }
.km-japanese .km-tile { font-size: 19px; text-transform: none; }
.km-wild { background: var(--km-wild); }
.km-misspelt { box-shadow: 0 0 0 3px var(--km-wrong) inset, 0 2px 0 rgba(0,0,0,.35); }
.km-apart { opacity: .6; }
.km-held { outline: 3px solid var(--km-held); outline-offset: 1px; }
.km-notes { margin: 0; min-height: 1.4em; font-size: 14px; opacity: .8; }
.km-hand { display: flex; flex-wrap: wrap; gap: 6px; min-height: 40px; align-items: center; padding: 8px; border-radius: 10px; background: var(--km-panel); }
.km-empty { opacity: .6; font-size: 14px; }
.km-picker { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.km-picker:empty { display: none; }
.km-picker-title { width: 100%; font-size: 14px; }
.km-picker .km-button { padding: 4px 8px; min-width: 32px; text-transform: uppercase; }
.km-japanese .km-picker .km-button { text-transform: none; }
.km-controls { display: flex; flex-wrap: wrap; gap: 8px; }
.km-button { font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--km-line); background: var(--km-panel); color: var(--km-ink); cursor: pointer; }
.km-button:disabled { opacity: .45; cursor: default; }
.km-primary { background: var(--km-accent); color: var(--km-accent-ink); border-color: transparent; }
`;
