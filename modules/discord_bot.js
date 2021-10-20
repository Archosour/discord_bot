const paths 			= require('../configs/paths.json');
const discord_xp_table 	= require('../configs/discord_xp_table.json');
const fs 				= require('fs');
const fsPromise 		= fs.promises;
const commands 			= require('./../modules/commands.js');

module.exports.add_new_user = function add_new_user(user_id, guild_id, username, file_path) {
	if (user_id === undefined) return;
	if (typeof user_id !== 'string') return;

	let guild_path = 	`${paths.discord_users}/${guild_id}`;
	let user_path = 	`${guild_path}/${user_id}.json`;
	let user_ID = 		user_id

	if (file_path) {
		user_path = file_path;
		user_ID = 0;
	}

	let new_info = {
		user_id : 		user_ID,
		username : 		username,
		discord_xp : 	"1",
		discord_level : "0",
		notify_level : 	true
	}

	function write_to_file() {
		fs.writeFile(user_path, JSON.stringify(new_info),(error) => {
			if (error) {
				//general.logger(error, true, true, console_channel);
				//general.logger('to write file error', true, true, console_channel);
				//console.log(error);
			}
		});
	}

	fsPromise.mkdir(guild_path)
	.then(write_to_file())
	.catch((error) => {
		if (error.code === 'EEXIST') {
			//general.logger(`new user ${user_ID} : ${username}`, true, true, console_channel);
			if (file_path) {
				new_info.discord_xp = 1000;
			}
			write_to_file();

		} else {
			//general.logger(error, true, true, console_channel);
			//console.log(error);
		}
	});
}

module.exports.calculate_level = function calculate_level(exp) {
	let level 		= 0;
	let array_of_xp = discord_xp_table.normal;

	array_of_xp.forEach( function(number) {
		if (typeof number !== 'number') {
			console.log('discord xp loop no number');
			return;
		}
		if (exp < number) {
			return level - 1;
		}
		level++;
	});
	return level - 1;
}

module.exports.command = function command(message, discord_client) {
	return new Promise((resolve, reject) => {
		let platform 	= 'discord';
		let user_input 	= message.content;
		let subbed 		= false;
		let username 	= message.author.username;
		let channel 	= discord_client;
		let mod 		= false;
			
		commands.processor(channel, username, user_input, mod, subbed, platform).then((return_string) => {
			resolve(return_string);
		});
	});
}

module.exports.give_exp = function give_exp(incomming_discord_message, change = 0) {
	fsPromise.readFile(`./users/discord/${incomming_discord_message.guild.id}/${incomming_discord_message.author.id}.json`)
		.then((data) => {
			let info 	= JSON.parse(data);

			info.discord_xp += change;

			let level 	= this.calculate_level(info.discord_xp);

			if (info.notify_level === undefined) {
				info.notify_level = true;
				console.log('user updated');
			}

			if (level > info.discord_level) {
				info.discord_level = level;
				if (info.notify_level) {
					incomming_discord_message.author.send(`You have leveled! You have now level: ${level} Bravery.`);
				}
			}

			fs.writeFile(`./users/discord/${incomming_discord_message.guild.id}/${incomming_discord_message.author.id}.json`, JSON.stringify(info), (error) => {
				if (error) {
					console.log(error);
					return;
				}
			});
		})
		.catch((error) => {
			if (error.code === 'ENOENT') {
				this.add_new_user(incomming_discord_message.author.id, incomming_discord_message.guild.id, incomming_discord_message.author.username);
			} else {
				console.log(error);
			}
		});
}