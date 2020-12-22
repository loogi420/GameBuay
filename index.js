const config = require("./config.json");
const romIndex = require("./roms/index.json");

const { dpgb } = require("./src");

process.chdir(__dirname);

dpgb(config, romIndex);
