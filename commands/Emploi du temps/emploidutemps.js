module.exports = {
    name: "emploidutemps",
    aliases: ["edt"],
    description: "Donne l’emploi du temps d’un jour ou d’une semaine donnée (sans argument, donne l’emploi du temps de la semaine en cours)",
    guildOnly: true,
    memberpermissions:"VIEW_CHANNEL",
    cooldown: 2,
    usage :'<jour-mois-année> (emploi du temps de la semaine suivante suivante si absent)',
    execute(message, args) {
        message.reply("template command")
    },
};