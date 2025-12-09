module.exports = function (api) {
  api.cache(true);
  return {
    // Enable Expo preset and transform import.meta for Hermes/web compatibility
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};

