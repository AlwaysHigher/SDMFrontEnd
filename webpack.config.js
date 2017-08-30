// https://github.com/petehunt/webpack-howto
// http://christianalfoni.github.io/javascript/2014/12/13/did-you-know-webpack-and-react-is-awesome.html
const kit = require('nokit');
const webpack = require('webpack');
const HappyPack = require('happypack');
const autoprefixer = require('autoprefixer');
const HtmlPlugin = require('html-webpack-plugin');
const CleanupPlugin = require('webpack-cleanup-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');


const { join } = kit.path;

const BUILD_PATH = join(__dirname, 'dist');
const SRC_PATH = join(__dirname, 'src');
const NODE_MODULES_PATH = join(__dirname, 'node_modules');

const isProd = kit.isProduction();

// FIXME: config CDN address for production
const publicPath = `${isProd ?
  'https://d21ps49l69jsm6.cloudfront.net' : ''
}/static/`;

const cssExtractor = new ExtractTextPlugin({
  filename: '[name].[contenthash:8].css',
  allChunks: true,
});

const postcssLoader = {
  loader: 'postcss-loader',
  options: {
    plugins: [
      autoprefixer({
        browsers: [
          'last 3 versions',
        ],
      }),
    ],
  },
};

const plugins = [
  new CleanupPlugin(['dist'], {
    root: __dirname,
    verbose: true,
  }),

  new webpack.DefinePlugin({
    __DEV__: !isProd,
  }),

  new webpack.optimize.ModuleConcatenationPlugin(),

  new webpack.HashedModuleIdsPlugin(),

  // https://github.com/webpack/webpack/tree/master/examples/two-explicit-vendor-chunks
  new webpack.optimize.CommonsChunkPlugin({
    name: 'main',
    minChunks: Infinity,
  }),

  new HtmlPlugin({
    template: `${SRC_PATH}/index.html`,
    filename: 'pages/index.html',
  }),

  new HappyPack({
    id: 'js',
    threads: 4,
    loaders: [
      {
        path: 'babel-loader',
        query: {
          presets: [
            'react', 'env',
          ],
          plugins: [
            'transform-runtime',
            'syntax-object-rest-spread',
          ],
        },
      },
    ],
  }),

  cssExtractor,
];

if (isProd) {
  plugins.concat([
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      sourceMap: false,
      compress: {
        warnings: false,
      },
    }),
  ]);
}

module.exports = {
  entry: './src/index.jsx',

  output: {
    path: BUILD_PATH,
    filename: '[name].[chunkhash:8].js',
    publicPath,
  },

  devtool: false,

  resolve: {
    modules: [
      SRC_PATH,
      NODE_MODULES_PATH,
    ],
    extensions: ['.js', '.jsx'],
  },

  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'happypack/loader',
        options: {
          id: 'js',
        },
        exclude: /(node_modules|bower_components)/,
        include: SRC_PATH,
      },
      {
        test: /\.css$/,
        loader: cssExtractor.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: isProd,
              },
            },
            postcssLoader,
          ],
        }),
      },
    ],
  },

  stats: {
    hash: false,
    chunks: false,
    chunkModules: false,
    children: false,
  },

  plugins,
};
