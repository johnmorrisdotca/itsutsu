import { NextResponse } from "next/server";

/**
 * One shape for every error this API returns, so a client can rely on
 * `error` being there and on `details` being present only for a 422.
 */
export type ApiError = {
  error: string;
  details?: unknown;
};

export function badRequest(message = "Invalid request."): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unprocessable(
  message: string,
  details?: unknown,
): NextResponse<ApiError> {
  return NextResponse.json({ error: message, details }, { status: 422 });
}

export function notFound(message = "Not found."): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** Somebody else's live claim is in the way — retryable once it is released or lapses. */
export function conflict(message: string): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function serverError(message = "Something went wrong."): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status: 500 });
}

/** History changes every time a game is recorded, so nothing here is cached. */
export const NO_STORE = { "Cache-Control": "no-store" } as const;

/** Reads a JSON body without letting malformed input throw past the route. */
export async function readJson(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
