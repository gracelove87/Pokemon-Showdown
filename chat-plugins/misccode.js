'use strict';

const moment = require('moment');
const request = require('request');

global.Grace = {};

const messages = [
	"has vanished into nothingness!",
	"used Explosion!",
	"fell into the void.",
	"went into a cave without a repel!",
	"has left the building.",
	"was forced to give StevoDuhHero's mom an oil massage!",
	"was hit by Magikarp's Revenge!",
	"ate a bomb!",
	"is blasting off again!",
	"(Quit: oh god how did this get here i am not good with computer)",
	"was unfortunate and didn't get a cool message.",
	"{{user}}'s mama accidently kicked {{user}} from the server!",
];

const MD5 = require('MD5');
const http = require('http');
const fs = require('fs');
const defineWord = require('define-word');
let amCache = {anime:{}, manga:{}};
let colorCache = {};
let mainColors = {};
Grace.customColors = {};
Grace.staffSymbol = {};
let regdateCache = {};
Users.vips = [];

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

  deroomauthall: function (target, room, user) {
    if (!this.can('root', null, room)) return false;
    if (!room.auth) return this.errorReply("Room does not have any roomauth to delete.");
    if (!target) {
      user.lastCommand = '/deroomauthall';
      this.errorReply("ALL ROOMAUTH WILL BE GONE, ARE YOU SURE?");
      this.errorReply("To confirm, use: /deroomauthall confirm");
      return;
    }
    if (user.lastCommand !== '/deroomauthall' || target !== 'confirm') {
      return this.parse('/help deroomauthall');
    }
    let count = 0;
    for (let userid in room.auth) {
      if (room.auth[userid] === '+', '$', '%', '@', '&', '#') {
        delete room.auth[userid];
        if (userid in room.users) room.users[userid].updateIdentity(room.id);
        count++;
      }
    }
    if (!count) {
      return this.sendReply("(This room has no roomauth)");
    }
    if (room.chatRoomData) {
      Rooms.global.writeChatRoomData();
    }
    this.addModCommand("All " + count + " roomauth has been cleared by " + user.name + ".");
  },
  deroomauthallhelp: ["/deroomauthall - Deauths all roomauthed users. Requires: ~"],

  report: 'reportuser',
  reportuser: function (target, room, user, connection) {
    if (!target) return this.parse('/help reportuser');
    if (!this.canTalk()) return this.errorReply("You cannot do this while unable to talk. If you're trying to report staff, use /reportstaff!");

    if (target.length > MAX_REASON_LENGTH) {
      return this.errorReply("The report is too long. It cannot exceed " + MAX_REASON_LENGTH + " characters.");
    }
    if (!this.can('minigame', null, room)) return false;
    let targetRoom = Rooms.get('staff');
    targetRoom.add('[User Report Monitor] ' + (room ? '(' + room + ') ' : '') + Chat.escapeHTML(user.name) + ' has reported that "' + target + '"').update();
    return this.sendReply("Your report has been received. Thank you for your time!")
  },
  reportuserhelp: ["/reportuser [note + pastebin] - Reports something to Staff. [False reports are ZERO tolerance] Viewed by: % @ & ~"],

  userid: function(target, room, user) {
    if (!target) return this.sendReply('You must specify a user');
    target = this.splitTarget(target);
    let targetUser = this.targetUser;
    this.sendReply('The userid of this.targetUser is ' + targetUser);
  },

  alert: function(target, room, user) {
    if (user.can('rangeban')) {
      target = this.splitTarget(target);
      let targetUser = this.targetUser;
      if (!targetUser) return this.sendReply('You need to specify a user.');
      if (!target) return this.sendReply('You need to specify a message to be sent.');
      targetUser.popup(target);
      this.sendReply(targetUser.name + ' successfully recieved the message: ' + target);
      targetUser.send(user.name + ' sent you a popup alert.');
      this.addModCommand(user.name + ' sent a popup alert to ' + targetUser.name);
    }
  },

  forcelogout: function(target, room, user) {
    if (user.can('hotpatch')) {
      if (!target) return this.sendReply('You must specify a target.');
      target = this.splitTarget(target);
      let targetUser = this.targetUser;
      if (targetUser.can('hotpatch')) return this.sendReply('You cannot logout an Administrator.');
      this.addModCommand(targetUser + ' was forcibly logged out by ' + user.name + '.');
      targetUser.resetName();
    }
  },

  roomlist: function (target, room, user) {
		if(!this.can('lock')) return;
		let totalUsers = 0;
		for (let u of Users.users) {
			u = u[1];
			if (Users(u).connected) {
				totalUsers++;
			}
		}
		let rooms = Object.keys(Rooms.rooms),
			len = rooms.length,
			header = ['<b><font color="#777777" size="2">Total users connected: ' + totalUsers + '</font></b><br />'],
			official = ['<b><font color="#777777" size="2"><u>Official chat rooms:</u></font></b><br />'],
			nonOfficial = ['<hr><b><u><font color="#777777" size="2">Public chat rooms:</font></u></b><br />'],
			privateRoom = ['<hr><b><u><font color="#777777" size="2">Private chat rooms:</font></u></b><br />'],
			groupChats = ['<hr><b><u><font color="#777777" size="2">Group Chats:</font></u></b><br />'],
			battleRooms = ['<hr><b><u><font color="#777777" size="2">Battle Rooms:</font></u></b><br />'];
		while (len--) {
			let _room = Rooms.rooms[rooms[(rooms.length - len) - 1]];
			if (_room.type === 'battle') {
				battleRooms.push('<a href="/' + _room.id + '" class="ilink">' + _room.title + '</a> (' + _room.userCount + ')');
			}
			if (_room.type === 'chat') {
				if (_room.isPersonal) {
					groupChats.push('<a href="/' + _room.id + '" class="ilink">' + _room.id + '</a> (' + _room.userCount + ')');
					continue;
				}
				if (_room.isOfficial) {
					official.push('<a href="/' + toId(_room.title) + '" class="ilink">' + _room.title + '</a> (' + _room.userCount + ')');
					continue;
				}
				if (_room.isPrivate) {
					privateRoom.push('<a href="/' + toId(_room.title) + '" class="ilink">' + _room.title + '</a> (' + _room.userCount + ')');
					continue;
				}
			}
			if (_room.type !== 'battle' && _room.id !== 'global') nonOfficial.push('<a href="/' + toId(_room.title) + '" class="ilink">' + _room.title + '</a> (' + _room.userCount + ')');
		}
		this.sendReplyBox(header + official.join(' ') + nonOfficial.join(' ') + privateRoom.join(' ') + (groupChats.length > 1 ? groupChats.join(' ') : '') + (battleRooms.length > 1 ? battleRooms.join(' ') : ''));
  },

  clearall: function (target, room, user) {
    if (!this.can('ban')) return;
		if (room.battle) return this.sendReply('You cannot do it on battle rooms.');

		let len = room.log.length,
      users = [];
    while (len--) {
      room.log[len] = '';
    }
		for (let user in room.users) {
      users.push(user);
      Users.get(user).leaveRoom(room, Users.get(user).connections[0]);
      len = users.length;
      setTimeout(function () {
        while (len--) {
          Users.get(users[len]).joinRoom(room, Users.get(users[len]).connections[0]);
        }
      }, 1000);
    }
  },

	stafflist: 'authority',
	auth: 'authority',
	authlist: 'authority',
	authority: function (target, room, user, connection) {
		let rankLists = {};
		let ranks = Object.keys(Config.groups);
		for (let u in Users.usergroups) {
			let rank = Users.usergroups[u].charAt(0);
			// In case the usergroups.csv file is not proper, we check for the server ranks.
			if (ranks.indexOf(rank) > -1) {
				let name = Users.usergroups[u].substr(1);
				if (!rankLists[rank]) rankLists[rank] = [];
				if (name) rankLists[rank].push(((Users.getExact(name) && Users.getExact(name).connected) ? '**' + name + '**' : name));
			}
		}

		let buffer = [];
		Object.keys(rankLists).sort(function (a, b) {
			return (Config.groups[b] || {rank: 0}).rank - (Config.groups[a] || {rank: 0}).rank;
		}).forEach(function (r) {
			buffer.push((Config.groups[r] ? r + Config.groups[r].name + "s (" + rankLists[r].length + ")" : r) + ":\n" + rankLists[r].sort().join(", "));
		});

		if (!buffer.length) {
			return connection.popup("This server has no auth.");
		}
		connection.popup(buffer.join("\n\n"));
	},

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

		for (let r in Rooms.rooms) {
			clearRoom(Rooms.rooms[r]);
		}
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

	kickall: function (target, room, user, connection) {
		if (!this.can('makeroom')) return false;
		let targetUser;
		for (var f in room.users) {
			targetUser = Users.getExact(room.users[f]);
			if (!targetUser) {
				delete room.users[f];
			} else {
				targetUser.leaveRoom(room.id);
			}
		}
		room.userCount = 0;
		this.addModCommand("" + user.name + " has kicked all users from room " + room.id + '.');
		setTimeout(function () {user.joinRoom(room.id);}, 2000);
	},

	masspm: 'pmall',
	pmall: function (target, room, user) {
		if (!this.can('hotpatch')) return false;
		if (!target) return this.parse('/help pmall');

		let pmName = '~' + user.name + ' [MassPM]';

		Users.users.forEach(function (user) {
			let message = '|pm|' + pmName + '|' + user.getIdentity() + '|' + target;
			user.send(message);
		});
	},
	pmallhelp: ["/pmall [message] - PM all users in the server."],

	staffpm: 'pmallstaff',
	pmstaff: 'pmallstaff',
	pmallstaff: function (target, room, user) {
		if (!this.can('hotpatch')) return false;
		if (!target) return this.parse('/help pmallstaff');

		let pmName = '~' + user.name + ' [StaffPM]';

		Users.users.forEach(function (user) {
			if (!user.isStaff) return;
			let message = '|pm|' + pmName + '|' + user.getIdentity() + '|' + target;
			user.send(message);
		});
	},
	pmallstaffhelp: ["/pmallstaff [message] - Sends a PM to every staff member online."],

	d: 'poof',
	cpoof: 'poof',
	poof: function (target, room, user) {
		if (Config.poofOff) return this.sendReply("Poof is currently disabled.");
		if (target && !this.can('broadcast')) return false;
		if (room.id !== 'lobby') return false;
		let message = target || messages[Math.floor(Math.random() * messages.length)];
		if (message.indexOf('{{user}}') < 0) message = '{{user}} ' + message;
		message = message.replace(/{{user}}/g, user.name);
		if (!this.canTalk(message)) return false;

		let colour = '#' + [1, 1, 1].map(function () {
			let part = Math.floor(Math.random() * 0xaa);
			return (part < 0x10 ? '0' : '') + part.toString(16);
		}).join('');

		room.addRaw("<strong><font color=\"" + colour + "\">~~ " + Chat.escapeHTML(message) + " ~~</font></strong>");
		user.disconnectAll();
	},
	poofhelp: ["/poof - Disconnects the user and leaves a message in the room."],

	poofon: function () {
		if (!this.can('poofoff')) return false;
		Config.poofOff = false;
		return this.sendReply("Poof is now enabled.");
	},
	poofonhelp: ["/poofon - Enable the use /poof command."],

	nopoof: 'poofoff',
	poofoff: function () {
		if (!this.can('poofoff')) return false;
		Config.poofOff = true;
		return this.sendReply("Poof is now disabled.");
	},
	poofoffhelp: ["/poofoff - Disable the use of the /poof command."],

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

	seen: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) return this.parse('/help seen');
		let targetUser = Users.get(target);
		if (targetUser && targetUser.connected) return this.sendReplyBox(targetUser.name + " is <b>currently online</b>.");
		target = Chat.escapeHTML(target);
		let seen = Db('seen').get(toId(target));
		if (!seen) return this.sendReplyBox(target + " has never been online on this server.");
		this.sendReplyBox(target + " was last seen <b>" + moment(seen).fromNow() + "</b>.");
	},
	seenhelp: ["/seen - Shows when the user last connected on the server."],

	tell: function (target, room, user, connection) {
		if (!target) return this.parse('/help tell');
		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (!target) {
			this.sendReply("You forgot the comma.");
			return this.parse('/help tell');
		}

		if (targetUser && targetUser.connected) {
			return this.parse('/pm ' + this.targetUsername + ', ' + target);
		}

		if (user.locked) return this.popupReply("You may not send offline messages when locked.");
		if (target.length > 255) return this.popupReply("Your message is too long to be sent as an offline message (>255 characters).");

		if (Config.tellrank === 'autoconfirmed' && !user.autoconfirmed) {
			return this.popupReply("You must be autoconfirmed to send an offline message.");
		} else if (!Config.tellrank || Config.groupsranking.indexOf(user.group) < Config.groupsranking.indexOf(Config.tellrank)) {
			return this.popupReply("You cannot send an offline message because offline messaging is " +
				(!Config.tellrank ? "disabled" : "only available to users of rank " + Config.tellrank + " and above") + ".");
		}

		let userid = toId(this.targetUsername);
		if (userid.length > 18) return this.popupReply("\"" + this.targetUsername + "\" is not a legal username.");

		let sendSuccess = Tells.addTell(user, userid, target);
		if (!sendSuccess) {
			if (sendSuccess === false) {
				return this.popupReply("User " + this.targetUsername + " has too many offline messages queued.");
			} else {
				return this.popupReply("You have too many outgoing offline messages queued. Please wait until some have been received or have expired.");
			}
		}
		return connection.send('|pm|' + user.getIdentity() + '|' +
			(targetUser ? targetUser.getIdentity() : ' ' + this.targetUsername) +
			"|/text This user is currently offline. Your message will be delivered when they are next online.");
	},
	tellhelp: ["/tell [username], [message] - Send a message to an offline user that will be received when they log in."],

  togglegdeclares: function (target, room, user) {
		if (!this.can('declare', null, room)) return false;
		if (room.isOfficial && this.can('gdeclare')) return this.errorReply("Only global leaders may toggle global declares in official rooms.");
		if (!room.chatRoomData) return this.errorReply("You can't toggle global declares in this room.");
		let status = !room.disableGlobalDeclares;
		room.disableGlobalDeclares = status;
		room.chatRoomData.disableGlobalDeclares = status;
		Rooms.global.writeChatRoomData();
		this.privateModCommand("(" + user.name + " has " + (status ? "disabled" : "enabled") + " global declares in this room.)");
	},

	etour: function (target, room, user) {
		if (!target) return this.parse("/help etour");
		this.parse("/tour create " + target + ", elimination");
	},
	etourhelp: ["/etour [format] - Creates an elimination tournament."],

	endpoll: function (target, room, user) {
		this.parse("/poll end");
	},

	votes: function (target, room, user) {
		if (!room.poll) return this.errorReply("There is no poll running in this room.");
		if (!this.runBroadcast()) return;
		this.sendReplyBox("votes: " + room.poll.totalVotes);
	},

	endtour: function (target, room, user) {
		this.parse("/tour end");
	},

  def: 'define',
	define: function (target, room, user) {
		if (!target) return this.sendReply('Usage: /define <word>');
		target = toId(target);
		if (target > 50) return this.sendReply('/define <word> - word can not be longer than 50 characters.');
		if (!this.runBroadcast()) return;

		let options = {
			host: 'api.wordnik.com',
			port: 80,
			path: '/v4/word.json/' + target + '/definitions?limit=3&sourceDictionaries=all' +
			'&useCanonical=false&includeTags=false&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5',
			method: 'GET',
		};

		http.get(options, res => {
			let data = '';
			res.on('data', chunk => {
				data += chunk;
			}).on('end', () => {
				data = JSON.parse(data);
				let output = '<font color=#24678d><b>Definitions for ' + target + ':</b></font><br />';
				if (!data[0]) {
					this.sendReplyBox('No results for <b>"' + target + '"</b>.');
					return room.update();
				} else {
					let count = 1;
					for (let u in data) {
						if (count > 3) break;
						output += '(<b>' + count + '</b>) ' + Chat.escapeHTML(data[u]['text']) + '<br />';
						count++;
					}
					this.sendReplyBox(output);
					return room.update;
				}
			});
		});
	},

	u: 'urbandefine',
	ud: 'urbandefine',
	urbandefine: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) return this.parse('/help urbandefine');
		if (target.toString() > 50) return this.sendReply('Phrase can not be longer than 50 characters.');
		let self = this;
		let options = {
			host: 'api.urbandictionary.com',
			port: 80,
			path: '/v0/define?term=' + encodeURIComponent(target),
			term: target,
		};

		http.get(options, res => {
			let data = '';
			res.on('data', chunk => {
				data += chunk;
			}).on('end', () => {
				data = JSON.parse(data);
				let definitions = data['list'];
				if (data['result_type'] === 'no_results') {
					this.sendReplyBox('No results for <b>"' + Chat.escapeHTML(target) + '"</b>.');
					return room.update();
				} else {
					if (!definitions[0]['word'] || !definitions[0]['definition']) {
						self.sendReplyBox('No results for <b>"' + Chat.escapeHTML(target) + '"</b>.');
						return room.update();
					}
					let output = '<b>' + Chat.escapeHTML(definitions[0]['word']) + ':</b> ' + Chat.escapeHTML(definitions[0]['definition']).replace(/\r\n/g, '<br />').replace(/\n/g, ' ');
					if (output.length > 400) output = output.slice(0, 400) + '...';
					this.sendReplyBox(output);
					return room.update();
				}
			});
		});
	},
};
