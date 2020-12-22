const { Bot } = require("./bot");
const { ChannelState } = require("./ChannelState");
const { StateManager } = require("./StateManager");

const buttons = [
	"a", "b", "start", "select", "left", "right", "up", "down", "^", "v", "<", ">", "pass"
];

module.exports.dpgb = (config, romIndex) => {
	const bot = new Bot(config.token);
	const sm = new StateManager("roms", "states");
	
	const channels = {};
	
	bot.on("message", async (message, channel, user, id, attachments) => {
		if(!(channel in channels)){
			channels[channel] = new ChannelState(bot, channel, sm);
		}
		
		/** @type {ChannelState} */
		const cs = channels[channel];
		
		if(message.startsWith(config.prefix)){
			const args = message.substr(config.prefix.length).split(" ");
			const command = args.shift();
			const rest = args.join(" ");
			
			switch(command){
				case "start":
					if(rest in romIndex){
						const gameConfig = romIndex[rest];
						
						try{
							await bot.send(channel, "Starting game "+rest);
							
							const res = await cs.startGame(rest, gameConfig, config.speed);
							
							if(!(res instanceof Function)){
								await bot.send(channel, "Failed to start game");
								break;
							}
							
							await cs.setImage(res());
						}catch(e){
							try{
								console.error(e);
								await bot.send(channel, e.message);
							}catch(e){
								console.error(e);
							}
						}
					}else{
						await bot.send(channel, "Game "+rest+" not found");
					}
					break;
				case "list":
					try{
						await bot.send(channel, "Games:\n"+Object.keys(romIndex).join("\n"));
					}catch(e){
						console.error(e);
					}
					break;
				case "save":
					try{
						const savePath = await cs.saveState();
						await bot.send(channel, {
							files: [{
								name: "state.sav",
								attachment: savePath
							}]
						});
					}catch(e){
						try{
							await bot.send(channel, e.message);
						}catch(e){
							console.error(e);
						}
					}
					break;
				case "load":
					try{
						const vals = attachments && attachments.array instanceof Function && attachments.array();
						if(!vals || !Array.isArray(vals) || !vals.length){
							return await bot.send(channel, "No attachment or multiple attachments");
						}
						const url = vals[0].url;
						
						await cs.downloadState(url);
						await bot.send(channel, "Save state loaded");
					}catch(e){
						try{
							await bot.send(channel, e.message);
						}catch(e){
							console.error(e);
						}
					}
					break;
			}
		}
		
		if(buttons.indexOf(message) >= 0){
			try{
				const res = await cs.press(message, config.speed);
				if(res){
					try{
						await bot.delete(channel, id);
					}catch(e){}
				}
			}catch(e){
				console.error(e);
			}
		}
	});
}