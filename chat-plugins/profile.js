/*
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                           Profiles                                    *
 *                                                                       *
 *                          By Execute                                   *
 *                                                                       *
 *   Commands need to customize a Profile found in Renegade-commands.js  *
 *                                                                       *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */

'use strict';

const moment = require('moment');
const fs = require('fs');

const pos = ['one', 'two', 'three', 'four', 'five', 'six'];
const space = '&nbsp;';

let teams = {};

try {
	teams = JSON.parse(fs.readFileSync('config/teams.json', 'utf8'));
} catch (e) {
	fs.writeFileSync('config/teams.json', JSON.stringify(teams));
}

function loadTeams () {
	teams = JSON.parse(fs.readFileSync('config/teams.json', 'utf8'));
}

function userTeam (user) {
	let display = '<div style="border: 1px solid black ; background: rgba(47 , 46 , 44 , 0.54) ;border-radius:12px;">';
	if (!user) {
		for (let i = 0; i < 6; i++) {
			display += '<span class="picon" style="' + Renegade.getPokemonIcon('missingno') + '"/></span>';
		}
		display += '</div>';
		return display;
	}
	for (let i = 0; i < pos.length; i++) {
		if (!teams[user][pos[i]]) display += '<span class="picon" style="' + Renegade.getPokemonIcon('missingno') + '"/></span>';
		else display += '<button name="send" value="/dt ' + Dex.data.Pokedex[toId(teams[user][pos[i]])].species  + '" style="border:0;background:none;"><span class="picon" style="' + Renegade.getPokemonIcon(teams[user][pos[i]]) + '"></span></button>';
		if (i === 2) display += '<br>';
	}
	display += '</div>';
	return display;
}

exports.commands = {
    profile: function (target, room, user) {
    	if (!target) target = user.name;
		if (toId(target).length > 19) return this.sendReply("Usernames may not be more than 19 characters long.");
		if (toId(target).length < 1 || toId(target) === 'constructor') return this.sendReply(target + " is not a valid username.");
		if (!this.runBroadcast()) return;
		let targetUser = Users.getExact(target);
		let username = (targetUser ? targetUser.name : target);
		let userid = toId(username);
		let avatar = (Config.customavatars[userid] ? 'http://158.69.217.41:8000/avatars/' + Config.customavatars[userid] : "http://play.pokemonshowdown.com/sprites/trainers/167.png");
		if (targetUser) {
			avatar = (isNaN(targetUser.avatar) && targetUser.avatar[0] !== '#' ? 'http://158.69.217.41:8000/avatars/' + targetUser.avatar : "http://play.pokemonshowdown.com/sprites/trainers/" + toId(targetUser.avatar) + ".png");
		}
		let userSymbol = (Users.usergroups[userid] ? Users.usergroups[userid].substr(0, 1) : "Regular User");
		let userGroup = (Config.groups[userSymbol] ? Config.groups[userSymbol].name : "Regular User");
		Renegade.getProfileData(userid, data => {
		    let display = '';
		    let profColor = data.profilecolor || '#24678d';
		    loadTeams();
		    display += '<div class="infobox"' + (data.background ? ' style="background:url(' + data.background + ');background-size:cover;' + (data.textcolor ? 'color:' + data.textcolor + ';">' : '">') : (data.textcolor ? 'style="color:' + data.textcolor + '">' : '>') );
		    display += '<button style="border:none;background:none;float:left;" name="parseCommand" value="/user ' + username + '">' + Renegade.img(avatar, 80, 80) + '</button>';
		    display += space + Renegade.font('Name: ', profColor, true, false) + Renegade.font(username, Renegade.hashcolor(username), true, false) + (data.title ? ' ' + data.title : '') + ( teams[userid] ? '<div style="float:right">' + userTeam(userid) + '</div>' : '<div style="float:right">' + userTeam(null) + '</div>') + '<br>';
		    display += space + Renegade.font('Group: ', profColor, true, false) + userGroup + (data.isDev ? Renegade.font(' (Developer)', data.textcolor, true, false) : '') + '<br>';
		    display += space + Renegade.font('Money: ', profColor, true, false) + data.money + (data.money === 1 ? ' buck' : ' bucks') + '<br>';
		    display += space + Renegade.font('Last Seen: ', profColor, true, false)  + ( targetUser ? '<font color="#2ECC40"><b>Currently Online</b></font>' : ( data.seen ? moment(data.seen).fromNow() : '<font color="red"><b>Never</b></font>') ) + '<br>';
		    display += space + Renegade.font('Registered On: ', profColor, true, false) + data.regdate;
		    display += '<br clear="all"></div>';
		    this.sendReply('|html|' + display);
		    room.update();
		});
	},
};
