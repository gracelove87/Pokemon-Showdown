/*

* * * * * * * * * * * * * * * * * * * * * * * * * *
*                                                 *
*                 Renegade-commands.js            *
*                                                 *
*                   By Execute                    *
*                                                 *
*    This is where most misc commands are stored  *
*                                                 *
* * * * * * * * * * * * * * * * * * * * * * * * * *

*/

'use strict';

let request = require('request');
let fs = require('fs');
let pos = ['one', 'two', 'three', 'four', 'five', 'six'];

let teams = {};

try {
	teams = JSON.parse(fs.readFileSync('config/teams.json', 'utf8'));
} catch (e) {
	fs.writeFileSync('config/teams.json', JSON.stringify(teams));
}

function saveTeams () {
	fs.writeFileSync('config/teams.json', JSON.stringify(teams));
}

function userTeam (user) {
	let display = '';
	for (let i = 0; i < pos.length; i++) {
		if (!teams[user][pos[i]]) display += '<button name="send" value="/editteam ' + pos[i]  + '" style="border:0;background:none;"><span class="picon" style="' + Renegade.getPokemonIcon('missingno') + '"/></span></button>';
		else display += '<button name="send" value="/editteam ' + pos[i]  + '" style="border:0;background:none;"><span class="picon" style="' + Renegade.getPokemonIcon(teams[user][pos[i]]) + '"></span></button>';
	}
	return display;
}

function displayAllMons (pos) {
	let display = '';
	for (let mon in Dex.data.Pokedex) {
		display += '<button style="background:none;border:0;" name="send" value="/editteam ' + pos + ',' + Dex.data.Pokedex[mon].species + '" ><span class="picon" style="' + Renegade.getPokemonIcon(Dex.data.Pokedex[mon].species) + '"/></span></button>';
	}
	return display;
}

function clearRoom(room) {
	let len = (room.log && room.log.length) || 0;
	let users = [];
	while (len--) {
		room.log[len] = '';
	}
	for (let u in room.users) {
		users.push(u);
		Users.get(u).leaveRoom(room, Users.get(u).connections[0]);
	}
	len = users.length;
	setTimeout(function () {
		while (len--) {
			Users.get(users[len]).joinRoom(room, Users.get(users[len]).connections[0]);
		}
	}, 1000);
}

exports.commands = {
	title : function (target, room, user) {
		if (!target) return this.parse('/profilehelp');
		if (!this.can('mute')) return false;
		let userid;
		let title;
		let color;
		let parts = target.split(',');
		switch (toId(parts[0])) {
		case 'set':
			if (parts.length < 4) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			color = parts[3].trim();
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			title = Renegade.font('(' + parts[2].trim() + ')', color, true, false);
			Renegade.addTitle(userid, title);
			if (Users.get(userid)) Users.get(userid).popup('|html|Congrats! you have received the title : ' + title);
			return this.sendReply('This title has been added.');
		case 'delete':
			if (parts.length < 2) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.addTitle(userid, null);
			if (Users.get(userid)) Users.get(userid).popup('|html|Sorry, server staff has taken your title away from you.<br>Feel free to contact one of them if you believe this is unjustified.');
			return this.errorReply('This title has been deleted.');
		default:
			return this.parse('/profilehelp');
		}
	},
	bg : 'background',
	background : function (target, room, user) {
		if (!target) return this.parse('/profilehelp');
		if (!this.can('mute')) return false;
		let userid;
		let bg;
		let parts = target.split(',');
		switch (toId(parts[0])) {
		case 'set':
			if (parts.length < 3) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			bg = parts[2].trim();
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.addBackground(userid, bg);
			if (Users.get(userid)) Users.get(userid).popup('|html|Congrats! you have received a background.');
			return this.sendReply('This background has been added.');
		case 'delete':
			if (parts.length < 2) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.addBackground(userid, null);
			if (Users.get(userid)) Users.get(userid).popup('|html|Sorry, server staff has taken your background away from you.<br>Feel free to contact one of them if you believe this is unjustified.');
			return this.sendReply('This user\'s background has been deleted.');
		}
	},
	textcolor : function (target, room, user) {
		if (!target) return this.parse('/profilehelp');
		if (!this.can('mute')) return false;
		let userid;
		let textcolor;
		let parts = target.split(',');
		switch (toId(parts[0])) {
		case 'set':
			if (parts.length < 3) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			textcolor = parts[2].trim();
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.addTextColor(userid, textcolor);
			if (Users.get(userid)) Users.get(userid).popup('|html|Congrats! you have received a custom text color for your profile.');
			return this.sendReply('This text color has been added.');
		case 'delete':
			if (parts.length < 2) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.addTextColor(userid, null);
			if (Users.get(userid)) Users.get(userid).popup('|html|Sorry, server staff has taken your custom text color away from you.<br>Feel free to contact one of them if you believe this is unjustified.');
		}
	},
	profilecolor : function (target, room, user) {
		if (!target) return this.parse('/profilehelp');
		if (!this.can('mute')) return false;
		let userid;
		let profilecolor;
		let parts = target.split(',');
		switch (toId(parts[0])) {
		case 'set':
			if (parts.length < 3) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			profilecolor = parts[2].trim();
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.addProfileColor(userid, profilecolor);
			if (Users.get(userid)) Users.get(userid).popup('|html|Congrats! you have received a custom profile color for your profile.');
			 return this.sendReply('This profile color has been added.');
		case 'delete':
			if (parts.length < 2) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.addProfileColor(userid, null);
			if (Users.get(userid)) Users.get(userid).popup('|html|Sorry, server staff has taken your custom profile color away from you.<br>Feel free to contact one of them if you believe this is unjustified.');
		}
	},
	music : function (target, room, user) {
		if (!target) return this.parse('/profilehelp');
		if (!this.can('mute')) return false;
		let userid;
		let music;
		let parts = target.split(',');
		switch (toId(parts[0])) {
		case 'set':
			if (parts.length < 3) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			music = parts[2].trim();
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.addMusic(userid, music);
			if (Users.get(userid)) Users.get(userid).popup('|html|Congrats! you have received music for your profile.');
			return this.sendReply('This song has been added.');
		case 'delete':
			if (parts.length < 2) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.addMusic(userid, null);
			if (Users.get(userid)) Users.get(userid).popup('|html|Sorry, server staff has taken your custom profile music away from you.<br>Feel free to contact one of them if you believe this is unjustified.');
		}
	},
	dev : function (target, room, user) {
		if (!target) return this.parse('/profilehelp');
		if (!this.can('mute')) return false;
		let userid;
		let parts = target.split(',');
		switch (toId(parts[0])) {
		case 'add':
			if (parts.length < 2) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.editDev(userid, 1);
			if (Users.get(userid)) Users.get(userid).popup('You are now considered a developer!');
			return this.sendReply('This user is now considered a developer.');
		case 'delete':
			if (parts.length < 2) return this.parse('/profilehelp');
			userid = toId(parts[1]);
			if (userid.length > 19) return this.errorReply('This name is too long to be a username.');
			Renegade.editDev(userid, 0);
			if (Users.get(userid)) Users.get(userid).popup('You are no longer considered a developer.');
			return this.sendReply('This user is no longer considered a developer.');
		}
	},
	regdate: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target || !toId(target)) return this.parse('/help regdate');
		let username = toId(target);
		request('http://pokemonshowdown.com/users/' + username, function (error, response, body) {
			if (error && response.statusCode !== 200) {
				this.sendReplyBox(Chat.escapeHTML(target) + " is not registered.");
				return room.update();
			}
			let regdate = body.split('<small>')[1].split('</small>')[0].replace(/(<em>|<\/em>)/g, '');
			if (regdate === '(Unregistered)') {
				this.sendReplyBox(Chat.escapeHTML(target) + " is not registered.");
			} else if (regdate === '(Account disabled)') {
				this.sendReplyBox(Chat.escapeHTML(target) + "'s account is disabled.");
			} else {
				this.sendReplyBox(Chat.escapeHTML(target) + " was registered on " + regdate.slice(7) + ".");
			}
			room.update();
		}.bind(this));
	},
	regdatehelp: ["/regdate - Please specify a valid username."],
		clearall: function (target, room, user) {
		if (!this.can('declare')) return false;
		if (room.battle) return this.sendReply("You cannot clearall in battle rooms.");

		clearRoom(room);
	},

	gclearall: 'globalclearall',
	globalclearall: function (target, room, user) {
		if (!this.can('gdeclare')) return false;

		for (let u in Users.users) {
			Users.users[u].popup("All rooms are being clear.");
		}
		Rooms.rooms.forEach(clearRoom);
	},
	
	rk: 'kick',
	roomkick: 'kick',
	kick: function (target, room, user) {
		if (!target) return this.parse('/help kick');
		if (!this.canTalk() && !user.can('bypassall')) {
			return this.sendReply("You cannot do this while unable to talk.");
		}

		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) return this.sendReply("User \"" + this.targetUsername + "\" not found.");
		if (!this.can('mute', targetUser, room)) return false;

		this.addModCommand(targetUser.name + " was kicked from the room by " + user.name + ".");
		targetUser.popup("You were kicked from " + room.id + " by " + user.name + ".");
		targetUser.leaveRoom(room.id);
	},
	kickhelp: ["/kick - Kick a user out of a room. Requires: % @ # & ~"],
	masspm: 'pmall',
	pmall: function (target, room, user) {
		if (!this.can('pmall')) return false;
		if (!target) return this.parse('/help pmall');

		let pmName = ' Renegade Alerts [Do not reply]';

		Users.users.forEach(function (user) {
			let message = '|pm|' + pmName + '|' + user.getIdentity() + '|' + target;
			user.send(message);
		});
	},
	pmallhelp: ["/pmall [message] - PM all users in the server."],

	staffpm: 'pmallstaff',
	pmstaff: 'pmallstaff',
	pmallstaff: function (target, room, user) {
		if (!this.can('forcewin')) return false;
		if (!target) return this.parse('/help pmallstaff');

		let pmName = ' Staff PM [Do not reply]';

		Users.users.forEach(function (user) {
			if (!user.isStaff) return;
			let message = '|pm|' + pmName + '|' + user.getIdentity() + '|' + target;
			user.send(message);
		});
	},
	pmallstaffhelp: ["/pmallstaff [message] - Sends a PM to every staff member online."],
	
	seen : function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) return this.sendReply('/seen [user] - displays the last time a user was active.');
		let userid = Users.get(target);
		if (userid && userid.connected) return this.sendReplyBox(Renegade.font(userid.name, Renegade.hashcolor(userid.name) , true, false) + ' is <font color="#2ECC40"><b>Currently Online.</b></font>');
		Renegade.lastSeen(toId(target), res => {
			if (!res) {
				this.sendReplyBox(Renegade.font(target.trim(), Renegade.hashcolor(target.trim()), true, false) + ' has never been on Renegade.');
				room.update();
			} else {
				this.sendReplyBox(Renegade.font(target.trim(), Renegade.hashcolor(target.trim()), true, false) + ' was last seen <b>' + res + '</b>.');
			}
		});
	},
	giveteam : function (target, room, user) {
		if (!this.can('mute')) return false;
		if (!target || toId(target).length < 1) return this.sendReply('Usage : /giveteam [user] - Allows a user to edit their profile team');
		let userid = toId(target);
		let userOnline = Users.getExact(userid);
		if (teams[userid] && teams[userid].access === true) return this.errorReply('This user already has the ability to edit his profile team.');
		if (!teams[userid]) {
			teams[userid] = {
				'one':null,
				'two':null,
				'three':null,
				'four':null,
				'five':null,
				'six':null,
				'access':true
			};
		} else {
			teams[user.userid].access = true;
		}
		saveTeams();
		if (userOnline) userOnline.popup('|html|Congrats! Staff has given you the ability to edit your team.<br>To access the teamediting menu, use the command : <b>/editteam</b>');
		return this.sendReply('This user has been granted the ability to edit his team.');
	},
	editteam : function (target, room, user) {
		if (!teams[user.userid] || teams[user.userid].access === false) return this.errorReply('Sorry, You do not have access to edit your profile team.');
		if (!target || toId(target).length < 1) return this.popupReply('|html|<center>' + userTeam(user.userid) + '</center>');
		let parts = target.split(',');
		for (let part in parts) parts[part] = parts[part].trim();
		if (!parts[1] && pos.includes(toId(parts[0]))) return this.popupReply('|html|<center>' + displayAllMons(toId(parts[0])) + '</center>');
		if (!pos.includes(toId(parts[0]))) return this.errorReply('This is not a valid position.');
		let mon = parts[1];
		if (Dex.data.Pokedex[toId(mon)].species !== mon) return this.errorReply('This is not a pokemon.');
		teams[user.userid][toId(parts[0])] = mon;
		saveTeams();
		return this.popupReply('|html|<center><font color="green">Your team has been updated!</font><br>' + userTeam(user.userid) + '</center>');
	},
	taketeam : function (target, room, user) {
		if (!this.can('mute')) return false;
		if (!target) return this.sendReply('Usage : /taketeam [user] - Takes a users ability to edit their team away from them.');
		let userid = toId(target);
		let userOnline = Users.getExact(userid);
		if (!teams[userid] || teams[userid].access === false) return this.errorReply('This user does not the ability to edit his profile team.');
		teams[userid].access = false;
		saveTeams();
		if (userOnline) userOnline.popup('You are no longer able to edit your team.');
		return this.errorReply('This user no longer has the ability to edit their team.');
	},
	deleteteam : function (target, room, user) {
		if (!this.can('mute')) return false;
		if (!target) return this.sendReply('Usage : /taketeam [user] - Takes a users ability to edit their team away from them.');
		let userid = toId(target);
		let userOnline = Users.getExact(userid);
		if (!teams[userid]) return this.errorReply('This user does not have a team.');
		if (userOnline) userOnline.popup('Your team has been cleared.');
		delete teams[userid];
		saveTeams();
		return this.sendReply('This user\'s team has been deleted.');
	}
};
