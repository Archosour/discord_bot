const http 			= require('http');
const os 			= require('os');
const fs 			= require('fs');

function unix_timestamp_to_date_string(unix_time = 0) {
	let date = 			new Date(unix_time);
	let return_string = '';

	if (date.getFullYear() !== 1970) {
		return_string += `${date.getFullYear()}-`;
	}
	
	if (date.getMonth() !== 0) {
		return_string += `${number_add_zero(date.getMonth(), 2)}-`;
	}

	if (unix_time >= 86400000) {
		return_string += `${number_add_zero(date.getDate(), 2)}-`;
	}

	if (unix_time >= 3600000) {
		return_string += `${number_add_zero(date.getHours(), 2)}:`;
	}
	
	return_string += `${number_add_zero(date.getMinutes(), 2)}:`;
	return_string += `${number_add_zero(date.getSeconds(), 2)}`;

	return return_string;
}

function unix_uptime_to_date_string(unix_time = 0) {
	let date = new Date(unix_time);
	let return_string = '';
	let Unix_offset = 43200000  // 12 hours, since Unix starts at 12am

	logger(unix_time, false, true);

	if ((unix_time + Unix_offset) >= 86400000) { 
		return_string += `${Math.floor((unix_time + Unix_offset)/86400000)} days, `;
	}

	if (unix_time >= 3600000) {
		return_string += `${date.getHours()} hours, `;
	}

	if (unix_time >= 60000) {
		return_string += `${date.getMinutes()} mins, `;
	}

	return_string += `${date.getSeconds()} sec`;

	logger(return_string, false, true);

	return return_string;
}

function bytes_to_size(bytes) {
	if (bytes == 0) return '0 Byte';
	if (typeof bytes != 'number') return;

	return Math.round(bytes / Math.pow(1024, 2)) + ' MB';
}

function number_add_zero(input = 0, number_of_digits = 1) {
	let return_string = '0000000000' + input;
	return return_string.slice(-number_of_digits);
}	

function logger(input, discord = false, console_log = false, bot_console_channel, file = true ) {
	if (input == undefined) return;
	if (discord && typeof bot_console_channel !== 'object') return;

	let date = 				new Date();
	let timestamp_small = 	`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
	let timestamp_full = 	date;
	//let timestamp_full = 	`${timestamp_small}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}: `;
	
	if (console_log) {
		console.log(input);
	}

	if (discord) {
		switch(typeof input) {
			case 'string':
				bot_console_channel.send(input);
			break;
			case 'number':
				bot_console_channel.send(input.toString(10));
			break;
			case 'array':
				bot_console_channel.send(input.join());
			break;
			case 'object':
				let object_string = JSON.stringify(input)
				let length = 		object_string.length;
				if (length <= 149) {
					bot_console_channel.send(object_string);
				} else {
					bot_console_channel.send(`object was to large: ${length} characters long!`);
				}
			break;
			default:
				bot_console_channel.send(`unknown type: ${typeof input}`);
		}
	}

	if (file) {
		switch(typeof input) {
			case 'string':
				fs.appendFile('./logs/' + timestamp_small + '.txt', timestamp_full + input + '\n', (error) => {
					if (error) {
						console.log(error);
					}
				});
			break;
			case 'number':
				fs.appendFile('./logs/' + timestamp_small + '.txt', timestamp_full + input.toString(10) + '\n', (error) => {
					if (error) {
						console.log(error);
					}
				});
			break;
			case 'array':
				fs.appendFile('./logs/' + timestamp_small + '.txt', timestamp_full + input.join() + '\n', (error) => {
					if (error) {
						console.log(error);
					}
				});
			break;
			case 'object':
				let object_string = JSON.stringify(input)
				fs.appendFile('./logs/' + timestamp_small + '.txt', timestamp_full + object_string + '\n', (error) => {
					if (error) {
						console.log(error);
					}
				});
			break;
			default:
				console.log(`unknown type: ${typeof input}`);
		}
	}
}

function bytes_to_size_proper(bytes) {
	if (bytes == 0) return '0 Byte';
	if (typeof bytes != 'number') return;

	let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
	
	let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
	return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function get_hardware_info(IP_string) {
	let info = {};
	return new Promise((resolve, reject) => {
		if (IP_string === 'local') {
			info.arch = 	os.arch();
			info.cpus = 	os.cpus();
			info.freemem = 	os.freemem();
			info.platform = os.platform();
			info.totalmem = os.totalmem();
			info.usedmem = 	os.totalmem() - os.freemem();
			info.type = 	os.type();
			info.uptime = 	os.uptime();
			info.gpu = 		'none placed';

			if (info.cpus != undefined) {
				resolve(JSON.stringify(info));
			} else {
				reject('error on loading hardware');
			}
		} else {
			get_info_form_pc(IP_string)
			.then((info) => {
				resolve(info);
			})
			.catch((error) => {
				reject(error);
			});
		}
	});
}

function get_info_form_pc(IP) {
	return new Promise((resolve, reject) => {
		const req = http.get(IP, (res) => {
			if (res.statusCode != '200') {
				console.log(res.body);
				reject(res.body);
			}
			res.on('data', data => {
				resolve(data);
			});
		});
		req.on('error', error => {
			console.error(`Error message 1\n ${error}`);
			reject('device offline');
		});
		req.end();

		setTimeout(() => {
			reject('device offline');
		}, 1000);
	});
}

module.exports.logger = 				logger;
module.exports.get_hardware_info = 		get_hardware_info;
module.exports.timestamp_to_string = 	unix_timestamp_to_date_string;
module.exports.uptime_to_string = 		unix_uptime_to_date_string;
module.exports.bytes_to_size = 			bytes_to_size;