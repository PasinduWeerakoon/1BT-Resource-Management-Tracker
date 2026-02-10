const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Conditionally require BundleAnalyzerPlugin only when needed
let BundleAnalyzerPlugin = null;
try {
  if (process.env.ANALYZE === 'true' || process.argv.includes('--analyze')) {
    BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
  }
} catch (error) {
  console.warn('⚠️  webpack-bundle-analyzer not found. Install it with: npm install --save-dev webpack-bundle-analyzer');
}

// Load .env file if it exists
const loadEnvFile = () => {
  const envPath = path.resolve(__dirname, '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    try {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach((line) => {
        const trimmedLine = line.trim();
        // Skip empty lines and comments
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            // Remove quotes if present
            env[key.trim()] = value.replace(/^["']|["']$/g, '');
          }
        }
      });
      // Debug: Log loaded env vars (only in development)
      if (process.env.NODE_ENV !== 'production') {
        console.log('📄 Loaded .env file from:', envPath);
        console.log('📦 Environment variables from .env:', env);
      }
    } catch (error) {
      console.warn('⚠️  Warning: Could not read .env file:', error.message);
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.log('ℹ️  No .env file found at:', envPath);
    }
  }
  
  return env;
};

// Load environment variables from .env file
const envVars = loadEnvFile();

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
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),
    new webpack.DefinePlugin({
      // NODE_ENV is automatically set by webpack based on --mode flag, so we don't define it here
      // 'process.env.NODE_ENV' is handled by webpack automatically
      'process.env.REACT_APP_ENV': JSON.stringify(envVars.REACT_APP_ENV || process.env.REACT_APP_ENV || 'qa'),
      'process.env.REACT_APP_API_BASE_URL': JSON.stringify(envVars.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || ''),
    }),
    new SuppressSassWarningsPlugin(),
    // Add BundleAnalyzerPlugin if --analyze flag is passed and plugin is available
    ...(BundleAnalyzerPlugin && (process.env.ANALYZE === 'true' || process.argv.includes('--analyze')) ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: true,
        reportFilename: 'bundle-report.html',
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
      })
    ] : []),
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
      '@constants': path.resolve(__dirname, 'src/constants'),
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
  optimization: {
    // Enable tree shaking
    usedExports: true,
    sideEffects: false,
    // Code splitting configuration
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk for node_modules
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        // Ant Design chunk (large library)
        antd: {
          test: /[\\/]node_modules[\\/]antd[\\/]/,
          name: 'antd',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Chart.js chunk
        charts: {
          test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
          name: 'charts',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Redux chunk
        redux: {
          test: /[\\/]node_modules[\\/](redux|@reduxjs|react-redux)[\\/]/,
          name: 'redux',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Common chunk for shared code
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    // Runtime chunk for webpack runtime code
    runtimeChunk: {
      name: 'runtime',
    },
    // Minimize in production
    minimize: process.env.NODE_ENV === 'production',
  },
};
