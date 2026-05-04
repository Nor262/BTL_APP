const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { withReactNativeCSS } = require("react-native-css/metro");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add custom resolver for jsx-runtime to bypass resolution issues
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "react-native-css-interop/jsx-runtime": path.resolve(__dirname, "node_modules/react-native-css-interop/dist/runtime/jsx-runtime.js"),
  "react-native-css-interop/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react-native-css-interop/dist/runtime/jsx-dev-runtime.js"),
};

module.exports = withNativeWind(
  withReactNativeCSS(config),
  { input: "./src/global.css" }
);
