const https =           require('https');
const http =            require('http');
const fs =              require('fs');
const main_consts =     require('./../main.js');
const bot_name =        require('./../bot_config.json').bot_name;
const general =         require('./general.js');
const urls =            require('./../configs/urls.json');
const bot_config =      require('./../bot_config.json');
const ff14 =            require('./ff14.js');

let giveaway_entries =  [];
const runescape_dir =   'C:/nodejs/runescape/database/osrs/';

/*
    exportFuction = {
        function : function somethng() {

        },
        add_to_timeout : true,
        cost : 500
    }
*/

module.exports.processor = function command_processor(channel, username, message, mod, subbed, platform) {
	return new Promise((resolve, reject) => {
		if (message == undefined || message == '') {
			resolve('No command found');
		}
        
		let user_input = message.toLocaleLowerCase().slice(bot_config.command_prefix.length);
		let arguments_start = user_input.search(' ');
		let command = user_input;
		let arguments;

		if (arguments_start >= 0) {
			command = user_input.slice(0, arguments_start);     	// does not include the prefix
			arguments = user_input.slice(arguments_start + 1);  	// to get rid of the prefix
		}

        if (username == 'archosaur_' || username == 'Archosaur') mod = true; // temp fix to include myself as a mod

		console.log(user_input);
		console.log(arguments);
		console.log(arguments_start);
		console.log(command);
        console.log(mod);
        
		try {
			module.exports[command].function(channel, username, arguments, mod, subbed, platform).then((return_string) => {
				console.log(return_string);
				resolve(return_string);
			});
		} catch (error) {
			resolve('No command found');
		}
	});
}

module.exports.coffee = {
    function : function coffee(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            resolve('error 418');
        });
    },
    add_to_timeout : true,
    cost : 50
}

module.exports.commands = {
    function : function commands(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            resolve('http://archosaur.nl/bravebot.html');
        });
    },
    add_to_timeout : true,
    cost : 0
}

module.exports.date = {
    function : function date(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            resolve(Date());
        });
    },
    add_to_timeout : true,
    cost : 10
}

module.exports.eorzeadate = {
    function : function eorzeatime(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            resolve(ff14.date());
        });
    },
    add_to_timeout : true,
    cost : 10
}

module.exports.eorzeatime = {
    function : function eorzeatime(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            resolve(ff14.time());
        });
    },
    add_to_timeout : true,
    cost : 10
}

module.exports.ge = {
    function : function ge(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            if (!arguments) resolve('No id found.');
            let item_id =       Number(arguments);

            if (item_id > 0) {
                let date =      new Date();
                let timestamp = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                let rs_path =   runescape_dir + item_id + '/' + timestamp + '.json';

                fs.readFile(rs_path, (error, data) => {
                    if (error) {
                        if (error.errno === -4058) resolve('no item found with id: ' + item_id);
                        console.log(error);
                    } else {
                        data =  JSON.parse(data);
                        
                        let return_string = `${data.item.name} is worth ${data.item.current.price} and changed ${data.item.today.price} gp.`;
                        resolve(return_string);
                    }
                });
            }
        });
    }, 
    add_to_timeout : true,
    cost : 100
}

module.exports.botinfo = {
    function : function get_botinfo(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            let return_string = ' ';

            switch(platform) {
                case 'twitch' :
                    return_string =
                        'Name: ' + 'The_Brave_bot' + 
                        ',Version: ' + main_consts.version + 
                        ',Startup at: ' + general.timestamp_to_string(main_consts.bot_startup_time) +
                        ',Uptime: ' + general.uptime_to_string(Date.now() - main_consts.bot_startup_time);
                    resolve(return_string);
                    break;

                case 'discord' :
                    return_string = '\n' +
                        'bot name:             ' + bot_name + '\n' +
                        'bot version:          ' + main_consts.version + '\n' +
                        'bot startup time: ' + general.timestamp_to_string(channel.readyTimestamp) + '\n' +
                        'bot uptime:           ' + general.uptime_to_string(channel.uptime) + '\n'
                    resolve(return_string);
                    break;
                default:
                    console.log('platform not implemented');
            }
        });
    },
    add_to_timeout : true,
    cost : 50
}

module.exports.botnotification = {
    function : function bot_notification(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            switch(platform) {
                case 'discord':
                    resolve('Please check your direct messages.');
                break;
                case 'twitch':
                    resolve('Command is not for Twitch.');
                break;
                default:
                    console.log('bot notification platform not implemented' + platform);
            }
        });
    },
    add_to_timeout : true,
    cost : 0
}

module.exports.hardwareinfo = {
    function : function get_hardwareinfo(channel, username, arguments = 0, mod, subbed, platform) {
        function hardwareinfo_to_string(Object) {
            if (typeof Object != 'object') return 'device offline';
        
            let cpu_model =         Object.cpus[0].model.slice(0, -9) + ' @ ' + Object.cpus[0].speed + 'MHz';
            let mem_tot =           general.bytes_to_size(Object.totalmem);
            let mem_use =           general.bytes_to_size(Object.usedmem);
            let mem_use_percent =   Math.floor((Object.usedmem / Object.totalmem) * 100) + '%';
            let system_uptime =     general.uptime_to_string(Object.uptime * 1000);
        
            let return_string =     'CPU: ' + cpu_model + 
                                    ', GPU: ' + Object.gpu + 
                                    ', Memory: ' + mem_use + ' in use (' + mem_use_percent + ') of: ' + mem_tot + 
                                    ', System uptime: ' + system_uptime;
        
            return return_string;
        }
        
        return new Promise((resolve, reject) => {
            Promise.allSettled([general.get_hardware_info('local'), general.get_hardware_info(urls.gameIP), general.get_hardware_info(urls.nasIP), ])
            .then((values) => {
                let to_send_string = '';
                let argument = Number(arguments);
                
                switch(argument) {
                    case 0: 
                        to_send_string = 'Bot system: ';
                    break;
                    case 1: 
                        to_send_string = 'Game pc: ';
                    break;
                    case 2: 
                        to_send_string = 'Nas/Host: ';
                    break;
                    default:
                }

                if (values[argument].status === 'fulfilled') { 
                    to_send_string += 'Bot system:' + hardwareinfo_to_string(JSON.parse(values[argument].value));
                } else {
                    to_send_string += 'currently offline';
                }
                resolve(to_send_string);
            });
        });
    },
    add_to_timeout : true,
    cost : 500
}

module.exports.github = {
    function : function github(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            let return_string = ' ';

            switch(platform) {
                case 'twitch' :
                    return_string = 'Active: ' + urls.github_brave_bot + ', Testing: ' + urls.github_brave_testbot;
                    resolve(return_string);
                break;
                case 'discord' :
                    return_string = 'Active: ' + urls.github_brave_bot + '\nTesting: ' + urls.github_brave_testbot;
                    resolve(return_string);
                break;
                default:
                    console.log('platform not implemented yet');
            }
        });
    },
    add_to_timeout : true,
    cost : 0
}


module.exports.test = {
    function : function test(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            resolve('testing');
        });
    }, 
    add_to_timeout : true,
    cost : 0
}

module.exports.time = {
    function : function time(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            resolve(Date());
        });
    },
    add_to_timeout : true,
    cost : 10
}

module.exports.help = {
    function : function help(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            resolve('http://archosaur.nl/bravebot.html');
        });
    },
    add_to_timeout : true,
    cost : 0
}

module.exports.lotroserver = {
    function : function lotro_server(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve,reject) => {
            http.get('http://198.252.160.99:9000', (resp) => {
                
                resp.on('data', (chunk) => {
                });
                resp.on('end', () => {
                    resolve('servers are online');
                }).on("error", (err) => {
                    reject('servers are offline');
                });
            });
            setTimeout(() => {
                reject('timeout error');
            }, 2500);
        });
    },
    add_to_timeout : true,
    cost : 100
}

module.exports.lotrobeacon = {
    function : async function lotro_beacon(channel, username, arguments, mod, subbed, platform) {
        const baseURL = 'https://www.lotro.com/en/game/articles';
        return new Promise((resolve,reject) => {

            https.get(baseURL, (resp) => {
                let data = '';

                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    var re = /lotro-beacon-issue-\d\d\d/gm;
                    let result = data.match(re); // match data against our regular expression
                    // take the result from regular expression and sort it by last
                    resolve(baseURL + '/' + result.sort(function (a, b) {
                        return a.attr - b.attr
                    })[0]
                    );
                });
            }).on("error", (err) => {
                reject(err.message);
            });
        });
    // Thanks to Grumpyoldcoder and Samwai.
    },
    add_to_timeout : true,
    cost : 100
}

module.exports.lotroguide = {
    function : function lotro_guide(channel, username, arguments, mod, subbed, platform) {
        return new Promise((resolve, reject) => {
            if (username == undefined) return;
            
            arguments = arguments.toLocaleLowerCase();
            switch(arguments) {
                case 'farmer':
                    resolve('https://fibrojedi.me.uk/lotro/farmers-faire-event/');
                    break;
                case 'summer':
                    resolve('https://fibrojedi.me.uk/lotro/farmers-faire-event/');
                    break;
                case 'mid':
                    resolve('https://fibrojedi.me.uk/lotro/lotro-midsummer-festival-event/ and https://fibrojedi.me.uk/lotro/midsummer-quests-outside-minas-tirith/');
                    break;
                case 'spring':
                    resolve('https://fibrojedi.me.uk/lotro/spring-festival/');
                    break;
                case 'treasure':
                    resolve('https://fibrojedi.me.uk/lotro/lotro-buried-treasure-event-guide/');
                    break;
                case 'halloween':
                    resolve('https://fibrojedi.me.uk/lotro/wistmead-harvest-festival/');
                    break;
                case 'yule':
                    resolve('https://fibrojedi.me.uk/lotro/lotro-yule-festival/ and https://fibrojedi.me.uk/lotro/final-act-lotro-yule-festival/');
                    break;
                case 'fall':
                    resolve('https://fibrojedi.me.uk/lotro/lotro-fall-festival/');
                    break;
                default:
                    resolve('https://fibrojedi.me.uk/category/lotro/lotro-festival-guides/');
            }
        });
    }, 
    add_to_timeout : true,
    cost : 0
}

module.exports.so = {
    function : function so(channel, username, arguments, mod = false, subbed, platform) {
        return new Promise((resolve, reject) => {
            if (username == undefined) return;

            if (!mod && username != 'archosaur_') resolve('Sorry this command is only for mods');
            
            arguments = arguments.toLocaleLowerCase();
            switch(arguments) {
                case 'nel':
                    resolve('Checkout Nelnardis her Quali-tea stream over at https://www.twitch.tv/nelnardis');
                    break;
                case 'neb':
                    resolve('Checkout Neberski his stream over at https://www.twitch.tv/neberski');
                    break;
                case 'kate':
                    resolve('Checkout Kate Madison her stream over at https://www.twitch.tv/katemadison');
                    break;
                case 'myth':
                    resolve('Checkout Mythica Entertainment her stream over at https://www.twitch.tv/mythicaentertainment or at https://www.rentheseries.com/');
                    break;
                case 'miss':
                    resolve('Checkout Mrs_Thing her stream over at https://www.twitch.tv/miss_thing');
                    break;
                case 'mrs':
                    resolve('Checkout Mrs_Thing her stream over at https://www.twitch.tv/mrs_thing');
                    break;
                case 'muck':
                    resolve('Checkout muckshifter his stream over at https://www.twitch.tv/muckshifter');
                    break;
                case 'geek':
                    resolve('Checkout geekbyte his stream over at https://www.twitch.tv/geekbyte');
                    break;
                case 'ferde':
                    resolve('Checkout FerdeLance his stream over at https://www.twitch.tv/ferde_lance');
                    break;
                case 'joon':
                    resolve('Checkout GrandmasterJoon his stream over at https://www.twitch.tv/grandmasterjoon or at https://www.youtube.com/c/joon');
                    break;
                case 'bc':
                    resolve('Checkout GrandmasterJoon his stream over at https://www.twitch.tv/grandmasterjoon and Nelnardis over at her stream https://www.twitch.tv/nelnardis');
                    break;
                case 'dwarrow':
                    resolve('Checkout The Dwarrow Scholar over at his stream https://www.twitch.tv/thedwarrowscholar');
                    break;
                case 'geg':
                    resolve('Checkout TheGreenEyedGamer over at her stream https://www.twitch.tv/theegreeneyedgamer');
                    break;
                case 'miro':
                    resolve('Checkout Mirondira his stream over at https://www.twitch.tv/mirondira');
                    break;
                default:
                    resolve(`Checkout ${arguments} stream over at https://www.twitch.tv/${arguments}`);
            }
        });
    }, 
    add_to_timeout : true,
    cost : 0
}

module.exports.raffle = {
    function : function ramble(channel, username, arguments, mod, subbed = false, platform) {
        return new Promise((resolve, reject) => {
            if (username == undefined) return;

            if (giveaway_entries.includes(username)) {
                resolve(`You have already entered the giveaway.`);
            } else {
                giveaway_entries.push(username);
                if (subbed) {
                    giveaway_entries.push(username);
                }
            }
        });
    },
    add_to_timeout : true,
    cost : 0
}

module.exports.rafflereset = {
    function : function ramble_reset(channel, username, arguments, mod = false, subbed, platform) {
        return new Promise((resolve, reject) => {
            if (username == undefined) return;

            if (mod || username === 'archosaur_') {
                giveaway_entries = [];
                console.log(`giveaway was reset by ${username}`);
            } else {
                resolve('You do not have permission for this command');
            }
        });
    },
    add_to_timeout : true,
    cost : 0
}

module.exports.rafflestart = {
    function : function ramble_start(channel, username, arguments, mod = false, subbed, platform) {
        return new Promise((resolve, reject) => {
            if (username == undefined) return;

            if (mod || username === 'archosaur_') {
                giveaway_entries = [];
            } else {
                resolve('You do not have permission for this command');
            }
        });
    },
    add_to_timeout : true,
    cost : 0
}

module.exports.raffleadd = {
    function : function ramble_add(channel, username, arguments, mod = false, subbed, platform) {
        return new Promise((resolve, reject) => {
            if (username == undefined) return;

            if (mod || username === 'archosaur_') {
                giveaway_entries.push(arguments);

                console.log(`${arguments} was added by ${username}`);
            } else {
                resolve('You do not have permission for this command');
            }
        });
    },
    add_to_timeout : true,
    cost : 0
}

module.exports.raffleremove = {
    function : function ramble_remove(channel, username, arguments, mod = false, subbed, platform) {
        return new Promise((resolve, reject) => {
            if (username == undefined) return;

            if (mod || username === 'archosaur_') {
                let to_be_removed = giveaway_entries.indexOf(arguments)
                
                if (to_be_removed >= 0) {
                    giveaway_entries.splice(to_be_removed, 1);
                }
                
                console.log(`${arguments} was removed by ${username}`);
            } else {
                resolve('You do not have permission for this command');
            }
        });
    },
    add_to_timeout : true,
    cost : 0
}

module.exports.raffleend = {
    function : function ramble_end(channel, username, arguments, mod = false, subbed, platform) {
        return new Promise((resolve, reject) => {
            if (username == undefined) return;

            if (mod || username === 'archosaur_') {
                let number_of_users = giveaway_entries.length;
                let winnerID = Math.floor(Math.random() * number_of_users);
                let winner = giveaway_entries[winnerID];
                
                console.log(giveaway_entries);

                giveaway_entries = [];

                resolve(`The winner is: ${winner} !!`);
            } else {
                resolve('You do not have permission for this command');
            }
        });
    },
    add_to_timeout : true,
    cost : 0
}