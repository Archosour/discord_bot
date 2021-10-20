const { count }     = require('console');
const fs 			= require('fs');
const general	    = require('./general.js');

const file_path     = 'temp/';

const countdown = {
    path        : file_path + "stream_countdown",
    time        : 120000,
    prefix      : "Stream starts in: ",
    before_line : "  ",
    after_line  : "Stream starts in any moment.",
    after_delay : 15000
}

function update_file(path, data) {
    fs.writeFile(path, data, error => {
        if (error) {
            console.log('error countdown', error);
            console.log(data);
        }
    });
}

module.exports.setup = function setup() {
    update_file(countdown.path, countdown.before_line);
}

module.exports.run_stream_countdown = function run_stream_countdown() {
    for (n = countdown.time; n > 0 ; n -= 500) {
        let time_string = general.timestamp_to_string(n);

        setTimeout(() => {
            update_file(countdown.path, countdown.prefix + time_string);
        }, countdown.time - n);
    }

    setTimeout(() => {
        update_file(countdown.path, countdown.after_line);
    }, countdown.time + countdown.after_delay);

    setTimeout(() => {
        //this.clear_countdown_string();
        console.log('would nornally clear countdown string');
    },(countdown.time * 2));
}

module.exports.clear_countdown_string = function clear_countdown_string() {
    update_file(countdown.path, countdown.before_line);
}


module.exports.set_latest_user_event = function set_latest_user_event(event = 'test_event', channel = '1234', name = 'test_name') {
    update_file(`${file_path}/twitch/${channel}/${event}.json`, name);
}

module.exports.set_latest_cheer = function set_latest_cheer() {
    
}










