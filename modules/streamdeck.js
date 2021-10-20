const commands 		= require('./../modules/commands.js');

module.exports.command = function command(body) {
    return new Promise((resolve, reject) => {
        let input = JSON.parse(body.statuses);
        let input_string = input.s0;
        let mode = input.mode;
        let board = 0;

        let pin = input_string.indexOf('0');
        if (pin === -1) return;

        console.log('streambeck pin: ' + pin);

        let user_input = convert_to_command(pin, mode, board, bot_config.command_prefix);
        if (user_input == undefined || user_input == '') return;

        console.log('new command: ' + user_input);

        let platform = 'twitch';
        let subbed = true;
        let username = 'archosaur_';
        let mod = true;
        let channel = '#archosaur_';

        commands.processor(channel, username, user_input, mod, subbed, platform).then((return_string) => {
            console.log('streamdeck return string: ' + return_string);
            resolve(return_string);
        });
    });
}



module.exports.convert_to_command = function convert_to_command(input, mode = 0, board = 0, prefix) {
    if (input == undefined) return;
    
    let new_command = '';

    if (mode == 1) {
        if (board == 0) {
            switch(input) {
                case 0:
                    return prefix + 'so kate';
                case 1:
                    return prefix + 'coffee';
                case 2:
                    return prefix + 'lotro beacon';
                case 3:
                    return prefix + 'lotro beacon';
                case 4:
                    return prefix + 'so mrs';
                case 5:
                    return prefix + 'so nel';
                case 6:
                    return prefix + 'coffee';
                case 7:
                    return prefix + 'so nel';
                case 8:
                    return prefix + 'lotrobeacon';
                case 9:
                    return prefix + 'coffee';
                case 10:
                    return prefix + 'so ferde';
                case 11:
                    return prefix + 'so bc';
                case 12:
                    return prefix + 'coffee';
                case 13:
                    return prefix + 'so muck';
                case 14:
                    return prefix + 'so geg';
                case 15:
                    return prefix + 'so dwarrow';
                case 16:
                    return prefix + 'so joon';
                case 17:
                    return prefix + 'so mrs';
                case 18:
                    return prefix + 'so kate';
                case 19:
                    return prefix + 'so geek';
                case 20:
                    return prefix + 'so neb';
                case 21:
                    return prefix + 'so nel';
                default:
                    console.log('no valid input arduino');
            }
        }
    }
    return new_command;
}