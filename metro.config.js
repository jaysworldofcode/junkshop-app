const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = Array.from(new Set([...config.resolver.assetExts, 'wasm']));
config.resolver.sourceExts = config.resolver.sourceExts.filter((extension) => extension !== 'wasm');
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
