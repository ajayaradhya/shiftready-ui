const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Support workspace packages (pnpm monorepo)
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../../node_modules"),
];

const nwConfig = withNativeWind(config, {
  input: "./global.css",
  configPath: "./tailwind.config.ts",
});

// Windows fix: NativeWind embeds output path in require('...') string literals.
// Backslashes in Windows paths corrupt JS strings (\n → newline, \t → tab, etc.).
if (nwConfig.transformer?.nativewind?.output) {
  nwConfig.transformer.nativewind.output =
    nwConfig.transformer.nativewind.output.replace(/\\/g, "/");
}

module.exports = nwConfig;
