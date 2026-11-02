import { english } from "@/lib/api/refusal";

/**
 * The page a stranger is shown when this deployment is in production with nothing to verify a session with
 * (`refuseUnconfigured` in `src/proxy.ts`, which says why it refuses rather than lets the request through).
 *
 * In the site's English whatever the reader's language: it is for the operator, who is told to check the environment
 * and redeploy, and it is plain HTML with no script and nothing read from the request or the disk, since it is what is
 * served when the site cannot trust itself. A stranger cannot act on it, and it says nothing about which variable is
 * missing. Its words are phrases like any other refusal's.
 */
export const NOT_CONFIGURED_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="robots" content="noindex" />
<title>${english("err.notConfigured.title")}</title>
</head>
<body style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; padding: 0 1.5rem; line-height: 1.6;">
<h1 style="font-size: 1.25rem;">${english("err.notConfigured.heading")}</h1>
<p>${english("err.notConfigured.body")}</p>
</body>
</html>`;
