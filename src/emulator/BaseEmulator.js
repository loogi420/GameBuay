const { Readable } = require("stream");

module.exports.BaseEmulator = class BaseEmulator{
	/**
	 * Initializes the emulator
	 * @param {Buffer|any} data The ROM or save state
	 * @param {"ROM"|"sav"} type Whether the data is a ROM or save data
	 * @param {number} framerate Base framerate of the emulation
	 * @param {Object} keymap The keys the emulator expects
	 */
	constructor(data, type = "ROM", framerate, keymap){
		this.framerate = framerate;
		this.keymap = keymap;
		
		//pending actions
		this.queue = [];
		this.busy = false;
		
		if(type == "ROM"){
			this.initROM(data);
		}else if(type == "sav"){
			this.initState(data);
		}
	}
	
	/**
	 * Initializes the emulator with a savestate
	 * @param {any} state The state to load
	 */
	initState(state){
		//abstract
	}
	
	/**
	 * Initializes the emulator with a ROM
	 * @param {Buffer} rom The ROM to load
	 */
	initROM(rom){
		//abstract
	}
	
	/**
	 * Gets the emulator state
	 * @returns {any}
	 */
	saveState(){
		//abstract
	}
	
	/**
	 * Strips the ROM from a savestate
	 * @param {any?} state The state to strip
	 * @returns {any} The altered state
	 */
	static stripState(state){
		//abstract
	}
	
	/**
	 * Adds a ROM to a stripped savestate
	 * @param {any} state The state to add a ROM to
	 * @param {Buffer} rom The ROM to add
	 * @returns {any} The altered state
	 */
	static saturateState(state, rom){
		//abstract
	}
	
	/**
	 * Advances the emulator one frame
	 * @returns {() => Readable} Function that returns a screenshot of the emulator
	 */
	frame(){
		//abstract
		return () => null;
	}
	
	/**
	 * Runs the emulation for a specified number of frames
	 * @param {number} frames The number of frames to emulate
	 * @param {string} speed The speed of emulation
	 * @param {() => {}} callback A function called every frame
	 * @returns {() => Readable} A function to get a PNGStream for the screen
	 */
	async advance(frames = 1, speed = "1x", callback = () => {}){
		let screen;
		for(let i = 0; i < frames; i++){
			callback();
			
			screen = this.frame();
			
			if(i < frames - 1){
				switch(speed){
					case "0.5x":
						await new Promise(r => setTimeout(r, 2000/this.framerate));
						break;
					case "1x":
						await new Promise(r => setTimeout(r, 1000/this.framerate));
						break;
					case "2x":
						await new Promise(r => setTimeout(r, 500/this.framerate));
						break;
					case "fast":
						await new Promise(r => setTimeout(r, 1));
						break;
					case "faster":
						await new Promise(r => setImmediate(r));
						break;
					case "fastest":
						break;
				}
			}
		}
		
		return screen;
	}
	
	/**
	 * Presses a button in the emulator
	 * @param {any} button The button to press
	 */
	pressKey(button){
		//abstract
	}
	
	/**
	 * Releases any held keys in the emulator
	 */
	releaseKeys(){
	}
	
	/**
	 * Presses a button and advances a number of frames
	 * @param {string} button The button to press
	 * @param {number} frames The number of frames to advance
	 * @param {number} pressFrames The number of frames to hold the button down for
	 * @param {string} speed The speed of emulation
	 * @returns {() => Readable}
	 */
	async press(button, frames, pressFrames, speed){
		if(this.busy){
			await this.enqueue();
		}
		
		this.busy = true;
		
		let frame = 0;
		let callback = () => {
			if(frame == 0 || frame == pressFrames){
				this.releaseKeys();
			}
			
			if(frame < pressFrames){
				if(button in this.keymap){
					this.pressKey(this.keymap[button]);
				}
			}
			
			frame++;
		};
		
		const res = await this.advance(frames, speed, callback);
		this.busy = false;
		
		return {
			screen: res,
			last: () => !this.dequeue()
		};
	}
	
	/**
	 * Wait until the queue is empty before continuing
	 * @returns {Promise}
	 */
	enqueue(){
		return new Promise(r => {
			this.queue.push(r);
		});
	}
	
	/**
	 * Removes the first item in the queue
	 * @returns {boolean} Whether there are still elements in the queue
	 */
	dequeue(){
		if(this.queue.length){
			this.queue.shift()();
			return true;
		}
		return false;
	}
}