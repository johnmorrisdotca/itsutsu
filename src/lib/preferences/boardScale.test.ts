import { describe, expect, it } from "vitest";

import { BOARD_SCALES, DEVICE_CLASS_LIST, boardScaleName, deviceClassOf, keptScalesFrom, scaleFor, scalesFrom } from "./boardScale";
import { SCALE_EDGE_PX, SCALE_GUTTER_PX, scaledPlayWidths, type ScaleMeasure } from "./boardScaleFit";
import { acceptPreferences, cleanPreferences } from "./preferences";
import { PREFERENCE_SPECS } from "./preferences.constants";

describe("the kinds of screen a board size is kept for", () => {
  it("are told apart by the window's width, and a phone or tablet is none of them", () => {
    expect(deviceClassOf(390)).toBeNull();
    expect(deviceClassOf(1023)).toBeNull();
    expect(deviceClassOf(1024)).toBe("laptop");
    expect(deviceClassOf(1280)).toBe("laptop");
    expect(deviceClassOf(1439)).toBe("laptop");
    expect(deviceClassOf(1440)).toBe("desk");
    expect(deviceClassOf(1919)).toBe("desk");
    expect(deviceClassOf(1920)).toBe("wide");
    expect(deviceClassOf(3840)).toBe("wide");
    expect(deviceClassOf(Number.NaN)).toBeNull();
  });

  it("each has a registry row, so /api/me keeps a choice for one and refuses a size that is not offered", () => {
    for (const device of DEVICE_CLASS_LIST) expect(Object.hasOwn(PREFERENCE_SPECS, boardScaleName(device))).toBe(true);
    expect(acceptPreferences({ "boardScale.desk": "large" })).toEqual({ ok: true, patch: { "boardScale.desk": "large" } });
    expect(acceptPreferences({ "boardScale.desk": "huge" }).ok).toBe(false);
    // The four sizes the live board alone used to offer are a key nobody declares now.
    expect(Object.hasOwn(PREFERENCE_SPECS, "boardSize")).toBe(false);
  });

  it("keeps one choice a kind of screen, and a kind never chosen for is absent rather than Regular", () => {
    const kept = keptScalesFrom(cleanPreferences({ "boardScale.desk": "large", "boardScale.wide": "full", boardSize: "large" }));
    expect(kept).toEqual({ desk: "large", wide: "full" });
    expect(scaleFor(kept, "desk")).toBe(BOARD_SCALES.large);
    expect(scaleFor(kept, "wide")).toBe(BOARD_SCALES.full);
    expect(scaleFor(kept, "laptop")).toBe(BOARD_SCALES.regular);
    // Below a laptop's width nothing applies, whatever is kept.
    expect(scaleFor(kept, null)).toBe(BOARD_SCALES.regular);
  });

  it("reads a browser's own keeping for a reader with no account, and nothing from anything else", () => {
    expect(scalesFrom({ laptop: "full", desk: "nonsense" })).toEqual({ laptop: "full" });
    expect(scalesFrom(null)).toEqual({});
    expect(scalesFrom(["full"])).toEqual({});
    expect(scalesFrom("full")).toEqual({});
  });
});

describe("how wide the play is drawn at Large and Full", () => {
  // A 16×16 Number Place at 1920×1080 with its controls beside it: a square drawing, 448 pixels of side matter.
  const desk: ScaleMeasure = {
    regularDrawing: 540,
    play: 1024,
    column: 576,
    drawing: { width: 540, height: 540 },
    above: 40,
    below: 10,
    window: { width: 1905, height: 1080 },
  };

  it("fits Full to the window's height when that is the tighter, and Large halfway between", () => {
    const widths = scaledPlayWidths(desk)!;
    const tall = 1080 - SCALE_EDGE_PX - 40 - 10;
    expect(widths.full.play).toBe(Math.round(tall + 36 + 448));
    expect(widths.full.grow).toBeCloseTo(tall / 540, 2);
    expect(widths.large.play).toBe(Math.round((540 + tall) / 2 + 36 + 448));
    expect(widths.large.play).toBeGreaterThan(1024);
    expect(widths.full.play).toBeGreaterThan(widths.large.play);
  });

  it("fits Full to the window's width when that is the tighter, with a gutter each side", () => {
    const narrow = scaledPlayWidths({ ...desk, window: { width: 1100, height: 1400 } })!;
    expect(narrow.full.play).toBe(1100 - 2 * SCALE_GUTTER_PX);
  });

  it("never draws a board smaller than Regular's, even in a window with no more room", () => {
    const short = scaledPlayWidths({ ...desk, window: { width: 1280, height: 500 } })!;
    expect(short.full.grow).toBe(1);
    expect(short.large.grow).toBe(1);
    expect(short.full.play).toBe(540 + 36 + 448);
  });

  it("answers nothing, rather than a size, when there was nothing to measure", () => {
    expect(scaledPlayWidths({ ...desk, drawing: { width: 0, height: 0 } })).toBeNull();
    expect(scaledPlayWidths({ ...desk, regularDrawing: 0 })).toBeNull();
  });
});
