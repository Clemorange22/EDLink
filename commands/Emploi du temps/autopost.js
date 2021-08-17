const cron = require('node-cron');
const fs = require('fs')

function getChannelIDFromMention(mention){
    if (!mention) return "Not a mention !";
    
    if (mention.startsWith('<#') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        return mention;
    }
    else return "Not a mention !"
}

function saveAutopostConf(newConf){
    fs.writeFile('./autoposts.json', newConf, function (err) {
        if (err) {
            console.log('There has been an error saving your configuration data.');
            console.log(err.message);
            return;
        }
        });
}

module.exports = {
    name: "autopost",
    aliases: ["autoposts"],
    description: "\nautopost create <\"nom\"> <nom-compte> <#salon> <j/s> <\"cron-format\">: permet de paramétrer un post automatique d'emploi du temps (<cron-format> : délai entre chaque post au format cron. Vous pouvez utiliser <https://crontab.cronhub.io/> pour le générer, j/s : mode d'emploi du temps : du jour ou de la semaine)\n\n autopost list : permet de lister les posts automatiques\n\n autopost delete <name> : permet de supprimer un post automatique",
    guildOnly: true,
    memberpermissions:"MANAGE_MESSAGES",
    cooldown: 5,
    usage: "create/list/delete <arguments>",
    execute(message, args) {
        (async ()=>{
            var method = args.shift().toLowerCase();
            if (method == 'create'){
                var name = args.shift();
                if (global.autopostsconf[message.guild.id] && global.autopostsconf[message.guild.id][name]) return message.reply(`Il existe déjà un post automatique nommé ${name}`);;

                var compte = args.shift()
                if (!conf.ed.accounts[compte]) return message.lineReply('Ce compte n\'existe pas !')

                var channelID = getChannelIDFromMention(args.shift());
                if (channelID == "Not a mention !") return message.lineReply('La mention donnée n\'est pas valide !');
                
                var modeEDT = args.shift().toLowerCase()
                if (modeEDT != 'j' && modeEDT != 's') return message.lineReply('Le mode d\'emploi du temps doit être "j" ou "s" !')

                var cronFormat = args.join(" ");
                if(!cron.validate(cronFormat)) return message.lineReply('cron-format invalide ! Veuillez utiliser http://www.csgnetwork.com/crongen.html pour le générer');
                if(!global.autopostsconf[message.guild.id]) global.autopostsconf[message.guild.id] = {}
                global.autopostsconf[message.guild.id][name] = {
                    channelID : channelID,
                    cronExpression : cronFormat,
                    mode : modeEDT,
                    compte : compte
                }
                let newConf = JSON.stringify(autopostsconf);
                saveAutopostConf(newConf);
                

                if (!global.autoposts[message.guild.id]) global.autoposts[message.guild.id] = {}
                global.autoposts[message.guild.id][name] = cron.schedule(cronFormat,async ()=>{
                    const emploiDuTemps = require('./emploidutemps.js');
                    emploiDuTemps.execute(channelID,[modeEDT],compte);
                })
                message.lineReply('Post automatique activé ! :white_check_mark:')
            }
            else if (method == 'list'){
                var reponse = [`Les posts automatiques actuellement activé sur **${message.guild.name}** sont :\n`]
                for(let [clee,element] of Object.entries(autopostsconf[message.guild.id])){
                    reponse.push(`**${clee}** :\nSalon : <#${element.channelID}>, Expression Cron :${element.cronExpression} , mode : ${element.mode}\n`)
                }
                if (reponse.length == 1) return message.lineReply('Aucun post automatique n\'est actuellement actif sur ce serveur !');
                return message.lineReply(reponse.join(""))
            }
            else if (method == 'delete'){
                if (!args[0]) return message.lineReply(`Arguments invalides ! Faites ${conf.discord.prefix}help autopost`)
                var autopostToDelete = args.shift();
                if(!autopostsconf[message.guild.id][autopostToDelete]) return message.lineReply(`Le post automatique ${autopostToDelete} n'existe pas !`)
                autoposts[message.guild.id][autopostToDelete].stop();
                delete autoposts[message.guild.id][autopostToDelete]
                delete autopostsconf[message.guild.id][autopostToDelete]

                let newConf = JSON.stringify(autopostsconf);
                saveAutopostConf(newConf)

                message.lineReply(`Le post automatique ${autopostToDelete} a été correctement supprimé !`)
            } 
            else {
                message.lineReply(`Arguments invalides ! Faites ${conf.discord.prefix}help autopost`)
            }
        })();
    },
};