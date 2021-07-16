const EcoleDirecte = require('ecoledirecte.js');
const request = require('request')
const cron = require('node-cron')
const { format ,addWeeks , isPast } = require('date-fns');
const fs = require('fs')

module.exports = {
    createAlerteTask(compte,channel,mention){
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
                    msg.push('**Modification d\'emploi du temps :**\n')
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
    saveAlertesConf(newConf){
        fs.writeFile('./alertes.json', newConf, function (err) {
            if (err) {
                console.log('There has been an error saving your configuration data.');
                console.log(err.message);
                return;
            }
            });
    },
    saveComptesConf(newConf){
        fs.writeFile('./comptes.json', newConf, function (err) {
            if (err) {
                console.log('There has been an error saving your configuration data.');
                console.log(err.message);
                return;
            }
            });
    },
    compteUtilisateur(id) {
        if (comptesParDefaut[id]) return [conf.ed.accounts[comptesParDefaut[id]]["username"],conf.ed.accounts[comptesParDefaut[id]]["password"]]
        else return [conf.ed.accounts[conf.ed.defaultAccount]["username"],conf.ed.accounts[conf.ed.defaultAccount]["password"]]
    }
}