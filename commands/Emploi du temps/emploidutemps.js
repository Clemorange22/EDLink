/* eslint-disable no-redeclare */
const EcoleDirecte = require("ecoledirecte.js");
const request = require('request');
const fs = require('fs')

const {startOfWeek,format,addDays,compareAsc,addHours,getDay,getHours,addWeeks} = require('date-fns');

const { MessageAttachment } = require('discord.js')

const nodeHtmlToImage = require('node-html-to-image')

const { compteUtilisateur } = require('../../helpers/helpers')

module.exports = {
    name: "emploidutemps",
    aliases: ["edt"],
    description: "Donne l’emploi du temps d’un jour ou d’une semaine donnée (sans argument, donne l’emploi du temps de la semaine en cours)",
    guildOnly: false,
    memberpermissions:"VIEW_CHANNEL",
    cooldown: 5,
    usage :'<jour/j/semaine/s> <jour-mois-année> (emploi du temps de la semaine suivante si absent)',
    // eslint-disable-next-line no-unused-vars
    execute(destination, args, compte) {
        (async () => {
          if (!compte) var [username,password,compte] = compteUtilisateur(destination.author.id)
          else [username,password] = [global.conf.ed.accounts[compte]["username"],global.conf.ed.accounts[compte]["password"]]

            function calcDate(args) { // Calcul des dates de début et de fin du calendrier à demander à école directe
                if (args[1]) {
                    if (args[0] == "jour" || args[0] == "j") {
                        var date = args[1].split("-");
                        var dateDebut = [date[2],date[1],date[0]].join("-");
                        var dateFin = dateDebut;
                    }
                    else if (args[0] == "semaine" || args[0] == "s") {
                        var date = args[1].split("-");
                        var date = Date.parse([date[2],date[1],date[0]].join("-"));
                        var dateDebut = format(startOfWeek(date,{weekStartsOn : 1}), "yyyy'-'MM'-'dd");
                        var dateFin = format(addDays(startOfWeek(date,{weekStartsOn : 1}),4), "yyyy'-'MM'-'dd")
                    }
                }
                    else {
                      if (args[0]){
                        if (args[0] == 'j' || args[0] == 'jour'){
                          var dateDebut = format(Date.now(),"yyyy'-'MM'-'dd");
                          var dateFin = dateDebut;
                        }
                        else if (args[0] == 's' || args[0] == 'semaine'){
                          if (getDay(Date.now()) == 0 || getDay(Date.now()) == 6 || (getDay(Date.now()) == 5 && getHours(Date.now()) >= 18)){
                            var dateDebut = format(startOfWeek(addWeeks(Date.now(),1),{weekStartsOn : 1}), "yyyy'-'MM'-'dd");
                            var dateFin = format(addDays(startOfWeek(addWeeks(Date.now(),1),{weekStartsOn : 1}),4), "yyyy'-'MM'-'dd")
                          }
                          else {
                            var dateDebut = format(startOfWeek(Date.now(),{weekStartsOn : 1}), "yyyy'-'MM'-'dd");
                            var dateFin = format(addDays(startOfWeek(Date.now(),{weekStartsOn : 1}),4), "yyyy'-'MM'-'dd")
                          }
                        }
                        else {
                        var date = args[0].split("-");
                        var dateDebut = [date[2],date[1],date[0]].join("-");
                        var dateFin = dateDebut
                        }
                      }
                      else {
                        var dateDebut = format(Date.now(),"yyyy'-'MM'-'dd");
                        var dateFin = dateDebut;
                      }
                    }

                return [dateDebut, dateFin]
            }
            var dates = calcDate(args);
            var dateDebut = dates[0];
            var dateFin = dates[1];

            const session = new EcoleDirecte.Session(username,password);
            const account = await session.login().catch(err => {
                console.error(`This login did not go well :\nError :${err}`);
            });

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
                'data': `{"dateDebut":"${dateDebut}","dateFin":"${dateFin}","avecTrous":false,"token":"${account.token}"}`
              }
            };
            request(options, function (error, response) {
              if (error) {console.log(error);
              return destination.reply(`La récupération des données auprès d'école directe a échouée, assurez vous d'utiliser la commande correctement "${global.conf.discord.prefix}emploidutemps <jour/j/semaine/s> <jour-mois-année>".\n Sinon, vérifiez les paramètres de connexion du bot.`)
              }
              var emploiDuTemps = JSON.parse(response.body).data;
              if (!emploiDuTemps) return destination.reply(`La récupération des données auprès d'école directe a échouée, assurez vous d'utiliser la commande correctement "${global.conf.discord.prefix}emploidutemps <jour/j/semaine/s> <jour-mois-année>".\n Sinon, vérifiez les paramètres de connexion du bot.`)
              if (!emploiDuTemps[0] && destination.channel) return destination.reply('Aucun cours dans cette période ! :partying_face:')
              else if(!emploiDuTemps[0]){
                if(args[0]=='j') return global.client.channels.cache.get(destination).send('Aucun cours aujourd\'hui ! :partying_face:')
                else if (args[0]=='s') return global.client.channels.cache.get(destination).send('Aucun cours cette semaine ! :partying_face:')
                else return
              }
              
              var heureDebutJournee = parseInt(emploiDuTemps[0].start_date.split(" ")[1].split(":")[0]);
              var heureFinJournee = parseInt(emploiDuTemps[0].end_date.split(" ")[1].split(":")[0]);
              for(var i = 0;i <= emploiDuTemps.length-1; i++) {
                var heureDebutCours = parseInt(emploiDuTemps[i].start_date.split(" ")[1].split(":")[0]);
                if (heureDebutCours < heureDebutJournee) {
                  heureDebutJournee = heureDebutCours
                }
                if (emploiDuTemps[i].end_date.split(" ")[1].split(":")[1] == "00") {
                  var heureFinCours = emploiDuTemps[i].end_date.split(" ")[1].split(":")[0];
                }
                else {
                  var heureFinCours = parseInt(emploiDuTemps[i].end_date.split(" ")[1].split(":")[0])+1;
                } 
                if (heureFinCours > heureFinJournee) {
                  heureFinJournee = heureFinCours;
                }
              }
              // Génération de l'emploi du temps en HTML
              function traduireMoisAnnee(mois){
                switch (mois){
                  case 'January':
                    return 'Janvier';
                  case 'February':
                    return 'Février';
                  case 'March':
                    return 'Mars';
                  case 'April':
                    return 'Avril';
                  case 'May':
                    return 'Mai';
                  case 'June':
                    return 'Juin';
                  case 'July':
                    return 'Juillet';
                  case 'August':
                    return 'Août';
                  case 'September':
                    return 'Septembre';
                  case 'October':
                    return 'Octobre';
                  case 'November':
                    return 'Novembre';
                  case 'December':
                    return 'Décembre';
                  default :
                    throw new error("L'entrée doit être un mois en anglais !");
                }
              }
              function calcJourMois(date){
                switch (format(date,'d')){
                  case '1':
                    return '1er';
                  default :
                  return format(date,'d')
                }
              }
              var nombreJours = 0;
              if (args[0] == "jour" || args[0] == "j") {nombreJours = 1}
              else if (args[0] == "semaine" || args[0] == "s") {nombreJours = 5}
              else {
                nombreJours = 1
              }
              var imageHeight = "700";
              var imageWidth = "1200";
              var page = []
              var page_head = `
              <head>
                <style>
                  ${fs.readFileSync('./node_modules/bulma/css/bulma.min.css').toString()}
                  html {
                    height : ${imageHeight}px;
                    width : ${imageWidth}px;
                  }
                  .column,table,.columns {
                    height:100%
                  }
                </style>
              </head>
              <body>
                  <div class=columns>`
                  //Déclaration du html du début et de la fin de la page
              var page_foot = `
                  </div>
              </body>`;
              page.push(page_head);
              //Génération des colonnes de l'edt
              //Colonne de gauche (contenant les horaires)
              var colonne = [];
              colonne.push(`<div class="column is-1"><strong>${compte}</strong><br/><table class="table">`);
              for(var c = heureDebutJournee;c <= heureFinJournee;c++) {
                if (c < 10){
                  var heure = `0${c}:00`
                }
                else {
                  var heure = `${c}:00`
                }
                colonne.push(`<tr style='line-height:${100/(heureFinJournee-heureDebutJournee)}%'><td>${heure}</td></tr>`);
              }
              colonne.push(`</table></div>`);
              page.push(colonne.join(" "));
              
              emploiDuTemps.sort(function(a,b){
                var DateA = new Date(a.start_date);
                var DateB = new Date(b.start_date);
                return compareAsc(DateA,DateB);
              });
              for (var j = 0; j< nombreJours;j++) {
                colonne = []
                colonne.push('<div class="column">')
                if ((args[0]=='s'||args[0] == 'semaine')){
                  if (!args[1]){
                    if (getDay(Date.now()) == 0 || getDay(Date.now()) == 6 || (getDay(Date.now()) == 5 && getHours(Date.now()) >= 18)) {
                      var date = addDays(startOfWeek(addWeeks(Date.now(),1),{weekStartsOn : 1}),j)
                    }
                    else var date = addDays(startOfWeek(Date.now(),{weekStartsOn : 1}),j)
                  }
                  else {
                    var date = args[1].split('-');
                      date = addDays(startOfWeek(Date.parse([date[2],date[1],date[0]].join('-')),{weekStartsOn : 1}),j);
                  }
                    switch (j) {
                      case 0:
                        var jourSemaine = ('Lundi');
                        break;
                      case 1:
                        var jourSemaine = ('Mardi');
                        break;
                      case 2:
                        var jourSemaine = ('Mercredi');
                        break;
                      case 3:
                        var jourSemaine = ('Jeudi');
                        break;
                      case 4:
                        var jourSemaine = ('Vendredi');
                        break;
                    }

                  colonne.push(`<div class="has-text-centered"><strong>${jourSemaine} ${calcJourMois(date)} ${traduireMoisAnnee(format(date,'MMMM'))}</strong></div>`);
                }
                else if (!args[0] ||args[0]=='j'||args[0] == 'jour'){
                  if ((args[0]=='j'||args[0] == 'jour') && args[1]){
                    var date = args[1].split('-');
                    date = Date.parse([date[2],date[1],date[0]].join('-'));
                  }
                  else {
                    var date = Date.now()
                  }
                  switch (format(date,'EEEE')){
                    case 'Monday':
                      var jourSemaine = ('Lundi');
                      break;
                    case 'Tuesday':
                      var jourSemaine = ('Mardi');
                      break;
                    case 'Wednesday':
                      var jourSemaine = ('Mercredi');
                      break;
                    case 'Thursday':
                      var jourSemaine = ('Jeudi');
                      break;
                    case 'Friday':
                      var jourSemaine = ('Vendredi');
                      break;
                    case 'Saturday':
                      var jourSemaine = ('Samedi');
                      break;
                    case 'Sunday':
                      var jourSemaine = ('Dimanche');
                      break;
                  }

                  colonne.push(`<div class="has-text-centered"><strong>${jourSemaine} ${calcJourMois(date)} ${traduireMoisAnnee(format(date,'MMMM'))}</strong></div>`);
                }
                
                
                for (var c=0;c<emploiDuTemps.length;c++) {//la boucle s'execute une fois pour chaque cours
                  if ((args[0]=='s'||args[0] == 'semaine')){
                    if (args[1]){
                      var date = args[1].split('-');
                      date = Date.parse([date[2],date[1],date[0]].join('-'));
                    }
                    else {
                      var date = Date.now()
                    }
                    var jour = new Date(addDays(startOfWeek(date,{weekStartsOn : 1}),j));
                    var jourCours = new Date(addHours(new Date(emploiDuTemps[c].start_date.split(" ")[0]),-2));
                  }
                  
                  if ((!args[0] || args[0]=='j'||args[0]=='jour')||((args[0]=='s'||args[0] == 'semaine') && jourCours.getTime() == jour.getTime())) {
                    if (emploiDuTemps[c+1]&& (emploiDuTemps[c].start_date == emploiDuTemps[c+1].start_date)){
                      colonne.push('<div class="columns">')
                      var coursSimultanees = true;
                    }
                    else var coursSimultanees = false;
                    var premièrefoisboucle = true;
                    do {
                      if (coursSimultanees) colonne.push('<div class="column">')
                      var dureeCours = (parseInt(emploiDuTemps[c].end_date.split(" ")[1].split(":")[0])+emploiDuTemps[c].end_date.split(" ")[1].split(":")[1]/60)-(parseInt(emploiDuTemps[c].start_date.split(" ")[1].split(":")[0])+emploiDuTemps[c].start_date.split(" ")[1].split(":")[1]/60)
                      var height = 100/(heureFinJournee-heureDebutJournee)*dureeCours
                      if(dureeCours > 1){
                        var lineBreak = "<br/>"
                      }
                      else {
                        var lineBreak = ""
                      }
                      if (emploiDuTemps[c].isAnnule) var statutCours = '<p class="is-size-6	has-text-centered" style="padding:0;margin:0;"><strong>ANNULÉ</strong></p>'
                      else if (emploiDuTemps[c].isModifie) var statutCours = '<p class="is-size-6	has-text-centered" style="padding:0;margin:0;"><strong>MODIFIÉ</strong></p>'
                      else var statutCours = ''
                      colonne.push(`
                      <div class="card" style="height:${height}%;background-color:${emploiDuTemps[c].color};overflow:hidden;word-wrap: break-word;">
                        <div class="card-content" style="padding:0;margin:0;">
                          <p class="title is-6 has-text-centered" style="padding:0;margin:0;">${emploiDuTemps[c].start_date.split(" ")[1]}-${emploiDuTemps[c].end_date.split(" ")[1]}</p>
                          ${statutCours}
                          <p class="is-size-6	has-text-centered" style="padding:0;margin:0;">${emploiDuTemps[c].matiere} en ${emploiDuTemps[c].salle}${lineBreak}Professeur : ${emploiDuTemps[c].prof}</p>
                        </div>
                      </div>`)
                      if (coursSimultanees) colonne.push('</div>')
                      if (!premièrefoisboucle) {
                        c++
                      }
                      else premièrefoisboucle = false;
                    } while (emploiDuTemps[c+1] && (emploiDuTemps[c].start_date == emploiDuTemps[c+1].start_date));

                    if (coursSimultanees){
                      colonne.push('</div>')
                    }

                    if(emploiDuTemps[c+1] && !(emploiDuTemps[c+1].start_date == emploiDuTemps[c].end_date) && (emploiDuTemps[c+1].start_date.split(" ")[0] == emploiDuTemps[c].start_date.split(" ")[0])){
                    var dureePause =  (parseInt(emploiDuTemps[c+1].start_date.split(" ")[1].split(":")[0])+emploiDuTemps[c+1].start_date.split(" ")[1].split(":")[1]/60)-(parseInt(emploiDuTemps[c].end_date.split(" ")[1].split(":")[0])+emploiDuTemps[c].end_date.split(" ")[1].split(":")[1]/60)
                    var height = 100/(heureFinJournee-heureDebutJournee)*dureePause
                    colonne.push(`
                    <div style="height:${height}%"></div>`)
                    }
                  }
                }
                colonne.push('</div>')
                page.push(colonne.join(""))
              }

              page.push(page_foot)

              nodeHtmlToImage({
                html: page.join("")
              }).then((image)=>{
                const attachment = new MessageAttachment(image)
                if (destination.channel) destination.reply(attachment)
                else global.client.channels.cache.get(destination).send(attachment)
              })
              
            });
            


        })();
    },
};