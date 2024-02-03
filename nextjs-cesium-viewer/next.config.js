// next.config.js
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  reactStrictMode: false,
  webpack: (config, { isServer, webpack }) => {
    // Exclude Cesium workers from TerserPlugin
    if (!isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            // {
            //   from: path.join(__dirname, "node_modules/cesium/Build/Cesium/Workers"),
            //   to: "public/Cesium/Workers"
            // },
            {
              from: path.join(__dirname, "node_modules/cesium/Build/Cesium/ThirdParty"),
              to: "public/Cesium/ThirdParty"
            },
            {
              from: path.join(__dirname, "node_modules/cesium/Build/Cesium/Assets"),
              to: "public/Cesium/Assets"
            },
            {
              from: path.join(__dirname, "node_modules/cesium/Build/Cesium/Widgets"),
              to: "public/Cesium/Widgets"
            }
          ]
        }),
        new webpack.DefinePlugin({
          CESIUM_BASE_URL: JSON.stringify("/Cesium")
        })
      );

      // Optional: Explicitly modify the TerserPlugin options if needed
      config.optimization.minimizer = config.optimization.minimizer.map(plugin => {
        if (plugin.constructor.name === 'TerserPlugin') {
          plugin.options.terserOptions = {
            ...plugin.options.terserOptions,
            // Prevent Terser from parsing the worker files
            mangle: false,
            compress: false,
            parse: {
              ecma: 8
            },
            module: true,
          };
        }
        return plugin;
      });
    }

    return config;
  },
};
