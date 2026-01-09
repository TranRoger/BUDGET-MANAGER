const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// CPU optimization for 1 vCPU environment
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Reduce CPU usage during minification
    compress: {
      drop_console: true,
    },
    mangle: {
      keep_fnames: false,
    },
  },
  // Limit parallel processing
  maxWorkers: 1,
};

// Enable caching to reduce re-bundling
config.cacheStores = [
  {
    name: 'metro-cache',
    type: 'filesystem',
    root: '/app/.expo',
  },
];

// Optimize resolver
config.resolver = {
  ...config.resolver,
  // Don't watch for changes (reduces CPU)
  useWatchman: false,
};

module.exports = config;
