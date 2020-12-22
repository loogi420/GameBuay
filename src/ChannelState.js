const { Bot } = require("./bot");
const { BaseEmulator, emulators } = require("./emulator");
const { Readable }= require("stream");
const { StateManager } = require("./StateManager");

module.exports.ChannelState = class ChannelState{
	/**
	 * Represents the state of a channel
	 * @param {Bot} bot The discord bot
	 * @param {string} id The channel ID
	 * @param {StateManager} sm The state manager
	 */
	constructor(bot, id, sm){
		this.bot = bot;
		this.channel = id;
		this.sm = sm;
		
		this.starting = false; //whether the game is loading and initializing
		
		/** @type {BaseEmulator|null} */
		this.emulator = null;
		
		this.config = null; //configuration for the game
		this.game = null; //name of the loaded game
		this.message = null; //message with the current screenshot
		this.tried = false; //whether loading from channel state was already tried
	}
	
	/**
	 * Downloads and loads a state from discord
	 * @param {string} url URL to download save file
	 */
	async downloadState(url){
		await this.sm.downloadState(url, this.channel);
		
		this.tried = false;
		if(!(await this.resume())){
			throw new Error("Failed to load state");
		}
	}
	
	/**
	 * Saves the emulation state
	 * @param {boolean} startup Whether this is a startup state or a channel state
	 */
	async saveState(startup = false){
		if(!this.emulator){
			if(!(await this.resume())){
				throw new Error("Game isn't started");
			}
		}
		
		const state = this.emulator.saveState();
		let obj = state;
		
		if(!startup){
			/** @type {typeof BaseEmulator} */
			const emulator = emulators[this.config.emulator || "default"];
			const strippedState = emulator.stripState(state);
		
			obj = {
				config: this.config,
				game: this.game,
				message: this.message,
				state: strippedState
			};
		}
		
		return await this.sm.saveState(obj, this.config.file, startup ? false : this.channel);
	}
	
	/**
	 * Sets or replaces the screenshot of the emulator
	 * @param {Readable | string} im The image to send
	 */
	async setImage(im){
		if(this.message){
			await this.bot.delete(this.channel, this.message).catch(() => {});
		}
		
		const post = await this.bot.send(this.channel, {
			files: [{
				name: "gb.png",
				attachment: im
			}]
		});
		
		this.message = post.id;
	}
	
	/**
	 * Starts a new game from a rom
	 * @param {string} name The name of the game to start
	 * @param {any} config The game configuration
	 * @param {string} speed The emulation speed
	 * @returns {() => Readable} A function that returns a screenshot
	 */
	async startGame(name, config, speed){
		//don't start twice
		if(this.starting){
			throw new Error("Game already starting");
		}
		
		try{
			this.starting = true;
			this.game = name;
			
			const data = await this.sm.loadInit(config.file);
			
			if(!data){
				this.starting = false;
				throw new Error("Game start failed");
			}
			
			this.config = config;
			let ret;
			
			const emulator = emulators[config.emulator || "default"];
			
			if(data.rom){
				//start up the game
				this.emulator = new emulator(data.rom, "ROM");
				ret = await this.emulator.advance(config.initdelay, speed);
				
				//save the state to eliminate future startup times
				await this.saveState(true);
				
			}else if(data.state){
				this.emulator = new emulator(data.state, "sav");
				ret = await this.emulator.advance(1, speed);
			}
			
			this.starting = false;
			return ret;
		}finally{
			this.starting = false;
		}
	}
	
	/**
	 * Resumes from a saved state
	 * @returns {boolean} Whether the resume was successful
	 */
	async resume(){
		//only try once
		if(this.tried){
			return false;
		}
		
		this.tried = true;
		
		try{
			const state = await this.sm.loadState(this.channel);
			this.game = state.game;
			this.config = state.config;
			
			/** @type {typeof BaseEmulator} */
			const emulator = emulators[this.config.emulator || "default"];
			
			const rom = await this.sm.loadROM(this.config.file);
			const newState = emulator.saturateState(state.state, rom);
			
			this.message = state.message;
			this.starting = false;
			
			this.emulator = new emulator(newState, "sav");
		}catch(e){
			console.error(e);
			return false;
		}
		
		return true;
	}
	
	/**
	 * Presses a button and advances the emulation
	 * @param {string} button The button to press
	 * @param {string} speed The speed of emulation
	 * @returns {() => Readable} A function that returns a screenshot
	 */
	async press(button, speed){
		if(!this.emulator || this.starting){
			if(!(await this.resume())){
				return;
			}
		}
		
		const res = await this.emulator.press(button, this.config.delay, this.config.pressFrames, speed);
		await this.setImage(res.screen());
		
		if(res.last()){
			await this.saveState();
		}
		
		return true;
	}
}