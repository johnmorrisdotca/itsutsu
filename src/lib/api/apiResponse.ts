import { NextResponse } from "next/server";

import { said } from "./refusal";
import type { RefusalCode, RefusalPart, RefusalValues, Said } from "./refusal.types";

/**
 * One shape for every error this API returns, so a client can rely on
 * `error` being there and on `details` being present only for a 422.
 *
 * `error` is the sentence in English, for a caller that is not a page. `code` and `values` are the same refusal as a
 * phrase key and what fills it, and a page says that in the reader's language (`refusalText.ts`, ENJA-13). No route
 * types a sentence: it names the key.
 */
export type ApiError = Said & {
  details?: unknown;
  /** A machine word for which refusal this is, where a client switches on it (`taken`, `finished`). */
  reason?: string;
};

type Extras = { details?: unknown; reason?: string; headers?: HeadersInit };

/** A refusal with its status: the one door every refusal goes through. */
export function refuse(
  status: number,
  code: RefusalCode,
  values?: RefusalValues,
  extras: Extras = {},
): NextResponse<ApiError> {
  const { headers, ...rest } = extras;
  return NextResponse.json({ ...said(code, values), ...rest }, { status, headers });
}

/**
 * An operator's route keeps its words in English: it is read by the one person who runs the site, and the gate lists
 * those routes (`src/app/api/admin` and the few beside it) as operator-only. It has no key and so no `code`.
 */
export function operatorRefusal(status: number, message: string, details?: unknown): NextResponse<{ error: string; details?: unknown }> {
  return NextResponse.json({ error: message, details }, { status });
}

/** A refusal a library handed back as a key and values only: the route gives it its status. */
export function refuseWith(status: number, part: RefusalPart, extras: Extras = {}): NextResponse<ApiError> {
  return refuse(status, part.code, part.values, extras);
}

export function badRequest(code: RefusalCode = "err.invalid", values?: RefusalValues): NextResponse<ApiError> {
  return refuse(400, code, values);
}

export function unprocessable(
  code: RefusalCode,
  details?: unknown,
  values?: RefusalValues,
): NextResponse<ApiError> {
  return refuse(422, code, values, { details });
}

export function notFound(code: RefusalCode = "err.notFound", values?: RefusalValues): NextResponse<ApiError> {
  return refuse(404, code, values);
}

/** Somebody else's live claim is in the way — retryable once it is released or lapses. */
export function conflict(code: RefusalCode, values?: RefusalValues): NextResponse<ApiError> {
  return refuse(409, code, values);
}

export function serverError(code: RefusalCode = "err.wrong", values?: RefusalValues): NextResponse<ApiError> {
  return refuse(500, code, values);
}

/** History changes every time a game is recorded, so nothing here is cached. */
export const NO_STORE = { "Cache-Control": "no-store" } as const;

export { REVALIDATE } from "./cacheControl.data";

/** Reads a JSON body without letting malformed input throw past the route. */
export async function readJson(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
