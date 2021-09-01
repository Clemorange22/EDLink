const { Util } = require('discord.js')

module.exports = {
	name: 'help',
	description: 'Liste toutes mes commandes ou donne des informations sur une commande spécifique',
	aliases: ['commands'],
	cooldown: 5,
    usage : '<nom de la commande>',
	execute(message, args) {
        const prefix = global.conf.discord.prefix
        var reply = [];
		const { commands } = message.client;

		if (!args.length) {
            reply.push('Voici une liste de toutes mes commandes :');
            reply.push(commands.map(command => command.name).join(', '));
            reply.push(`\nVous pouvez envoyer \`${prefix}help [nom de la commande]\` pour avoir des informations spécifiques sur la commande !`);
            
            const messagesToSend = Util.splitMessage(reply.join('\n'))
            var firstMessage = true
            for(let messageToSend of messagesToSend) {
                if (firstMessage) {
                message.author.send(messageToSend)
                .then(() => {
                    if (message.channel.type === 'DM') return;
                    message.reply('Je t\'ai envoyé la liste de mes commandes en DM !');
                })
                .catch(error => {
                    console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
                    message.reply('On dirait que je ne peux pas te DM... Est-ce que tu as tes DMs désactivés ?');
                });
                firstMessage = false
                }
                else {
                    message.author.send(messageToSend)
                }
                
            }
            return
        
		}
        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

        if (!command) {
            return message.reply('Ce n\'est pas une commande valide !');
        }

        reply.push(`**Nom:** ${command.name}`);

        if (command.aliases) reply.push(`**Alias:** ${command.aliases.join(', ')}`);
        if (command.description) reply.push(`**Description:** ${command.description}`);
        if (command.usage) reply.push(`**Utilisation:** ${prefix}${command.name} ${command.usage}`);

        reply.push(`**Cooldown:** ${command.cooldown || 3} seconde(s)`);
        reply = reply.join('\n')

        const messagesToSend = Util.splitMessage(reply)
            for(let messageToSend of messagesToSend) {
                message.channel.send(messageToSend)
            }

        
	},
};
