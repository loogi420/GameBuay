const { BaseEmulator } = require("./BaseEmulator");
const { Readable } = require("stream");
const jsnes = require("jsnes");
const { createCanvas, createImageData } = require("canvas");

module.exports.NES = class NES extends BaseEmulator{
	constructor(data, type){
		super(data, type, 60, {
			"a": jsnes.Controller.BUTTON_A,
			"b": jsnes.Controller.BUTTON_B,
			"start": jsnes.Controller.BUTTON_START,
			"select": jsnes.Controller.BUTTON_SELECT,
			"left": jsnes.Controller.BUTTON_LEFT,
			"right": jsnes.Controller.BUTTON_RIGHT,
			"up": jsnes.Controller.BUTTON_UP,
			"down": jsnes.Controller.BUTTON_DOWN,
			"^": jsnes.Controller.BUTTON_UP,
			"v": jsnes.Controller.BUTTON_DOWN,
			"<": jsnes.Controller.BUTTON_LEFT,
			">": jsnes.Controller.BUTTON_RIGHT
		});
		
		this.buttonDown = [];
	}
	
	/**
	 * Initializes the NES emulator
	 */
	initNES(){
		this.fb = null;
		
		const width = 256;
		const height = 240;
		
		this.canvas = createCanvas(width, height);
		this.ctx = this.canvas.getContext("2d");
		this.imdata = this.ctx.getImageData(0, 0, width, height);
		
		this.ctx.fillStyle = "black";
		this.ctx.fillRect(0, 0, width, height);
		
		const buffer = new ArrayBuffer(this.imdata.data.length);
		this.frame_8 = new Uint8ClampedArray(buffer);
		this.frame_32 = new Uint32Array(buffer);
		
		this.nes = new jsnes.NES({
			onFrame: fb => this.fb = fb
		});
	}
	
	initState(state){
		this.initNES();
		
		this.nes.fromJSON(state);
	}
	
	initROM(rom){
		this.initNES();
		
		this.nes.loadROM(rom.toString("binary"));
	}
	
	frame(){
		this.nes.frame();
		
		return () => this.getScreen();
	}
	
	/**
	 * Gets a PNGStream for the screen
	 * @param {Readable} screen The screen data
	 */
	getScreen(){
		if(this.fb){
			for(let i = 0; i < this.fb.length; i++){
				this.frame_32[i] = 0xFF000000 + this.fb[i];
			}
		}
		
		this.imdata.data.set(this.frame_8);
		
		this.ctx.putImageData(this.imdata, 0, 0);
		
		return this.canvas.createPNGStream();
	}
	
	releaseKeys(){
		while(this.buttonDown.length){
			this.nes.buttonUp(1, this.buttonDown.pop());
		}
	}
	
	pressKey(button){
		if(this.buttonDown.indexOf(button) < 0){
			this.buttonDown.push(button);
		}
		
		this.nes.buttonDown(1, button);
	}
	
	saveState(){
		return this.nes.toJSON();
	}
	
	static stripState(state){
		state.romData = null;
		delete state.romData;
		return state;
	}
	
	static saturateState(state, rom){
		state.romData = rom.toString("binary");
		return state;
	}
}