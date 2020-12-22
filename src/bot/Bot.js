const discord = require("discord.js");
const { EventEmitter } = require("events");

module.exports.Bot = class Bot extends EventEmitter{
	/**
	 * Abstracts a discord bot
	 * @param {string} token The bot token to log in with
	 */
	constructor(token){
		super();
		
		this.client = new discord.Client();
		
		this._events = {};
		
		this.client.on("message", message => {
			//ignore bot messages
			if(message.author.bot){
				return;
			}
			
			this.emit("message", message.content, message.channel.id, message.author.id, message.id, message.attachments);
		});
		
		this.client.on("ready", () => {
			console.log("Bot connected");
		});
		
		this.client.login(token);
	}
	
	/**
	 * Sends a message to a channel
	 * @param {string} channel The channel to send to
	 * @param {any} data The data to send to that channel
	 * @returns {Promise<discord.Message>} The sent message
	 */
	async send(channel, data){
		const chan = await this.client.channels.fetch(channel);
		
		if(!chan){
			throw new Error("Nonexistent channel");
		}
		
		const message = await chan.send(data);
		
		return message;
	}
	
	/**
	 * Deletes a message
	 * @param {string} channel The channel the message is in
	 * @param {string} id The message to delete
	 */
	async delete(channel, id){
		const chan = await this.client.channels.fetch(channel);
		
		if(!chan){
			throw new Error("Nonexistent channel");
		}
		
		const mess = await chan.messages.fetch(id);
		if(!mess){
			throw new Error("Nonexistent message");
		}
		await mess.delete();
	}
}