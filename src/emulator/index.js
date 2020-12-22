const { BaseEmulator } = require("./BaseEmulator");
const { GameBoy } = require("./GameBoy");
const { NES } = require("./NES");
const { GBA } = require("./GBA");

module.exports = {
	BaseEmulator,
	/** @type {{string: typeof BaseEmulator}} */
	emulators: {
		"gameboy": GameBoy,
		"nes": NES,
		"gba": GBA,
		"default": GameBoy
	}
};
