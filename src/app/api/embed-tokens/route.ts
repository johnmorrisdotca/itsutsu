import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import {
  DEFAULT_EMBED_TOKEN_DAYS,
  EMBED_TOKEN_PARAM,
  signEmbedToken,
} from "@/lib/auth/embedToken";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { overLimit } from "@/lib/api/rateLimit";

/**
 * Mints a token that lets one site embed the board.
 *
 * The response includes the whole iframe snippet, because that is the thing
 * the operator actually needs to hand over — a bare token still leaves them
 * assembling a URL by hand and getting the parameter name wrong.
 */
const mintSchema = z.object({
  label: z.string().min(1).max(120),
  days: z.coerce.number().int().min(1).max(3650).default(DEFAULT_EMBED_TOKEN_DAYS),
  size: z.coerce.number().int().min(9).max(19).optional(),
  theme: z.string().max(40).optional(),
  /** "data" additionally lets the embed read the summary endpoint. */
  scope: z.enum(["board", "data"]).default("board"),
});

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "embed-token");
    if (tooMany !== null) return tooMany;

    if ((await currentAdmin()) === null) return notFound();

    const parsed = mintSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return badRequest("Invalid embed token options.");

    const token = await signEmbedToken(
      parsed.data.label,
      parsed.data.days,
      parsed.data.scope,
    );
    if (token === null) {
      return serverError("This deployment cannot issue embed tokens.");
    }

    const origin = new URL(request.url).origin;
    const url = new URL("/embed", origin);
    url.searchParams.set(EMBED_TOKEN_PARAM, token);
    if (parsed.data.size !== undefined) {
      url.searchParams.set("size", String(parsed.data.size));
    }
    if (parsed.data.theme !== undefined) {
      url.searchParams.set("theme", parsed.data.theme);
    }
    if (parsed.data.scope === "data") url.searchParams.set("stats", "1");

    return NextResponse.json(
      {
        token,
        url: url.toString(),
        label: parsed.data.label,
        scope: parsed.data.scope,
        expiresInDays: parsed.data.days,
        snippet:
          `<iframe src="${url.toString()}"\n` +
          `        style="border:0;width:100%;height:640px"\n` +
          `        title="Itsutsu"></iframe>`,
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not create an embed token.");
  }
}
