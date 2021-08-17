const EcoleDirecte = require('ecoledirecte.js');
const request = require('request')
const cron = require('node-cron')
const { format ,addWeeks , isPast } = require('date-fns');
const fs = require('fs')

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
            const session = new EcoleDirecte.session()
            const account = await session.login(conf.ed.accounts[compte]["username"],conf.ed.accounts[compte]["password"])
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
                for (cours of edt) {
                    if (!alertesConf[message.guild.id].alertesEffectues.some(coursEnregistre => coursEnregistre.id == cours.id)) {
                        if (cours.isAnnule) coursAnnules.push(cours)
                        else if (cours.isModifie) coursModifies.push(cours)
                    }
                }
                var msg = []
                if (coursModifies.length != 0 || coursAnnules.lenght !=0) {
                    msg.push(`**Modifications d'emploi du temps pour le compte ${compte}:**\n`)
                    if (coursAnnules.lenght != 0) {
                        msg.push('Cours annulés :\n')
                        for (cours of coursAnnules) {
                            let date = cours.start_date.split(' ')[0]
                            let heure = cours.start_date.split(' ')[1]
                            msg.push(`${cours.matiere} le ${date.split('-').join('/')} à ${heure.split(':').join('h')}\n`)
                            if (!global.alertesConf[message.guild.id].alertesEffectues) global.alertesConf[message.guild.id].alertesEffectues = []
                            global.alertesConf[message.guild.id].alertesEffectues.push(cours)
                        }
                    }
                    if (coursModifies.lenght != 0) {
                        msg.push('Cours modifiés :\n')
                        for (cours of coursModifies) {
                            let date = cours.start_date.split(' ')[0]
                            let heure = cours.start_date.split(' ')[1]
                            msg.push(`Le cours ${cours.matiere} du ${date.split('-').join('/')} aura lieu à ${heure.split(':').join('h')}\n`)
                            if (!global.alertesConf[message.guild.id].alertesEffectues) global.alertesConf[message.guild.id].alertesEffectues = []
                            global.alertesConf[message.guild.id].alertesEffectues.push(cours)
                        }
                    }
                    if (mention) msg.push(mention)
                    client.channels.cache.get(channel).send(msg.join(''))
                }
                for (coursEnregistre of alertesConf[message.guild.id].alertesEffectues){
                    if (isPast(Date.parse(coursEnregistre.end_date))) delete coursEnregistre
                }
                saveAlertesConf(JSON.stringify(alertesConf))
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
        if (comptesParDefaut[id]) return [conf.ed.accounts[comptesParDefaut[id]]["username"],conf.ed.accounts[comptesParDefaut[id]]["password"]]//Renvoie le compte choisi par l'utilisateur
        else return [conf.ed.accounts[conf.ed.defaultAccount]["username"],conf.ed.accounts[conf.ed.defaultAccount]["password"]]//Renvoie le compte par défaut si l'utlisateur n'en a pas choisi
    }
}