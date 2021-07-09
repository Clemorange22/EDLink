const fs = require('fs');
const cron = require('node-cron')
global.conf = require('./conf.json')
const { createAlerteTask } = require('./helpers/helpers')

const Discord = require('discord.js');
require('discord-reply');

global.client = new Discord.Client();
global.client.commands = new Discord.Collection();
global.client.cooldowns = new Discord.Collection();

const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		global.client.commands.set(command.name, command);
	}
}

try {
    if (fs.existsSync('./autoposts.json')) {
      global.autopostsconf = require('./autoposts.json')
    }else{
       global.autopostsconf = {} 
    }
  } catch(err) {
    console.error(err)
  }
if (autopostsconf != {}){
    global.autoposts = {}
    for(let [serveur,serveursAutoposts] of Object.entries(autopostsconf)){
        for(let [autopostName,autopostSettings] of Object.entries(serveursAutoposts)){
            if(!autoposts[serveur]) autoposts[serveur] = {}
            autoposts[serveur][autopostName] = cron.schedule(autopostSettings.cronExpression,async ()=>{
                const emploiDuTemps = require('./commands/Emploi du temps/emploidutemps.js');
                emploiDuTemps.execute(autopostSettings.channelID,[autopostSettings.mode]);
            })
        }
    }
}
else global.autoposts = {}

try {
    if (fs.existsSync('./alertes.json')) {
      global.alertesConf = require('./alertes.json')
    }else{
       global.alertesConf = {}
    }
} catch(err) {
    console.error(err)
}
if (alertesConf != {}){
    global.alertes = {}
    for(let [serveur,alertesServeur] of Object.entries(alertesConf)){
        for(let [nomAlerte,alerteConf] of Object.entries(alertesServeur)){
            if(!alertes[serveur]) alertes[serveur] = {}
            if (alerteConf.mention) alertes[serveur][nomAlerte] = createAlerteTask(alerteConf.channel,alerteConf.mention)
            else alertes[serveur][nomAlerte] = createAlerteTask(alerteConf.channel)
        }
    }
}
else global.alertes = {}

const token = conf.discord.token
const prefix = conf.discord.prefix

global.client.once('ready', () => {
    global.client.user.setActivity("ed help", {type : "WATCHING"});
    console.log("Bot ready...");
})

global.client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	

    const command = global.client.commands.get(commandName) || global.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.permissions) {
        const authorPerms = message.channel.permissionsFor(message.author);
        if (!authorPerms || !authorPerms.has(command.permissions)) {
            return message.lineReply('Vous n\'êtes pas autorisé à faire ça !');
        }
    }
    

    if (command.guildOnly && message.channel.type === 'dm') {
        return message.lineReply('Je ne peux pas utiliser cette commande en dm !');
    }
    
    const { cooldowns } = global.client;

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.lineReply(`Veuillez patienter encore ${timeLeft.toFixed(1)} secondes avant de réutiliser la commande \`${command.name}\`.`);
        }

    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);


	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.lineReply('There was an error trying to execute that command!');
	}
});


global.client.login(token);