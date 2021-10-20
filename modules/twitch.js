const fs            = require('fs');
const fsPromise     = fs.promises;
const discord_bot 	= require('./../modules/discord_bot.js');
const bot_config    = require('./../bot_config.json');
const commands 		= require('./../modules/commands.js');

module.exports.add_balance = function add_balance(username = 'test', balance = 0) {
	//console.log('Currency');
	let file_path = `./users/twitch/${username}.json`;

	fsPromise.readFile(file_path)
		.then((data) => {
			let info = JSON.parse(data);

			info.discord_xp += balance;

			fs.writeFile(file_path, JSON.stringify(info), (error) => {
				if (error) {
					console.log(error);
					return;
				}
			});
		})
		.catch((error) => {
			if (error.code === 'ENOENT') {
				console.log('make new user');
				discord_bot.add_new_user('na', 0, username, file_path);
			} else {
				console.log(error);
			}
		});
}

module.exports.proces_rewards = function proces_rewards(reward, username) {
	console.log('reward: ' + reward);
	//console.log('-----------------userstate------------------');
	//console.log(userstate.username);

	switch (reward) {
		case 'e1570966-3138-4acf-b550-e4c6e661e559':
			console.log('Red LED');
			break;
		case '5ce677d4-ffa7-4d16-9c10-4ed6f9ee1236':
			console.log('currency');
			this.add_balance(username, 1000);
			break;
		default:
			console.log('no reward found')
			console.log(reward);
	}
}

module.exports.command = function command(channel, userstate, message, twitch_client) {
	let platform    = 'twitch';
	let user_input  = message;
	let subbed      = userstate.subscriber;
	let username    = userstate.username;
	let mod         = userstate.mod;

	commands.processor(channel, username, user_input, mod, subbed, platform).then((return_string) => {
		if (!bot_config.test_bot) {
			twitch_client.say(channel, return_string);
		}
	});
}




