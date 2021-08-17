const { saveComptesConf } = require('../../helpers/helpers')

module.exports = {
    name: "compte",
    aliases: ["comptes","account","accounts"],
    description: "\n\`\`list\`\` : Affiche tous les comptes actuellement disponibles\n\`\`switch <nom-compte>\`\` : Change ton compte par défaut pour le compte demandé",
    guildOnly: false,
    memberpermissions:"VIEW_CHANNEL",
    cooldown: 2,
    usage: "<list/switch/sw> <arguments>",
    execute(message, args) {
        if (args[0]) {
            var method = args.shift();
            if (method == 'list') {
            var msg = ['Les comptes école directe actuellement disponibles sur le bot sont :\n']
            for ([nomCompte,compteConfig] of Object.entries(global.conf.ed.accounts)) {
                msg.push(`${nomCompte}, `)
            }
            msg = msg.join('').slice(0,-2)+`\n Faites \`\`${conf.discord.prefix}compte switch <nom-ducompte>\`\` pour changer de compte`
            message.lineReply(msg,{split : true})
            }
            else if(method == "switch" || method == 'sw') {
                if (!args[0]) return message.lineReply(`Arguments incorrects, faites \`\`${conf.discord.prefix}help compte\`\``)
                nomCompte = args.shift()
                if (!conf.ed.accounts[nomCompte]) return message.lineReply(`Ce compte n'existe pas, faites \`\`${conf.discord.prefix}compte list\`\` pour afficher les comptes disponibles`)
                global.comptesParDefaut[message.author.id] = nomCompte
                saveComptesConf(JSON.stringify(comptesParDefaut))
                message.lineReply(`Votre compte actif est maintenant ${nomCompte} :white_check_mark:`)
            }
            else message.lineReply(`Arguments incorrects, faites \`\`${conf.discord.prefix}help compte\`\``)
        }
        else {
            if (comptesParDefaut[message.author.id]) message.lineReply(`Votre compte actuel est **${comptesParDefaut[message.author.id]}**`)
            else message.lineReply(`Vous n'avez selectionné aucun compte, votre compte actif est donc par défaut ${conf.ed.defaultAccount}\nVeuillez faire \`\`${conf.discord.prefix}compte list\`\` pour afficher les comptes disponibles.`)
        }
        
    }
};