const time_constant = 3600/175;
const time_offset   = 146;

module.exports.timestamp = function timestamp() {
    let time_now = Date.now() - time_offset;
    let eorzea_time = Math.floor((time_now * time_constant));
    return eorzea_time;
}

module.exports.time_string = function time_string() {
    let time = this.timestamp();
    let return_string = new Date(time).toISOString().
        replace(/T/, ' ').
        replace(/\..+/, '');
    
    return return_string;
}

module.exports.time = function time() {
    let time = this.time_string();
    let return_string = time.slice(11, -3);
    
    return return_string;
}

module.exports.date = function date() {
    let time = this.time_string();
    let return_string = time.slice(0, 10);
    
    return return_string;
}
