import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib";

/**
 * A FILE A SERVER READS IS KEPT PACKED. Every byte of it is in every function
 * that carries it, in every kept deployment, against a storage limit the whole
 * account shares, so it is Brotli at its best setting: the Japanese's 0.47 MB of
 * text is 0.10 MB on disk, and opening it is two milliseconds, once for the life
 * of a server process (`jaText.data.ts`; the others are in `README` of
 * `packedData.coverage.test.ts`).
 *
 * Node only, and imported by nothing a browser reaches. Brotli's output can
 * differ between Node's builds, so a file is compared by what it unpacks to,
 * never by its bytes, and the writers leave a file that already unpacks to the
 * right text alone.
 */
export function packText(json: string): Buffer {
  const text = Buffer.from(json, "utf8");
  return brotliCompressSync(text, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      [constants.BROTLI_PARAM_LGWIN]: constants.BROTLI_MAX_WINDOW_BITS,
      [constants.BROTLI_PARAM_SIZE_HINT]: text.length,
    },
  });
}

export function unpackText(packed: Buffer): string {
  return brotliDecompressSync(packed).toString("utf8");
}
