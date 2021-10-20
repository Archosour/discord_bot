const fs = 					require('fs');
const fsPromise = 			fs.promises;
const allowed_commands = [
	'forward',
	'back',
	'turn left',
	'turn rigth',
	'up',
	'down',
	'turn around'
];
const path = './turtle_command.txt';

module.exports.new_command = function new_command(message) {
	if (message == undefined) return false;

	let msg = 				message.split(':');
	let turtle_command = 	msg[2];

	console.log(`turtle command: ${turtle_command}`);

	if (check_command(turtle_command)) {
		update_command_file(turtle_command);
	} else {
		return false;
	}
}

function check_command(command) {
	if (command == undefined) return false;

	if (allowed_commands.includes(command)) {
		return true;
	} else {
		return false;
	}
}

function update_command_file(command) {
	if (command == undefined) return false;

	fs.writeFile(path, command, (error) => {
		if (error) {
			console.log(error);
		}
	})
}

module.exports.get_command = function get_command() {
	return new Promise((resolve, reject) => {
        fsPromise.readFile(path)
		.then((data) => {
			if (data != '-') {
				console.log(`get command: ${data}`);
				update_command_file('-');
			}
			resolve(data);
		})
		.catch((error) => {
			if (error) {
				console.log(error);
			}
		});
    });
}