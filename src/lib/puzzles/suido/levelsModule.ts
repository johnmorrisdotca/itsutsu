import { readSuidoLevelsWith } from "./levels";

/**
 * SUIDO'S LEVELS WHERE THERE IS NO BROWSER: a unit test and a browser spec's own
 * process, which play a level where a server only names it (`levels.ts`, `levelBoards.data.ts`).
 * Importing this module is what lets `loadSuidoLevelsAt` answer there. No page
 * imports it, and no server: a function that did would carry a megabyte of boards
 * (`pageFunction.coverage.test.ts`).
 */
readSuidoLevelsWith(async (key) => {
  // Named one by one, so each size is its own chunk.
  if (key === "5x5") return (await import("@johnmorrisdotca/suido/levels-5x5")).SUIDO_5X5;
  if (key === "6x6") return (await import("@johnmorrisdotca/suido/levels-6x6")).SUIDO_6X6;
  if (key === "7x7") return (await import("@johnmorrisdotca/suido/levels-7x7")).SUIDO_7X7;
  if (key === "8x8") return (await import("@johnmorrisdotca/suido/levels-8x8")).SUIDO_8X8;
  if (key === "9x9") return (await import("@johnmorrisdotca/suido/levels-9x9")).SUIDO_9X9;
  if (key === "10x10") return (await import("@johnmorrisdotca/suido/levels-10x10")).SUIDO_10X10;
  if (key === "11x11") return (await import("@johnmorrisdotca/suido/levels-11x11")).SUIDO_11X11;
  if (key === "12x12") return (await import("@johnmorrisdotca/suido/levels-12x12")).SUIDO_12X12;
  if (key === "13x13") return (await import("@johnmorrisdotca/suido/levels-13x13")).SUIDO_13X13;
  if (key === "14x14") return (await import("@johnmorrisdotca/suido/levels-14x14")).SUIDO_14X14;
  if (key === "20x20") return (await import("@johnmorrisdotca/suido/levels-20x20")).SUIDO_20X20;
  if (key === "28x28") return (await import("@johnmorrisdotca/suido/levels-28x28")).SUIDO_28X28;
  if (key === "5x7") return (await import("@johnmorrisdotca/suido/levels-5x7")).SUIDO_5X7;
  if (key === "6x10") return (await import("@johnmorrisdotca/suido/levels-6x10")).SUIDO_6X10;
  if (key === "8x14") return (await import("@johnmorrisdotca/suido/levels-8x14")).SUIDO_8X14;
  if (key === "20x50") return (await import("@johnmorrisdotca/suido/levels-20x50")).SUIDO_20X50;
  throw new Error(`Suido has no ${key} levels.`);
});
