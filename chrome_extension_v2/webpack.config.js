// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'cheap-module-source-map', // Source maps for dev
    entry: {
      // Your content script entry point
      content: './src/index.js',
      background: './src/crawl_request.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'), // Output to a 'dist' folder
      filename: '[name].js', // Bundled files will be named content.js, background.js etc.
      clean: true, // Clean the dist folder before each build
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            // Optional: Babel for transpiling modern JavaScript if needed
            // Install babel-loader, @babel/core, @babel/preset-env if you use this
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
      ],
    },
plugins: [
  new CopyPlugin({
    patterns: [
      {
        from: 'src/manifest.json',
        to: 'manifest.json'
      },
    ],
  }),
],
    resolve: {
      // Allows importing .js files without the extension
      extensions: ['.js'],
    },
  };
};
