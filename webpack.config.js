const {resolve} = require('path')
const env = process.env.NODE_ENV || 'development'

module.exports = {
  mode: env,
  entry: resolve(__dirname, 'static', 'app'),
  output: {
    path: resolve(__dirname, 'static', 'build'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
            plugins: ['angularjs-annotate'],
          },
        },
      },
      {
        test: /\.less$/,
        use: [{
          loader: 'style-loader',
        }, {
          loader: 'css-loader',
        }, {
          loader: 'less-loader',
        }],
      },
    ],
  },
}
