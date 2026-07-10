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

// 3. Block react-native-maps on web platform
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    // Return the web stub instead
    return {
      type: 'sourceFile',
      filePath: path.resolve(projectRoot, 'src/components/MapView.web.tsx'),
    };
  }
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
