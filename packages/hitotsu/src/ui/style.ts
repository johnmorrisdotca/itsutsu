/**
 * The table's look, injected once per document. Every colour is a CSS
 * variable with a default, so a host page restyles it by setting variables on
 * the element it mounts into (or any ancestor) and never by overriding rules.
 */
export const STYLE_ID = "hitotsu-style";

export const CSS = `
.ht-root {
  --ht-surface: #fbf8f1; --ht-ink: #1f2320; --ht-muted: #6b6f68; --ht-rule: #ddd6c6;
  --ht-felt: #2f5d4a; --ht-felt-deep: #1f4135; --ht-felt-ink: #f3efe4;
  --ht-accent: #b5452c; --ht-accent-ink: #fff; --ht-playable: #f2c14e;
  --ht-radius: 16px; --ht-card: 72px; --ht-font: inherit;
  font-family: var(--ht-font); color: var(--ht-ink); display: grid; gap: 12px;
  -webkit-tap-highlight-color: transparent;
}
@media (prefers-color-scheme: dark) {
  .ht-root:not([data-theme="light"]) {
    --ht-surface: #1d201e; --ht-ink: #ece8dc; --ht-muted: #a09d93; --ht-rule: #3a3d38;
    --ht-felt: #214337; --ht-felt-deep: #152c24;
  }
}
.ht-root *, .ht-root *::before, .ht-root *::after { box-sizing: border-box; }
.ht-root button { font: inherit; color: inherit; cursor: pointer; }
.ht-root button:focus-visible { outline: 3px solid var(--ht-accent); outline-offset: 2px; }
.ht-seats { display: flex; flex-wrap: wrap; gap: 8px; }
.ht-seat { flex: 1 1 110px; padding: 8px 10px; border: 1px solid var(--ht-rule); border-radius: 12px; background: var(--ht-surface); display: grid; gap: 2px; }
.ht-seat[data-turn] { border-color: var(--ht-accent); box-shadow: 0 0 0 2px var(--ht-accent); }
.ht-seat b { font-size: .95rem; }
.ht-seat span { font-size: .8rem; color: var(--ht-muted); }
.ht-felt { position: relative; border-radius: var(--ht-radius); background: radial-gradient(circle at 50% 40%, var(--ht-felt), var(--ht-felt-deep)); color: var(--ht-felt-ink); padding: 18px 16px; display: grid; justify-items: center; gap: 10px; }
.ht-piles { display: flex; align-items: center; gap: 22px; }
.ht-card { display: block; width: var(--ht-card); aspect-ratio: 5 / 7; border-radius: 9% / 6.5%; box-shadow: 0 1px 3px rgba(0,0,0,.4); }
.ht-card svg { display: block; width: 100%; height: 100%; }
.ht-piles .ht-card { width: calc(var(--ht-card) * 1.25); }
.ht-stock { display: grid; justify-items: center; gap: 4px; font-size: .75rem; opacity: .85; background: none; border: 0; padding: 0; }
.ht-stock:disabled { cursor: default; }
.ht-dir { font-size: 1.6rem; opacity: .8; }
.ht-status { margin: 0; font-weight: 600; text-align: center; }
.ht-news { margin: 0; min-height: 1.3em; font-size: .85rem; opacity: .85; text-align: center; }
.ht-hand { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; padding-top: 6px; }
.ht-hand button { padding: 0; border: 0; background: none; border-radius: 9% / 6.5%; transition: transform .12s; }
.ht-hand button[data-playable] { transform: translateY(-6px); }
.ht-hand button[data-playable] .ht-card { box-shadow: 0 0 0 3px var(--ht-playable), 0 3px 6px rgba(0,0,0,.4); }
.ht-hand button:disabled { cursor: default; }
.ht-hand button:disabled .ht-card { filter: saturate(.55) brightness(.92); }
.ht-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; min-height: 42px; }
.ht-actions button { border: 1px solid var(--ht-rule); background: var(--ht-surface); border-radius: 999px; padding: 8px 16px; }
.ht-actions button[data-strong] { background: var(--ht-accent); color: var(--ht-accent-ink); border-color: var(--ht-accent); }
.ht-actions button[data-on] { background: var(--ht-ink); color: var(--ht-surface); }
.ht-actions button[data-colour] { color: #fff; border-color: transparent; }
@media (prefers-reduced-motion: reduce) { .ht-hand button { transition: none; } }
`;

export function injectStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID) !== null) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.append(style);
}
