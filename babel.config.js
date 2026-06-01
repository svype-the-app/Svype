module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // babel-preset-expo (SDK 54) auto-adds react-native-worklets/plugin when
    // react-native-reanimated is installed, so no explicit reanimated plugin
    // is needed here. Keep this preset last if you add others.
  };
};
