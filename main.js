const Discord 		= require('discord.js');
const fs 			= require('fs');
const fsPromise 	= fs.promises;
const tmi 			= require('tmi.js');
const Express 		= require('express');
const bodyParser 	= require('body-parser');

const general 		= require('./modules/general.js');
const discord_bot 	= require('./modules/discord_bot.js');
const streamdeck 	= require('./modules/streamdeck.js');
const turtle 		= require('./modules/turtle.js');
const twitch 		= require('./modules/twitch.js');
const obs 			= require('./modules/obs.js');

const bot_config 	= require('./bot_config.json');

const discord_client= new Discord.Client();
const express 		= Express();

express.use(bodyParser.urlencoded({ extended: true }));
express.use(bodyParser.json());

const discord_server_admins = [
	'367767515771830309',	// Archosaur
];

var console_channel;
var twitch_discord_channel;
var enable_streamdeck = false;

const tmi_options = {
	options: {
		debug: true,
	},
	connection: {
		cluster: 'aws',
		reconnect: true,
	},
	identity: {
		username: bot_config.username,
		password: bot_config.password,
	},
	channels: ['archosaur_'],
};
const twitch_client = tmi.client(tmi_options);

const version = '4.0.1';

function after_bot_connection() {
	module.exports.bot_startup_time = Date.now();
	module.exports.version = version;

	console.log('Twitch bot ready');
}

twitch_client.on('cheer', (channel, userstate, message) => {
	if (!bot_config.test_bot) return;

	console.log(`got a cheer from ${userstate.username}`);

	twitch_client.say(channel, `Thank you ${userstate['display-name']} for the ${userstate.bits}`);

	obs.set_latest_user_event('cheer', channel, userstate['display-name']);
});

twitch_client.on('hosted', (channel, username, viewers, autohost) => {
	if (autohost) return;
	if (!bot_config.test_bot) return;

	console.log(`hosted by ${username} people: ${viewers}`);

	if (viewers <= 1) {
		twitch_client.say(channel, `Thank you ${username} for the host`);
	} else {
		twitch_client.say(channel, `Thanks ${username} for the host with ${viewers} viewers!`);
	}
});

twitch_client.on('message', (channel, userstate, message, self) => {
	if (self) return;
	//if (!bot_config.test_bot) return;
	if (userstate["custom-reward-id"]){
		let reward = userstate["custom-reward-id"];
		let username = userstate.username;

		console.log('test --------------');
		console.log(reward);
		console.log(username);
		twitch.proces_rewards(reward, username);
		return;
	}

	if (message.startsWith(bot_config.command_prefix)) {
		twitch.command(channel, userstate, message, twitch_client);
		return;
	}
	console.log('twitch tester 01');
	console.log(`${userstate['display-name']}: ${message}`);
	twitch_discord_channel.send(`${userstate['display-name']}: ${message}`);
});

twitch_client.on('raided', (channel, username, viewers) => {
	if (!bot_config.test_bot) return;

	console.log(`got raided by ${username} with ${viewers} people`);

	if (viewers <= 1) {
		twitch_client.say(channel, `Thank you ${username} for the raid`);
	} else {
		twitch_client.say(channel, `Thanks ${username} for the raid with ${viewers} raiders!`);
	}
});

twitch_client.on('subscription', (channel, username, methods, message, userstate) => {
	if (!bot_config.test_bot) return;

	console.log(methods);
	console.log(userstate);

	twitch_client.say(channel, `Thank you soo much for the sub ${userstate['display-name']}. Welcome to the BraveCompany!`);
	
	obs.set_latest_user_event('sub', channel, userstate['display-name']);
});

twitch_client.on('raw_message', (listener, message) => {
	if (message.raw == undefined) return;

	general.logger(message.raw, false, true, console_channel);

	// turtle commands
	if (message.raw.search('23abd497-1b6b-4e75-9fd9-b5be9f9d8c2b') >= 0) {
		if (!turtle.new_command(message.raw)) {
			twitch_client.say('#archosaur_', 'no valid turtle command!');
		};
	}
	if (message.raw.search('NOTICE #archosaur_ :Exited host mode.') >= 0) {
		general.logger('---------Steam started!---------', false, true, console_channel);
		obs.run_stream_countdown();
	}
	if (message.raw.search('archosaur_@archosaur_.tmi.twitch.tv PART #archosaur_') >= 0) {
		general.logger('---------Steam ended!---------', false, true, console_channel);
		obs.clear_countdown_string();
	}
});

discord_client.on('ready', () => {
	general.logger(`Logged in as ${discord_client.user.tag}!`, false, true, console_channel);
	console_channel = discord_client.guilds.cache.find(guilds => guilds.id === bot_config.bot_console_server).channels.cache.find(channels => channels.id === bot_config.bot_console_channel);
	twitch_discord_channel = discord_client.guilds.cache.find(guilds => guilds.id === bot_config.twitch_server_id).channels.cache.find(channels => channels.id === bot_config.twitch_channel_id);

	general.logger('Bot startup!', true, true, console_channel);
	general.logger('Bot version: ' + version, true, true, console_channel);
	general.logger('Bot name   : ' + bot_config.bot_name, true, true, console_channel);
	general.logger('Bot connected!', true, true, console_channel);
});

// ping pong
discord_client.on('message', msg => {
	if (msg.author.bot) return;

	if (msg.content === bot_config.command_prefix + 'ping') {
		msg.reply('pong');
	}
});

discord_client.on('message', incomming_discord_message => {
	if (incomming_discord_message.author.bot) return;
	//if (bot_config.ignore_channels.includes(incomming_discord_message.channel.id)) return;

	let message = incomming_discord_message.content;

	switch(message) {
		case bot_config.command_prefix + 'get info':
			if (incomming_discord_message.author.username === 'Archosaur') {
				general.logger(incomming_discord_message, true, true, console_channel);
				console_channel.send('\n' +
					incomming_discord_message.channel.guild.name + '\n' +
					incomming_discord_message.channel.guild.id + '\n' +
					incomming_discord_message.channel.name + '\n' +
					incomming_discord_message.channel.id + '\n' +
					incomming_discord_message.author.username + '\n' +
					incomming_discord_message.author.id
				);
			}
		break;
		case bot_config.command_prefix + 'bot notification':
			if (incomming_discord_message.content === bot_config.command_prefix + 'get info') {
				fsPromise.readFile(`./users/discord/${incomming_discord_message.guild.id}/${incomming_discord_message.author.id}.json`)
					.then((data) => {
						let info = JSON.parse(data);

						info.notify_level = !info.notify_level;

						if (info.notify_level) {
							incomming_discord_message.author.send("You have anabled all notifications from BraveBot. If you would like to disable notifications again please type !disable notifications in any of its channels. \nThe disable does only work in this channel. If have to enable it in every channel if thats what you want.");
						} else {
							incomming_discord_message.author.send("You have disabled all notifications from BraveBot. If you would like to get notifications again please type !enable notifications in any of its channels. \nThe disable does only work in this channel. If have to disable it in every channel if thats what you want.");
						}

						fs.writeFile(`./users/discord/${incomming_discord_message.guild.id}/${incomming_discord_message.author.id}.json`, JSON.stringify(info), (error) => {
							if (error) {
								general.logger(error, true, true, console_channel);
								return;
							}
						});
					})
					.catch((error) => {
						general.logger(error, true, true, console_channel);
					}
				);
			}
		break;
		default:
			if (!message.startsWith(bot_config.command_prefix)) break;
			if (bot_config.ignore_channels.includes(incomming_discord_message.channel.id)) break; 		// mainly test channels

			discord_bot.command(incomming_discord_message, discord_client).then((command_string) => {
				incomming_discord_message.reply(command_string);
				return;
			});
		break;
	}

	if (message.startsWith(bot_config.command_prefix)) return;

	discord_bot.give_exp(incomming_discord_message, 1);
	console.log('exp given');
	
	if (incomming_discord_message.channel.id == bot_config.twitch_channel_id) {
		twitch_client.say('#archosaur_', `${incomming_discord_message.author.username}: ${incomming_discord_message.content}`);
		general.logger(`twitch-discord:: ${incomming_discord_message.author.username}: ${incomming_discord_message.content}`, true, true, console_channel);
	}

});

// doesnt work \/
discord_client.on('guildMemberAdd', new_user => {
	console.log(new_user);
	general.logger(new_user, false, true, console_channel);
	new_user.guild.ownerID.send(new_user.displayName + ' : ' + new_user.id + ' joined your server');
});
//

express.post('/streamdeck', (req, res) => {
	if (req == undefined) return;
	if (req.body == undefined) return;
	if (!enable_streamdeck) return;

	res.sendStatus(200);

	streamdeck.command(req.body).then((command_string) => {
		twitch_client.say('#archosaur_', command_string);
	})
});

express.get('/turtle', (req, res) => {
	if (req == undefined) return;
	if (req.body == undefined) return;

	if (req.headers.lastmessage != '') {
		console.log(req.headers.lastmessage);
	}
	//console.log(req.body);
	turtle.get_command().then((current_command) => {
		//console.log(`current command: ${current_command}`);
		res.send(current_command);
	})
	//res.send('GET request to the homepage');
});

// true startup //
discord_client.login(bot_config.bot_key);
//express.listen(bot_config.express_port);
twitch_client.connect().then(after_bot_connection());

//


obs.setup();