import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { JA_WORDS_3 } from "@johnmorrisdotca/kotoba/kana-3";
import { JA_WORDS_4 } from "@johnmorrisdotca/kotoba/kana-4";
import { JA_WORDS_5 } from "@johnmorrisdotca/kotoba/kana-5";
import { TSUNAGI_LAYOUTS, TSUNAGI_PORTAL_LAYOUTS } from "@johnmorrisdotca/tsunagi/layouts";

import { TENKA_EUROPE_SHAPES, TENKA_SHAPES } from "@/lib/party/tenka/tenkaShapes.browser";
import { SUIDO_LEVEL_BOARDS } from "@/lib/puzzles/suido/levelBoards.data";

import { chainTo, reachOf, sourceGraph } from "../pageFunctionGraph";

import { packText, unpackText } from "./pack";

/*
 * A FILE A SERVER READS INSTEAD OF A MODULE IT IMPORTS.
 *
 * An import is compiled into the build's chunks, and the build makes a copy of
 * a chunk for each group of pages that reaches it and another for each route
 * handler's bundle: Suido's level hashes (97 KB of source) four times over in
 * the pages' function, Tenka's outlines (563 KB) three times, measured
 * 2026-10-06. A file read off disk is one copy whatever reads it, packed with
 * Brotli it is a fifth of the size, and the build's tracer ships it because
 * the reader names it in a string it can follow.
 *
 * Each row is data a SERVER needs. Where a browser needs it too (Suido's level
 * hashes, Tenka's outlines) it keeps the data module it always had and
 * `next.config.ts` swaps the server's reader for it in a browser build
 * (`turbopack.resolveAlias`, `browser`), the way `jaText.server` is swapped:
 * those rows have a `browser` module. Where only a server reads it (Tsunagi's
 * boards, the kana lists: the browser fetches its own, a size at a time) the
 * reader is a module only the server's code imports. Either way the reader is
 * the file's one reader. `pnpm data:pack` writes every file here from its data,
 * and this fails when a file and its data have come apart. The Japanese is the
 * same idea with its own writer (`pnpm i18n:text`).
 *
 * A new row: the data, a reader that names the file literally, the alias in
 * `next.config.ts` if a browser imports the data too, and a line in
 * `pageFunction.coverage.test.ts` saying no page reaches the data.
 */
const ROOT = resolve(__dirname, "../../..");

type Packed = {
  /** In `src/lib/packed/`. */
  file: string;
  /** What the server calls, and where. */
  reader: { path: string; address: string };
  /** What a browser build gets for the address: the data module, or a module beside it. Left out where no browser code imports the reader. */
  browser?: string;
  /** What the file unpacks to. */
  value: () => unknown;
};

const PACKED: readonly Packed[] = [
  {
    file: "suidoLevelBoards.json.br",
    reader: { path: "src/lib/puzzles/suido/levelBoards.ts", address: "@/lib/puzzles/suido/levelBoards" },
    browser: "src/lib/puzzles/suido/levelBoards.browser.ts",
    value: () => SUIDO_LEVEL_BOARDS,
  },
  {
    file: "tenkaShapes.json.br",
    reader: { path: "src/lib/party/tenka/tenkaShapes.data.ts", address: "@/lib/party/tenka/tenkaShapes.data" },
    browser: "src/lib/party/tenka/tenkaShapes.browser.ts",
    value: () => ({ world: TENKA_SHAPES, europe: TENKA_EUROPE_SHAPES }),
  },
  {
    file: "tsunagiLayouts.json.br",
    reader: { path: "src/lib/puzzles/tsunagi/layoutsModule.ts", address: "@/lib/puzzles/tsunagi/layoutsModule" },
    value: () => ({ classic: TSUNAGI_LAYOUTS, portals: TSUNAGI_PORTAL_LAYOUTS }),
  },
  {
    file: "kanaWords.json.br",
    reader: { path: "src/lib/puzzles/gomojiKana/kanaWordsModule.ts", address: "@/lib/puzzles/gomojiKana/kanaWordsModule" },
    value: () => ({ 3: JA_WORDS_3, 4: JA_WORDS_4, 5: JA_WORDS_5 }),
  },
];

const fileOf = (packed: Packed) => resolve(ROOT, "src/lib/packed", packed.file);

describe("the files a server reads in place of a module", () => {
  if (process.env.PACKED_WRITE === "1") {
    it("are rewritten from their data modules (pnpm data:pack)", () => {
      for (const packed of PACKED) {
        const json = JSON.stringify(packed.value());
        // A file that already unpacks to these words stays as it is: Brotli's bytes can differ between Node's builds.
        const now = existsSync(fileOf(packed)) ? unpackText(readFileSync(fileOf(packed))) : null;
        if (now !== json) writeFileSync(fileOf(packed), packText(json));
      }
    });
    return;
  }

  for (const packed of PACKED) {
    describe(packed.file, () => {
      it("unpacks to what its data module holds", () => {
        expect(existsSync(fileOf(packed)), `src/lib/packed/${packed.file} is missing: run pnpm data:pack`).toBe(true);
        expect(unpackText(readFileSync(fileOf(packed))), "run `pnpm data:pack`: the data and the file a server reads have come apart").toBe(JSON.stringify(packed.value()));
        // Nothing the data holds is lost by being written as JSON.
        expect(JSON.parse(JSON.stringify(packed.value()))).toEqual(packed.value());
      });

      it("is read by its reader, by a path the build can follow, and by nothing else", () => {
        const reader = readFileSync(resolve(ROOT, packed.reader.path), "utf8");
        expect(reader, "read it with join(process.cwd(), \"src/lib/packed\", <file name>), both written out: a path the tracer cannot follow ships nothing, or everything").toContain(
          `readFileSync(join(process.cwd(), "src/lib/packed", "${packed.file}"))`,
        );
        const others = sourcesNaming(packed.file).filter((path) => path !== packed.reader.path);
        expect(others, `${packed.file} has one reader; read it through ${packed.reader.path}`).toEqual([]);
      });

      if (packed.browser === undefined) {
        it("is reached by no client component, so no browser build has a file read in it", () => {
          const client = reachOf([...files.values()].filter((file) => file.client).map((file) => file.path));
          expect(client.has(packed.reader.path), `a client component reaches ${packed.reader.path}: ${chainTo(client, packed.reader.path)}`).toBe(false);
        });
      } else {
        it("is imported only by its address, which the browser's alias matches", () => {
          const name = packed.reader.address.split("/").pop()!;
          // A relative import of the reader would miss the alias, and put a file read in the browser's build.
          const offenders = importersOf(name).filter((line) => !line.includes(`"${packed.reader.address}"`));
          expect(offenders, `import ${name} by "${packed.reader.address}" and no other way`).toEqual([]);
        });

        it("has a browser build swap its reader for the data module, which answers every call the reader does", () => {
          const config = readFileSync(resolve(ROOT, "next.config.ts"), "utf8");
          const alias = new RegExp(`"${packed.reader.address.replace(/[/@.]/g, "\\$&")}":\\s*\\{\\s*browser:\\s*"\\./${packed.browser!.replace(/[/.]/g, "\\$&")}"`);
          expect(config, `next.config.ts has no turbopack.resolveAlias taking ${packed.reader.address} to ${packed.browser} in a browser build`).toMatch(alias);
          const exported = [...readFileSync(resolve(ROOT, packed.reader.path), "utf8").matchAll(/^export function (\w+)/gm)].map((match) => match[1]!);
          const browser = readFileSync(resolve(ROOT, packed.browser!), "utf8");
          expect(exported.length).toBeGreaterThan(0);
          for (const fn of exported) expect(browser, `${packed.browser} must export ${fn}, as ${packed.reader.path} does`).toMatch(new RegExp(`export function ${fn}\\b`));
        });
      }
    });
  }
});

const files = sourceGraph();

/** The source files, tests apart, that write `text` anywhere in them. */
function sourcesNaming(text: string): string[] {
  return [...files.values()].filter((file) => readFileSync(resolve(ROOT, file.path), "utf8").includes(text)).map((file) => file.path);
}

function importersOf(name: string): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(?:ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
        for (const line of readFileSync(path, "utf8").split("\n")) if (new RegExp(`from\\s+["'][^"']*/${name}["']`).test(line)) found.push(`${path}: ${line.trim()}`);
      }
    }
  };
  walk(resolve(ROOT, "src"));
  return found;
}
