/*
 * Stands in for the `server-only` package under vitest.
 *
 * That package is a bundler marker: importing it from a client bundle is
 * meant to fail, so its default entry throws. Vitest runs in node, which is
 * the server, and the throw would only stop us from unit testing any module
 * that declares itself server-side. The real guard still applies to the app
 * build, which does not use this alias.
 */
export {};
