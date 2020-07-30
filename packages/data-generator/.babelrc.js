module.exports = (api) => {
  api.cache(() => process.env.TEAMCITY_VERSION);
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current',
          },
        },
      ],
      [
        '@babel/preset-typescript',
        {
          allExtensions: true,
        },
      ],
    ],
  };
};
