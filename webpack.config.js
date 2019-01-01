const path = require("path");
const webpack = require("webpack");

module.exports = {
	mode: "development",
	entry: [
		path.join(__dirname, "app/index.ts")
	],
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: ["ts-loader"]
			}
		]
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	output: {
		path: path.join(__dirname, "out"),
		filename: "scripts.js"
	}
};
