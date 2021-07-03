module.exports = {
	name: 'help',
	description: 'Liste toutes mes commandes ou donne des informations sur une commande spécifique',
	aliases: ['commands'],
	cooldown: 5,
    usage : '<nom de la commande>',
	execute(message, args) {
        const prefix = conf.discord.prefix
        const data = [];
		const { commands } = message.client;

		if (!args.length) {
            data.push('Voici une liste de toutes mes commandes :');
            data.push(commands.map(command => command.name).join(', '));
            data.push(`\nVous pouvez envoyer \`${prefix}help [nom de la commande]\` pour avoir des informations spécifiques sur la commande !`);
        
            return message.author.send(data, { split: true })
                .then(() => {
                    if (message.channel.type === 'dm') return;
                    message.lineReply('Je t\'ai envoyé la liste de mes commandes en DM !');
                })
                .catch(error => {
                    console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
                    message.lineReply('On dirait que je ne peux pas te DM... Est-ce que tu as tes DMs désactivés ?');
                });
        
		}
        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

        if (!command) {
            return message.reply('Ce n\'est pas une commande valide !');
        }

        data.push(`**Nom:** ${command.name}`);

        if (command.aliases) data.push(`**Alias:** ${command.aliases.join(', ')}`);
        if (command.description) data.push(`**Description:** ${command.description}`);
        if (command.usage) data.push(`**Utilisation:** ${prefix}${command.name} ${command.usage}`);

        data.push(`**Cooldown:** ${command.cooldown || 3} seconde(s)`);

        message.channel.send(data, { split: true });

        
	},
};
