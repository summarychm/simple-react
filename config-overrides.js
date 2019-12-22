let path = require("path");

module.exports = function override(config, env) {
	config.resolve.alias = {
		...config.resolve.alias,
		"@": path.resolve("./src/Core"),
	};
	return config;
};
