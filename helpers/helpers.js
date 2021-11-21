const EcoleDirecte = require('ecoledirecte.js');
const request = require('request')
const cron = require('node-cron')
const { format ,addWeeks , isPast } = require('date-fns');
const fs = require('fs')
const { Util } = require('discord.js')

function saveAlertesConf(newConf){
    fs.writeFile('./alertes.json', newConf, function (err) {
        if (err) {
            console.log('There has been an error saving your configuration data.');
            console.log(err.message);
            return;
        }
        });
}

module.exports = {
    createAlerteTask(compte,channel,mention){ //Crée la tâche alertant toutes les 10 minutes si un cours est modifié / annulé
        return cron.schedule('*/10 * * * *',async () =>{
            const session = new EcoleDirecte.Session(global.conf.ed.accounts[compte]["username"],global.conf.ed.accounts[compte]["password"])
            const account = await session.login()
            var options = {
                'method': 'POST',
                'url': `https://api.ecoledirecte.com/v3/${account._raw.typeCompte}/${account.edId}/emploidutemps.awp?verbe=get&`,
                'headers': {
                  'authority': 'api.ecoledirecte.com',
                  'accept': 'application/json, text/plain, */*',
                  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
                  'content-type': 'application/x-www-form-urlencoded',
                  'sec-gpc': '1',
                  'origin': 'https://www.ecoledirecte.com',
                  'sec-fetch-site': 'same-site',
                  'sec-fetch-mode': 'cors',
                  'sec-fetch-dest': 'empty',
                  'referer': 'https://www.ecoledirecte.com/',
                  'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
                },
                form: {
                  'data': `{"dateDebut":"${format(Date.now(),"yyyy'-'MM'-'dd")}","dateFin":"${format(addWeeks(Date.now(),2),"yyyy'-'MM'-'dd")}","avecTrous":false,"token":"${account.token}"}`
                }
              };
            request(options, function (error,response) {
                if (error) return console.log(error)
                var edt = JSON.parse(response.body).data;
                var coursAnnules = []
                var coursModifies = []
                if (!global.alertesConf[channel]) global.alertesConf[channel] = {}
                if (!global.alertesConf[channel].alertesEffectues) global.alertesConf[channel].alertesEffectues = []
                for (let cours of edt) {
                    if ((!global.alertesConf[channel].alertesEffectues.some(coursEnregistre => coursEnregistre.id == cours.id))) {
                        if (cours.isAnnule) coursAnnules.push(cours)
                        else if (cours.isModifie) coursModifies.push(cours)
                    }
                }
                var msg = []
                if (coursModifies.length != 0 || coursAnnules.length !=0) {
                    msg.push(`**Modifications d'emploi du temps pour le compte ${compte}:**\n`)
                    if (coursAnnules.lenght != 0) {
                        msg.push('Cours annulés :\n')
                        for (let cours of coursAnnules) {
                            let date = cours.start_date.split(' ')[0]
                            let heure = cours.start_date.split(' ')[1]
                            msg.push(`${cours.matiere} le ${date.split('-').reverse().join('/')} à ${heure.split(':').join('h')}\n`)
                            if (!global.alertesConf[channel].alertesEffectues) global.alertesConf[channel].alertesEffectues = []
                            global.alertesConf[channel].alertesEffectues.push(cours)
                        }
                    }
                    if (coursModifies.lenght != 0) {
                        msg.push('Cours modifiés :\n')
                        for (let cours of coursModifies) {
                            let date = cours.start_date.split(' ')[0]
                            let heure = cours.start_date.split(' ')[1]
                            msg.push(`Le cours ${cours.matiere} du ${date.split('-').reverse().join('/')} aura lieu à ${heure.split(':').join('h')}\n`)
                            if (!global.alertesConf[channel].alertesEffectues) global.alertesConf[channel].alertesEffectues = []
                            global.alertesConf[channel].alertesEffectues.push(cours)
                        }
                    }
                    if (mention) msg.push(mention)

                    msg = msg.join('')
                    var channelToSend = global.client.channels.cache.get(channel)
                    const messagesToSend = Util.splitMessage(msg)
                    for(let messageToSend of messagesToSend) {
                        channelToSend.send(messageToSend)
                    }
                }
                if (global.alertesConf[channel] && global.alertesConf[channel].alertesEffectues) {
                    for (let coursEnregistre of global.alertesConf[channel].alertesEffectues){
                        if (isPast(Date.parse(coursEnregistre.end_date))) delete global.alertesConf[channel].alertesEffectues[Array.prototype.indexOf.call(global.alertesConf[channel].alertesEffectues,coursEnregistre)]
                    }
                }
                saveAlertesConf(JSON.stringify(global.alertesConf))
            })
                
        })
    },
    saveAlertesConf(newConf){ //Sauvegarde la config des alertes
        fs.writeFile('./alertes.json', newConf, function (err) {
            if (err) {
                console.log('There has been an error saving your configuration data.');
                console.log(err.message);
                return;
            }
            });
    },
    saveComptesConf(newConf){ //Sauvegardes la config des comptes
        fs.writeFile('./comptes.json', newConf, function (err) {
            if (err) {
                console.log('There has been an error saving your configuration data.');
                console.log(err.message);
                return;
            }
            });
    },
    compteUtilisateur(id) { //Renvoie le compte école directe (identifiant,mdp) à utiliser en fonction de l'utilisateur
        if (global.comptesParDefaut[id]) return [global.conf.ed.accounts[global.comptesParDefaut[id]]["username"],global.conf.ed.accounts[global.comptesParDefaut[id]]["password"],global.comptesParDefaut[id]]//Renvoie le compte choisi par l'utilisateur
        else return [global.conf.ed.accounts[global.conf.ed.defaultAccount]["username"],global.conf.ed.accounts[global.conf.ed.defaultAccount]["password"],global.conf.ed.defaultAccount]//Renvoie le compte par défaut si l'utlisateur n'en a pas choisi
    },
    splitEmbeds(embedsToSplit) {
        var embedsLists = []
        var embedsList = []
        for (let embed of embedsToSplit) {
             if (embedsList.length == 10) {
                 embedsLists.push(embedsList)
                 embedsList = []
             }
             embedsList.push(embed)
        }
        embedsLists.push(embedsList)
        return embedsLists
    }
}