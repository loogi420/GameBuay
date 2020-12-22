const fs = require("fs");
const gbajs = require("gbajs");
const { BaseEmulator } = require("./BaseEmulator");
const { PassThrough } = require("stream");

const biosBuf = fs.readFileSync('./node_modules/gbajs/resources/bios.bin');

//Serializer uses blobs
const { Serializer } = require("gbajs/js/util");
Serializer.prefix = val => {
	return Buffer.from(val);
};

const GameBoyAdvanceIO = require("gbajs/js/io");
GameBoyAdvanceIO.prototype.defrost = function(frost) {
	this.registers = new Uint16Array(frost.registers);
	// Video registers don't serialize themselves
	for (var i = 0; i <= this.BLDY; i += 2) {
		this.store16(i, this.registers[i >> 1]);
	}
};

module.exports.GBA = class GBA extends BaseEmulator{
	constructor(data, type){
		super(data, type, 60, {});
		
		this.buttonDown = [];
	}
	
	/**
	 * Initializes the GBA emulator
	 */
	initGBA(){
		this.gba = new gbajs();
		
		this.gba.setBios(biosBuf);
		this.gba.setCanvasMemory();
		
		const k = this.gba.keypad;
		this.keymap = {
			"a": k.A,
			"b": k.B,
			"start": k.START,
			"select": k.SELECT,
			"left": k.LEFT,
			"right": k.RIGHT,
			"up": k.UP,
			"down": k.DOWN,
			"^": k.UP,
			"v": k.DOWN,
			"<": k.LEFT,
			">": k.RIGHT
		};
	}
	
	initState(state){
		this.initROM(state.rom);
		
		this.gba.defrost(state.state);
	}
	
	initROM(rom){
		this.initGBA();
		
		this.rom = rom;
		
		this.gba.setRom(rom);
	}
	
	frame(){
		this.gba.advanceFrame();
		
		return () => {
			const png = this.gba.screenshot().pack();
			//for some reason discord doesn't see the png stream as a real stream
			//it may be adherent to the interface but not inheriting the right classes
			//but just passing it through a passthrough stream fixes this
			const res = new PassThrough();
			png.pipe(res);
			return res;
		};
	}
	
	releaseKeys(){
		while(this.buttonDown.length){
			this.gba.keypad.keyup(this.buttonDown.pop());
		}
	}
	
	pressKey(button){
		if(this.buttonDown.indexOf(button) < 0){
			this.buttonDown.push(button);
		}
		
		this.gba.keypad.keydown(button);
	}
	
	saveState(){
		const state = this.gba.freeze();
		
		return {
			state: state,
			rom: this.rom
		};
	}
	
	static stripState(state){
		state.rom = null;
		delete state.rom;
		return state;
	}
	
	static saturateState(state, rom){
		state.rom = rom;
		return state;
	}
}