const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const monorepoRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(__dirname);

// pnpm monorepo: watch workspace packages + follow symlinks
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.resolver.unstable_enableSymlinks = true;

// Required for react-native-worklets (reanimated): Expo disables inlineRequires
// by default which breaks the worklets initialization pipeline.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

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
