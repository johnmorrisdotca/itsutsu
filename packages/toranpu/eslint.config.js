import js from "@eslint/js";
import tseslint from "typescript-eslint";

const browser = Object.fromEntries(["document", "window", "location", "history", "setTimeout", "clearTimeout", "console"].map((name) => [name, "readonly"]));

export default tseslint.config(
  { ignores: ["dist/", "site/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: { console: "readonly" } } },
  { files: ["demo/**/*.js"], languageOptions: { globals: browser } },
);
