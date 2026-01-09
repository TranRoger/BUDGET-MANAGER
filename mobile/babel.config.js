module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Optimize for production with smaller bundle size
          lazyImports: true,
        }
      ]
    ],
    plugins: [
      // Required for NativeWind
      'nativewind/babel',
      // Optimize React Native Reanimated
      'react-native-reanimated/plugin',
    ],
    env: {
      production: {
        plugins: [
          // Remove console.log in production
          'transform-remove-console',
        ],
      },
    },
  };
};
