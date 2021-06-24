const EcoleDirecte = require("../../node_modules/ecoledirecte.js");
const axios = require('../../node_modules/axios');

const conf = require("../../conf.json");
const { Account } = require("../../node_modules/ecoledirecte.js");
const username = conf.ed.username;
const password = conf.ed.password

module.exports = {
    name: "emploidutemps",
    aliases: ["edt"],
    description: "Donne l’emploi du temps d’un jour ou d’une semaine donnée (sans argument, donne l’emploi du temps de la semaine en cours)",
    guildOnly: true,
    memberpermissions:"VIEW_CHANNEL",
    cooldown: 5,
    usage :'<jour/j/semaine/s> <jour-mois-année> (emploi du temps de la semaine suivante suivante si absent)',
    execute(message, args) {
        (async () => {
            const session = new EcoleDirecte.Session(username,password);
            const account = await session.login().catch(err => {
                console.error("This login did not go well.");
            });
            
            function calcDate(args) {
                if (args[1]) {
                    if (args[0] == "jour" || args[0] == "j") {
                        var date = args[1].split("-");
                        var dateDebut = [date[2],date[1],date[0]].join("-");
                        var dateFin = dateDebut;
                    }
                    else if (args[0] == "semaine" || args[0] == "s") {
                        var date = args[1].split("-");
                        var dateDebut = [date[2],date[1],date[0]].join("-");
                        var dateFin = dateDebut;
                    }
                }
                return [dateDebut, dateFin]
            }
            var dates = calcDate(args);
            var dateDebut = dates[0];
            var dateFin = dates[1];

            var data = `data={"dateDebut":"${dateDebut}","dateFin":"${dateFin}","avecTrous":false,"token":"${account.token}"}`
              var config = {
                method: 'post',
                url: 'https://api.ecoledirecte.com/v3/E/7857/emploidutemps.awp?verbe=get&',
                headers: { 
                  'authority': 'api.ecoledirecte.com', 
                  'accept': 'application/json, text/plain, */*', 
                  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36', 
                  'content-type': 'application/x-www-form-urlencoded', 
                  'sec-gpc': '1', 
                  'origin': 'https://www.ecoledirecte.com', 
                  'sec-fetch-site': 'same-site', 
                  'sec-fetch-mode': 'cors', 
                  'sec-fetch-dest': 'empty', 
                  'referer': 'https://www.ecoledirecte.com/', 
                  'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
                },
                data : data
              };
              
              axios(config)
              .then(function (response) {
                console.log(JSON.stringify(response.data));
              })
              .catch(function (error) {
                console.log(error);
              });
        })();
    },
};