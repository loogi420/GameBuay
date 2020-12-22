const { BaseEmulator } = require("./BaseEmulator");
const serverboy = require("serverboy");
const { createCanvas, createImageData } = require("canvas");
const { Readable } = require("stream");

const settings = require("serverboy/src/gameboy_core/settings");
//disable audio
settings[0] = false;


module.exports.GameBoy = class GameBoy extends BaseEmulator{
	constructor(data, type){
		super(data, type, 120, {
			"a": "A",
			"b": "B",
			"start": "START",
			"select": "SELECT",
			"left": "LEFT",
			"right": "RIGHT",
			"up": "UP",
			"down": "DOWN",
			"^": "UP",
			"v": "DOWN",
			"<": "LEFT",
			">": "RIGHT"
		});
		
		this.canvas = createCanvas(160, 144);
	}
	
	/**
	 * Initializes the Gameboy emulator
	 */
	initGB(){
		this.gb = new serverboy();
		
		//serverboy stores internal details in a randomly generated key
		//and doesn't provide a way to save/load state outside of this
		const keys = Object.keys(this.gb);
		const internalKey = keys[0];
		this.internal = this.gb[internalKey];
	}
	
	initState(state){
		this.initGB();
		
		//get the gameboycore object to initialize without loading a rom
		//throws an error due to no rom
		try{ this.gb.loadRom(); }catch(e){}
		
		this.internal.gameboy.stopEmulator &= 1;
		this.internal.gameboy.iterations = 0;
		
		this.internal.gameboy.saving(state);
	}
	
	initROM(rom){
		this.initGB();
		
		this.gb.loadRom(rom);
	}
	
	frame(){
		const screen = this.gb.doFrame();
		
		return () => this.getScreen(screen);
	}
	
	/**
	 * Gets a PNGStream for the screen
	 * @param {Readable} screen The screen data
	 */
	getScreen(screen){
		if(!screen){
			screen = this.gb.getScreen();
		}
		
		const id = createImageData(new Uint8ClampedArray(screen), 160);
		const ctx = this.canvas.getContext("2d");
		ctx.putImageData(id, 0, 0);
		
		return this.canvas.createPNGStream();
	}
	
	pressKey(button){
		this.gb.pressKey(button);
	}
	
	saveState(){
		return this.internal.gameboy.saveState();
	}
	
	static stripState(state){
		state.shift();
		return state;
	}
	
	static saturateState(state, rom){
		state.unshift(Uint8Array.from(rom));
		return state;
	}
}