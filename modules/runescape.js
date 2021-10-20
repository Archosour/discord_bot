//const https = require('follow-redirects');
const https = require('https');
const fs = require('fs');
const fsPromise = fs.promises;
const general = require('../modules/general.js');
//const { version } = require('punycode');

//https://www.osrsbox.com/tools/item-search/
const itemIDs = {
	general_IDs : 		[1935, 1033, 314 , 1511, 1513, 1515, 1517, 1519, 1521, 1381, 1387, 1925],
	wood_IDs : 			[1511, 1513, 1515, 1517, 1519, 1521 ],
	ores_IDs : 			[436 , 438 , 440 , 442 , 444 , 447 , 449 , 451],
	bars_IDs : 			[2349, 2351, 2353, 2355, 2357, 2359, 2361, 2363],
	magicrunes_IDs : 	[554 , 555 , 556 , 559 , 560 , 561 , 563 , 564 , 1436, 7936],
	zamorak_IDs : 		[1033, 1035, 245 , 2653, 2655, 2657, 2659, 3478],
	guthix_IDs : 		[2669, 2671, 2673, 2675, 3480],
	saradomin_IDs : 	[2661, 2663, 2665, 2667, 3479],
	robes_IDs : 		[542 , 544 , 1033, 1035, 577 , 581 , 7390, 7394 , 7392, 7396 , 12449 , 12451]
}

const minutes_between_info_refesh = 	30;
const interval_between_info_refresh = 	minutes_between_info_refesh * 60 * 1000;
var OSRS_ge_current_prices = 			{};

function write_to_item_file(item_id, info, dir) {
	let input;
	if (typeof info === 'object') {
		input = JSON.stringify(info);
	} else {
		input = info;
	}
	fs.writeFile(dir + item_id + '.json', input, (error) => {
		if (error) {
			if (error.code !== 'EEXIST') {
				general.logger(error, true, true, console_channel);
			}
		}
	});
}

function read_from_item_file(item_id, dir) {
	return new Promise((resolve, reject) => {
		fs.readFile(dir + item_id + '.json', (error, data) => {
			if (error) {
				general.logger(error, true, true, console_channel);
				reject('error');
			} else {
				resolve(JSON.parse(data));
			}
		});
	})
}

function fetchData(array_of_IDs, message_type_input, version_osrs = true) {
	let j = 			0;
	let newData = 		'\n'; 
	let IDs = 			array_of_IDs.length;
	let message_type = 	message_type_input;
	let rs_dir;

	if (version_osrs) {
		rs_dir = 		'./runescape/osrs/items/';
	} else {
		rs_dir = 		'./runescape/rs3/items/';
	}

	function proces_data(data, j, IDs) {
		newData = newData + `${data.item.name}: ${data.item.current.price}: ${data.item.today.price} \n`;		
		if (j == IDs) {
			if (typeof newData !== 'undefined') {
				OSRS_ge_current_prices[message_type] = (OSRS_ge_current_prices[message_type] = newData) || newData;
			}
		}
	}

	array_of_IDs.forEach(function(item_id) {
		if (item_id == undefined) return;

		j++;
		make_rs_get_request(item_id, version_osrs)
		.then((data) => {
			write_to_item_file(item_id, data, rs_dir);
			proces_data(data, j, IDs);
		})
		.catch((error) => {
			read_from_item_file(item_id, rs_dir)
			.then((data) => {
				proces_data(data, j, IDs);
			});
		})
	});
}

function get_single_item(item_id, version_osrs = true) {
	let rs_dir;

	if (version_osrs) {
		rs_dir = './runescape/osrs/items/';
	} else {
		rs_dir = './runescape/rs3/items/';
	}

	return new Promise((resolve, reject) => {
		make_rs_get_request(item_id, version_osrs)
		.then((data) => {
			write_to_item_file(item_id, data, rs_dir);
			//console.log(data);
			resolve(`${data.item.name}: ${data.item.current.price}: ${data.item.today.price} \n`);
		})
		.catch((error) => {
			console.log(error);
			if (error === 'offline') {
				read_from_item_file(item_id, rs_dir)
				.then((data) => {
					resolve(`${data.item.name}: ${data.item.current.price}: ${data.item.today.price} \n`);
				})
				.catch(reject(error));
			}
		})
	});
}

function make_rs_get_request(item_id, version_osrs) {
	let rs_url;

	if (version_osrs) {
		//rs_url = 'https://services.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item=' + item_id;
		rs_url = 'https://secure.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item=' + item_id;
	} else {
		rs_url = 'https://secure.runescape.com/m=itemdb_rs/api/catalogue/detail.json?item=' + item_id;
	}
	return new Promise((resolve, reject) => {
		const req = https.get(rs_url, (res) => {
			let data = '';

			if (res.statusCode != 200) {
				console.log(res.statusCode);
				reject('offline0');
			}
			res.on('data', (chunk) => {
				data += chunk;
			})

			res.on('end', () => {
				if (data.length !== 0) {
					resolve(JSON.parse(data));
				} else {
					reject('no data');
				}
			});
		});
		req.on('error', error => {
			console.error(`Error message 1\n ${error}`);
			reject('offline1');
		});
		req.end();

		setTimeout(() => {
			reject('offline2');
		}, 10000);
	});
}

function update_ge_prices() {
    let extra_delay = 0;
    for (let [key, value] of Object.entries(itemIDs)) {
        extra_delay = extra_delay + 3000;
        setTimeout(function() {
            fetchData(value, key.slice(0, -4), );
        }, extra_delay);
    }

    module.exports.OSRS_ge_current_prices = OSRS_ge_current_prices;
    return true;
}

function keep_ge_uptodate() {
	update_ge_prices();
	setInterval(() => {
		update_ge_prices();
	}, interval_between_info_refresh);
}

function init() {
	fsPromise.mkdir('./runescape')
	.then(fsPromise.mkdir('./runescape/osrs'))
	.then(fsPromise.mkdir('./runescape/osrs/items'))
	.then(fsPromise.mkdir('./runescape/rs3'))
	.then(fsPromise.mkdir('./runescape/rs3/items'))
	.then(console.log('runescape init finished'))
	.catch((error) => {
		if (error.code !== 'EEXIST') {
			general.logger(error, true, true, console_channel);
			//console.log();
		}
	});
}

module.exports.get_single_item = get_single_item;
module.exports.init = init;
module.exports.keep_ge_uptodate = keep_ge_uptodate;