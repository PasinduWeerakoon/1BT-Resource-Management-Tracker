const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Custom plugin to filter Sass deprecation warnings
class SuppressSassWarningsPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('SuppressSassWarningsPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'SuppressSassWarningsPlugin',
          stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        () => {
          // Filter out Sass deprecation warnings
          if (compilation.warnings && Array.isArray(compilation.warnings)) {
            compilation.warnings = compilation.warnings.filter((warning) => {
              const message = warning?.message || warning?.toString() || '';
              return !message.includes('legacy-js-api') && 
                     !message.includes('Deprecation The legacy JS API');
            });
          }
        }
      );
    });
  }
}

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(scss|sass|css)$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                silenceDeprecations: ['legacy-js-api'],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
    }),
    new SuppressSassWarningsPlugin(),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.mjs'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@layouts': path.resolve(__dirname, 'src/layouts'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@navigation': path.resolve(__dirname, 'src/navigation'),
      '@routes': path.resolve(__dirname, 'src/routes'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@configs': path.resolve(__dirname, 'src/configs'),
      '@redux': path.resolve(__dirname, 'src/redux'),
      '@languages': path.resolve(__dirname, 'src/languages'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@api': path.resolve(__dirname, 'src/api'),
    },
    fallback: {
      "crypto": false,
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true,
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
  },
  ignoreWarnings: [
    (warning) => {
      const message = warning?.message || warning?.toString() || '';
      return /legacy-js-api/i.test(message) || /sass-loader.*deprecation/i.test(message);
    },
  ],
  infrastructureLogging: {
    level: 'error',
  },
};
