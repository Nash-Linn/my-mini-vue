const path = require("path");

module.exports = {
  mode: "development",
  devtool: "inline-cheap-source-map",
  // devtool: false,
  entry: "./src/index.js",
  output: {
    filename: "mini-vue.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  devServer: {
    contentBase: "./src/examples",
    publicPath: "/dist",
    watchContentBase: true,
  },
};
