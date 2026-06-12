// @ts-check
import js from "@eslint/js";

/** Colours that are architecturally justified outside theme.ts */
const ALLOWED_HEX = new Set([
  "#000",
  "#000000",
  "#fff",
  "#ffffff",
  // Google brand blue used in GoogleLogo
  "#4285f4",
]);

/**
 * Local rule: no raw hex colour strings except for camera overlays and brand
 * colours. All other colours must come from @/lib/theme.
 *
 * Allowed exceptions:
 *  - lib/theme.ts itself
 *  - app/capture/** (black BG + white overlay on live camera)
 *  - Any app/item/** lightbox (white X on dark overlay)
 */
const noRawHex = {
  meta: {
    type: "suggestion",
    messages: {
      noRawHex:
        'Use a token from @/lib/theme instead of raw hex "{{value}}". Add to the ALLOWED_HEX set in eslint.config.mjs if truly intentional.',
    },
  },
  create(context) {
    const filename = context.getFilename?.() ?? "";
    const exempted =
      filename.includes("lib/theme") ||
      filename.includes("app/capture/") ||
      filename.includes("app/item/");
    if (exempted) return {};

    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        if (/^#[0-9a-fA-F]{3,8}$/.test(node.value)) {
          if (!ALLOWED_HEX.has(node.value.toLowerCase())) {
            context.report({
              node,
              messageId: "noRawHex",
              data: { value: node.value },
            });
          }
        }
      },
    };
  },
};

export default [
  js.configs.recommended,
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    plugins: {
      local: { rules: { "no-raw-hex": noRawHex } },
    },
    rules: {
      "local/no-raw-hex": "warn",
    },
  },
];
