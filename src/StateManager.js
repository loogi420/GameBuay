const fs = require("fs");
const path = require("path");
const msg = require("msgpack");
const https = require("https");

module.exports.StateManager = class StateManager{
	/**
	 * Manages savestates and other file operations
	 * @param {string} romBase ROM folder
	 * @param {string} stateBase State folder
	 */
	constructor(romBase, stateBase){
		this.romBase = romBase;
		this.stateBase = stateBase;
	}
	
	/**
	 * Loads the content of a file
	 * @param {string} path
	 * @returns {Promise<Buffer>}
	 */
	loadFile(path){
		return new Promise((res, rej) =>
			fs.readFile(path, (err, data) => err ? rej(err) : res(data))
		);
	}
	
	/**
	 * Creates a directory
	 * @param {string} path
	 * @returns {Promise<string>} The created path
	 */
	mkdir(path){
		return new Promise((res, rej) =>
			fs.mkdir(path, {recursive: true}, (err, path) => err ? rej(err) : res(path))
		);
	}
	
	/**
	 * Writes data to a file
	 * @param {string} path The file to write to
	 * @param {Buffer|string} data
	 * @returns {Promise<void>}
	 */
	writeFile(path, data){
		return new Promise((res, rej) =>
			fs.writeFile(path, data, err => err ? rej(err) : res())
		);
	}
	
	/**
	 * Loads the contents of a ROM
	 * @param {string} rom The filename of the ROM
	 */
	async loadROM(rom){
		if(/\/|\\/.test(rom)){
			throw new Error("Invalid ROM name");
		}
		
		return await this.loadFile(path.join(this.romBase, rom));
	}
	
	/**
	 * Loads either the ROM or the initial state
	 * @param {string} rom The filename of the ROM
	 */
	async loadInit(rom){
		try{
			return {
				state: msg.unpack(await this.loadFile(path.join(this.stateBase, "startup", rom+".sav")))
			};
		}catch(e){
			return {
				rom: await this.loadROM(rom)
			};
		}
	}
	
	/**
	 * Loads the savestate for a channel
	 * @param {string} channel The channel ID
	 */
	async loadState(channel){
		return msg.unpack(await this.loadFile(path.join(this.stateBase, "channels", channel+".sav")));
	}
	
	/**
	 * Saves a state to a file
	 * @param {any} state The state to save
	 * @param {string} rom The filename of the ROM
	 * @param {string | false} channel The channel ID, or false for an initstate
	 * @returns {Promise<string>} The saved file
	 */
	async saveState(state, rom, channel = false){
		const startup = channel === false;
		
		const folder = startup? "startup": "channels";
		const file = startup? rom+".sav": channel+".sav";
		
		await this.mkdir(path.join(this.stateBase, folder));
		
		const savePath = path.join(this.stateBase, folder, file);
		await this.writeFile(savePath, msg.pack(state));
		
		return savePath;
	}
	
	/**
	 * 
	 * @param {string} url The discord CDN URL to download
	 * @param {string} channel The channel ID this state is for
	 */
	async downloadState(url, channel){
		if(!/^https:\/\/[a-z]+\.discordapp\.(com|net)\//.test(url)){
			throw new Error("Invalid URL "+url);
		}
		
		await this.mkdir(path.join(this.stateBase, "channels"));
		
		await new Promise((res, rej) => {
			https.get(url, r => {
				r.on("end", () => {
					res();
				});
				r.on("error", rej);
				r.pipe(fs.createWriteStream(path.join(this.stateBase, "channels", channel+".sav")));
			});
		});
	}
}