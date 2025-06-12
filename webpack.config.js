const path = require("path");

module.exports = {
	mode: "development",
	devtool: "cheap-source-map",
	entry: {
		contentScript: "./src/contentScript.js",
		background: "./src/background.js",
		popup: "./src/ui/popup.js",
	},
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "dist"),
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env"],
					},
				},
			},
			{
				test: /\.css$/,
				use: [
					"style-loader",
					"css-loader",
					{
						loader: "postcss-loader",
						options: {
							postcssOptions: {
								plugins: [require("tailwindcss"), require("autoprefixer")],
							},
						},
					},
				],
			},
		],
	},
	optimization: {
		minimize: false,
	},
	resolve: {
		extensions: [".js"],
	},
};
