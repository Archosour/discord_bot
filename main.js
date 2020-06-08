const Discord = require('discord.js');
const https = require('https');
const pingMonitor = require('ping-monitor');
const fs = require('fs');
const fsPromise = fs.promises;

const general = require('./modules/general.js');
const runescape = require('./modules/runescape.js');
const messages = require('./configs/messages.json');
const urls = require('./configs/urls.json');
const paths = require('./configs/paths.json');
const discord_xp_table = require('./configs/discord_xp_table.json');

// botkey //
const bot_config = require('./bot_config.json');

// Discord //
const client = new Discord.Client();
var connected_to_discord = false;


const discord_server_admins = [
	'367767515771830309',	// Archosaur
]

// all stuff Lotro related //
var ping_monitor_interval = 1; // minutes
var lotro_server_status = true;

const lotro_server_ips = 	[
	'198.252.160.98', 	// Arkenstone
	'198.252.160.99',	// Branywine
	'198.252.160.100',	// Crickhollow
	'198.252.160.101',	// Gladden
	'198.252.160.102',	// Landroval
	'198.252.160.103',	// Belegear
	'198.252.160.104',	// Evernight
	'198.252.160.105',	// Gwaihir
	'198.252.160.106',	// Laurelin
	'198.252.160.107'	// Sirannon
];

const myPingMonitor = new pingMonitor({
	address: 	lotro_server_ips[2],
	port:		9000,
    interval: 	ping_monitor_interval
});

var current_lotro_beacon_issue;

// all stuff Runescape related //
const allows_GE_channels =  [
	'710989901075578913', 	// test server - general
	'717117965673300028',	// test server - test general
	'713130722097102908'	// Brave Company - runescape
];	

// console for debugging //
var console_channel;


// timeout settings //
var people_on_timeout = {};
const max_before_message_timeout = 5;
const time_to_reset_message_timeout = 5; // minutes
const interval_to_reset_message_timneout = time_to_reset_message_timeout * 60 * 1000;

// General //
const prefix = '!';
const version = '1.2.0';

// functions //
function log_to_discord_console(to_log_thingy) {
	if (typeof console_channel === 'undefined') {
		console.log(console_channel);
		return;
	}
	if (typeof to_log_thingy == 'string') {
		console_channel.send(to_log_thingy);
	}
}

function check_people_for_timeout(userID) {
	if (discord_server_admins.includes(userID)) return false;

	if (people_on_timeout[userID] == max_before_message_timeout) {
		return true;
	} else {
		people_on_timeout[userID] = (people_on_timeout[userID] + 1) || 1;
		console.log(people_on_timeout[userID]);
		return false;
	}
}

function alert_people_on_timeout(messageObject) {
	messageObject.reply(messages.discord_reply_on_timeout);
}

function reply_back_to_user(messageObject, message) {
	if (check_people_for_timeout(messageObject.author.id)) {
		alert_people_on_timeout(messageObject);
		return;
	}
	messageObject.reply(message);
}

async function GetLatestArticleURL() {
	const baseURL = 'https://www.lotro.com/en/game/articles';
	return new Promise((resolve,reject) => {
		// Use HTTPS module to fetch data from url          
		https.get(baseURL, (resp) => {
			let data = '';
	
			// Event: data -> As long as we receive a response (long html code for ex.) keep adding chunks of data to "data" variable
			resp.on('data', (chunk) => {
				data += chunk;
			});
		
			// Event: response ended - we received all data
			resp.on('end', () => {
				var re = /lotro-beacon-issue-\d\d\d/gm; // define a "regular expression"
				let result = data.match(re); // match data against our regular expression
				// take the result from regular expression and sort it by last
				resolve(baseURL + '/' + result.sort(function (a, b) {
					return a.attr - b.attr
				})[0]
				);
			});
		}).on("error", (err) => {
			console.log("Error: " + err.message);
			reject(err.message);
		});
	});
// Thanks to Grumpyoldcoder and Samwai.
}

function check_JSON_files() {
	let ready_to_go = true;
	function get_length(Obj, length) {
		if (Object.keys(Obj).length != length) {
			console.log(`ERROR - JSON - on ${Obj.constructor.name}`);
			ready_to_go = false;
		}
	}
	get_length(messages, 6);
	get_length(urls, 2);
	get_length(bot_config, 4);
	get_length(paths, 1);
	if (bot_config.bot_key == undefined) {
		console.log('botkey missing');
		ready_to_go = false;
	}
	return ready_to_go;
}

function add_new_discord_user(user_id, guild_id, usernme) {
	if (user_id === undefined) return;
	if (typeof user_id !== 'string') return;

	let guild_path = `${paths.discord_users}/${guild_id}`;
	let user_path = `${guild_path}/${user_id}.json`;

	let new_info = {
		user_id : user_id,
		username : usernme,
		discord_xp : "1",
		discord_level : "0"
	}

	function write_to_file() {
		fs.writeFile(user_path, JSON.stringify(new_info),(error) => {
			if (error) {
				console.log('to write file error');
				console.log(error);
			}
		});
	}

	fsPromise.mkdir(guild_path)
	.then(write_to_file())
	.catch((error) => {
		if (error.code === 'EEXIST') {
			console.log(`new user ${user_id} : ${username}`);
			write_to_file();
			
		} else {
			console.log(error);
		}
	});
}

function calculate_discord_level(exp) {
	let level = 0;
	let array_of_xp = discord_xp_table.normal;

	console.log(array_of_xp);
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

// Discord setup
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	console_channel = client.guilds.cache.find(guilds => guilds.id === general.console_server_ID).channels.cache.find(channels => channels.id === bot_config.bot_console_channel);
	//console.log(client);
	log_to_discord_console('Bot startup!');
});

// ping pong
client.on('message', msg => {
	if (msg.author.bot) return;
	
	if (msg.content === 'ping') {
		reply_back_to_user(msg, 'pong');
	}
});

// Command 'handler'
client.on('message', incomming_discord_message => {
	// command example: !lotro servers
	if (incomming_discord_message.author.bot) return;
	if (!incomming_discord_message.content.startsWith(prefix)) return;
	if (bot_config.ignore_channels.includes(incomming_discord_message.channel.id)) {
		console.log('wrong channel');
		return;
	}
	let arguments = incomming_discord_message.content.toLocaleLowerCase().slice(1).split(' ');
	console.log(arguments);
	let command = arguments.shift();

	switch(command){
		case 'help':
			reply_back_to_user(incomming_discord_message, 'List of commands: ' + urls.brave_bot_command_list);
			break;
		case 'commands':
			reply_back_to_user(incomming_discord_message, 'List of commands: ' + urls.brave_bot_command_list);
			break;
		case 'ge':
			if (!allows_GE_channels.includes(incomming_discord_message.channel.id)) return;
			
			let ge_command = arguments.shift();
			let new_message = client.guilds.cache.find(guilds => guilds.id === incomming_discord_message.channel.guild.id).channels.cache.find(channels => channels.id === incomming_discord_message.channel.id);
			switch(ge_command) {
				case 'all':
					if (incomming_discord_message.author.username === 'Archosaur' && incomming_discord_message.author.id === '367767515771830309') {
						for (let [key, value] of Object.entries(runescape.OSRS_ge_current_prices)) {
							new_message.send(value);
							//console.log(value);
						}
					} else {
						reply_back_to_user(messages.no_permission_to_use_command);
					}
					break;
				default:
					if (typeof ge_command === 'undefined') return;

					let information =  runescape.OSRS_ge_current_prices[ge_command];
									
					if (typeof information !== 'undefined') {
						reply_back_to_user(incomming_discord_message, information);
					} else if (typeof information === 'undefined') {
						reply_back_to_user(incomming_discord_message, runescape.OSRS_error_message);
					}
			}
			break;
		case 'get':
			let get_command = arguments.shift()
			switch(get_command) {
				case 'info':
					if (incomming_discord_message.author.username === 'Archosaur') {
					console.log(incomming_discord_message);
					console_channel.send( '\n' +
						incomming_discord_message.channel.guild.name + '\n' +
						incomming_discord_message.channel.guild.id + '\n' +
						incomming_discord_message.channel.name + '\n' +
						incomming_discord_message.channel.id + '\n' +
						incomming_discord_message.author.username + '\n' +
						incomming_discord_message.author.id
					);
					} else {
						incomming_discord_message.reply(messages.no_permission_to_use_command);
					}
					break;
				case 'userinfo':
					reply_back_to_user(incomming_discord_message, '\n' +
						'username:            ' + incomming_discord_message.author.username + '\n' +
						'user ID:                 ' + incomming_discord_message.author.id + '\n' +
						'bot:                        ' + incomming_discord_message.author.bot + '\n' +
						'avatar:                   ' + incomming_discord_message.author.avatar + '\n' +
						'last message ID:  ' + incomming_discord_message.author.lastMessageID + '\n' +
						'joined at (Unix):   ' + incomming_discord_message.channel.guild.joinedTimestamp
					);
					break;
				case 'botinfo':
					reply_back_to_user(incomming_discord_message, '\n' +
						'bot name:             ' + bot_config.bot_name + '\n' +
						'bot version:          ' + version + '\n' +
						'bot startup time: ' + general.timestamp_to_string(client.readyTimestamp) + '\n' +
						'bot uptime:           ' + general.uptime_to_string(client.uptime) + '\n'
					);
					break;
				default:
					reply_back_to_user(incomming_discord_message, messages.no_command_available);
			}
			break;
		case 'coffee':
			reply_back_to_user(incomming_discord_message, 'error: 418');
			break;
		case 'lotro':
			let lotro_command = arguments.shift()
			if (lotro_command === 'servers') {
				if (lotro_server_status) {
					incomming_discord_message.reply(messages.lotro_server_online);
				} else {
					incomming_discord_message.reply(messages.lotro_server_offline);
				}
			} else if (lotro_command === 'beacon') {
				GetLatestArticleURL().then((latestArticleURL) => {
					console.log(latestArticleURL);
					reply_back_to_user(incomming_discord_message, latestArticleURL);
				});
				
			} 
			break;
		case 'github':
			reply_back_to_user(incomming_discord_message, urls.github_brave_bot);
			break;
		default:
			reply_back_to_user(incomming_discord_message, messages.no_command_available);
	}
});

// Leveling system
client.on('message', incomming_discord_message => {
	if (incomming_discord_message.author.bot) return;
	if (incomming_discord_message.content.startsWith(prefix)) return;

	fsPromise.readFile(`${paths.discord_users}/${incomming_discord_message.guild.id}/${incomming_discord_message.author.id}.json`)
		.then((data) => {
			let info = JSON.parse(data);
			info.discord_xp ++;
			let level = calculate_discord_level(info.discord_xp);
			if (level > info.discord_level) {
				info.discord_level = level;
				// notify user, to be added -=-=-=-=-=-=-=-=-=-=-
				incomming_discord_message.author.send(`You have leveled! You have now level: ${level} Bravery.`);
			}
			
			console.log(info);

			fs.writeFile(`${paths.discord_users}/${incomming_discord_message.guild.id}/${incomming_discord_message.author.id}.json`, JSON.stringify(info), (error) => {
				if (error) {
					console.log(error);
					return;
				}
			});
		})
		.catch((error) => {
			if (error.code === 'ENOENT') {
				add_new_discord_user(incomming_discord_message.author.id, incomming_discord_message.guild.id, incomming_discord_message.author.username);
			} else {
				console.log(error);
			}
			
		});
	});

// Lotro ping test //
myPingMonitor.on('up', function (res, state) {
	if (ping_monitor_interval != 5) {
		console.log('Yay!! ' + res.address + ':' + res.port + ' is up.');
		setTimeout(function() {
			log_to_discord_console(messages.lotro_server_online);
		}, 1000);
		
	}
	ping_monitor_interval = 5;
	lotro_server_status = true;
});

myPingMonitor.on('down', function (res, state) {
	if (ping_monitor_interval != 1) {
		console.log('Oh Snap!! ' + res.address + ':' + res.port + ' is down! ');
		setTimeout(function() {
			log_to_discord_console(lotro_server_offline);
		}, 1000);
	}
	ping_monitor_interval = 1;
	lotro_server_status = false;
});

myPingMonitor.on('timeout', function (error, res) {
    console.log(error);
});

myPingMonitor.on('error', function (error, res) {
	if (res.code === 'ECONNREFUSED') {
		if (ping_monitor_interval != 1) {
			console.log('Oh Snap!! ' + res.address + ':' + res.port + ' is down! ');
			setTimeout(function() {
				log_to_discord_console(messages.lotro_server_offline);
			}, 1000);
		}
		ping_monitor_interval = 1;
		lotro_server_status = false;
	} else {
		console.log(error);
	}
});

// Timers //
setInterval(function() {
	if (Object.keys(people_on_timeout).length > 0) {
		log_to_discord_console('timeout counter reset on set interval');
	}
	people_on_timeout = {};
}, interval_to_reset_message_timneout);

// true startup //
if (check_JSON_files()) {
	console.log('JSON loaded correctly');
}

runescape.update_ge_prices();
runescape.keep_ge_uptodate();

client.login(bot_config.bot_key);
