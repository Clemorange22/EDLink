const {createAlerteTask , saveAlertesConf} = require('../../helpers/helpers')

module.exports = {
    name: "alertes",
    aliases: ["alerts"],
    description: "Permet de configurer des alertes quand un cours est modifié ou annulé.\nalertes create <\"nom\"> <nom-compte> <#salon> <@role-mentionné(optionnel)> : Crée une alerte\nlist : liste les alertes actives sur le serveur\ndelete <\"nom\"> : supprime une alerte",
    guildOnly: true,
    memberpermissions:"MANAGE_MESSAGES",
    cooldown: 5,
    usage: "create/list/delete <arguments>",
    execute(message, args) {
        var method = args.shift()
        if (method == 'create') {
            //Traitement et vérification des arguments
            if (!args[0]) return message.reply(`Nom incorrect ! Faites ${global.conf.discord.prefix}help alertes`)
            var name = args.shift()

            var compte = args.shift()
            if (!global.conf.ed.accounts[compte]) return message.reply('Ce compte n\'existe pas !')

            if (!(args[0] && args[0].startsWith('<#') && args[0].endsWith('>'))) return message.reply(`Salon incorrect ! Faites ${global.conf.discord.prefix}help alertes`)
            var channel = args.shift().slice(2,-1)

            if (args[0]){
                if ((args[0] && args[0].startsWith('<@&') && args[0].endsWith('>')) || args[0] == '@everyone' || args[0] == '@here') var mention = args[0]
                else return message.reply('Mention incorrecte !  Vous devez mentionner un rôle, @everyone ou @here !')
            }
            //Enregistrement de la nouvelle alerte dans la configuration
            if (!global.alertesConf[message.guild.id]) global.alertesConf[message.guild.id] = {}
            global.alertesConf[message.guild.id][name] = {
                channel : channel,
                compte : compte
            };
            if (mention) global.alertesConf[message.guild.id][name].mention = mention;

            saveAlertesConf(JSON.stringify(global.alertesConf));

            //Création de la tâche cron de l'alerte
            if (!global.alertes[message.guild.id]) global.alertes[message.guild.id] = {}
            if (mention) global.alertes[message.guild.id][name] = createAlerteTask(compte,channel,mention)
            else global.alertes[message.guild.id][name] = createAlerteTask(compte,channel)
            message.reply(`L'alerte ${name} a bien été créé !`)
        }
        else if (method == 'list') {
            if (!global.alertesConf[message.guild.id]) global.alertesConf[message.guild.id] = {}
            var reponse = [`Les alertes actuellement activées sur **${message.guild.name}** sont :\n`]
            for (let [nomAlerte,confAlerte] of Object.entries(global.alertesConf[message.guild.id]) ){
                if (!confAlerte.mention) reponse.push(`**${nomAlerte}** : Salon : <#${confAlerte.channel}>\n`)
                else {
                    if (confAlerte.mention.startsWith('<@&') && confAlerte.mention.endsWith('>')) reponse.push(`**${nomAlerte}** : Salon : <#${confAlerte.channel}> Mention : Role ID :${confAlerte.mention.slice(3,-1)}\n`)
                    else reponse.push(`**${nomAlerte}** : Salon : <#${confAlerte.channel}> Mention : ${confAlerte.mention.slice(1)}\n`)
                }
            }
            if (reponse.length <= 1) message.reply(`Aucune alerte n'est actuellements activée sur **${message.guild.name}**`)
            else message.reply(reponse.join(''))
        }
        else if (method == 'delete') {
            if (!args[0]) return message.reply(`Arguments incorrects ! Faites ${global.conf.discord.prefix}help alertes`)

            var alerteASupprimer = args.shift()

            if (!global.alertesConf[message.guild.id][alerteASupprimer]) return message.reply(`Aucun alerte nommée ${alerteASupprimer} sur **${message.guild.name}** !`)
            global.alertes[message.guild.id][alerteASupprimer].stop()
            delete global.alertes[message.guild.id][alerteASupprimer]

            delete global.alertesConf[message.guild.id][alerteASupprimer]
            saveAlertesConf(JSON.stringify(global.alertesConf))

            message.reply(`L'alerte ${alerteASupprimer} a été correctement supprimée ! :white_check_mark:`)
        }
        else return message.reply(`Arguments incorrects ! Faites ${global.conf.discord.prefix}help alertes`);
    },
};