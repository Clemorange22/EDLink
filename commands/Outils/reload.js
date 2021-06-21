const fs = require('fs');

module.exports = {
	name: 'reload',
	description: 'Recharge une commande',
    memberpermissions:"ADMINISTRATOR",
	execute(message, args) {
		const commandName = args[0].toLowerCase();
		const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			return message.channel.send(`Il n'existe aucune commande avec le nom ou l'alias \`${commandName}\`, ${message.author}!`);
		}

        const commandFolders = fs.readdirSync('./commands');
        const folderName = commandFolders.find(folder => fs.readdirSync(`./commands/${folder}`).includes(`${command.name}.js`));

        delete require.cache[require.resolve(`../${folderName}/${command.name}.js`)];

        try {
            const newCommand = require(`../${folderName}/${command.name}.js`);
            message.client.commands.set(newCommand.name, newCommand);
            message.channel.send(`La commande \`${newCommand.name}\` a été rechargée !`);
        } catch (error) {
            console.error(error);
            message.channel.send(`Une erreur s'est produite en rechargant la commande \`${command.name}\`:\n\`${error.message}\``);
        }

	},
};
