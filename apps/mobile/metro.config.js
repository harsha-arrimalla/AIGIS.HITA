const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Find the monorepo root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from one root to avoid duplicate native module registration
config.resolver.nodeModulesPaths = [path.resolve(monorepoRoot, "node_modules")];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
