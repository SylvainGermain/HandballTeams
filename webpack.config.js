const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.ts',
    output: {
        path: isProduction ? path.resolve(__dirname, '.') : path.resolve(__dirname, 'dist'),
        filename: isProduction ? 'build/bundle.js' : 'bundle.js',
        clean: isProduction ? {
            keep: /^(?!build\/)/
        } : true,
        publicPath: isProduction ? './' : '/'
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: isProduction ? 'build/[name].[contenthash][ext]' : '[name][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: isProduction ? 'build/[name].[contenthash][ext]' : '[name][ext]'
          }
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'IS_PRODUCTION': JSON.stringify(isProduction)
      }),
      ...(isProduction ? [
        new MiniCssExtractPlugin({
            filename: 'build/styles.css'
        }),
      ] : []),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        inject: 'body',
        minify: isProduction,
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'node_modules/gif.js/dist/gif.worker.js'),
            to: isProduction ? path.resolve(__dirname, 'build/gif.worker.js') : 'gif.worker.js'
          },
          {
            from: path.resolve(__dirname, 'resources/logos'),
            to: isProduction ? path.resolve(__dirname, 'build/logos') : 'logos',
            globOptions: {
              ignore: ['**/.DS_Store', '**/Thumbs.db']
            },
            noErrorOnMissing: true
          }
        ]
      }),
    ],
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist'),
          watch: true,
        },
        {
          directory: path.join(__dirname, 'resources'),
          publicPath: '/resources',
          watch: true,
        }
      ],
      watchFiles: [
        'src/**/*',
        'resources/**/*',
      ],
      port: 3000,
      hot: true,
      liveReload: true,
      open: true,
      compress: true,
      historyApiFallback: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
        progress: true,
      },
    },
    optimization: {
      splitChunks: false, // Disable code splitting to produce a single JS file
    },
  };
};
