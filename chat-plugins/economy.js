/***************************************************
*                                                  *
*                  Economy                         *
*                                                  *
*                 By Execute                       *
*                                                  *
* Please Use this in Conjunction with Renegade.js  *
*                                                  *
****************************************************/

'use strict';

const shortid = require('shortid');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const file = 'logs/money.txt';
const shopFile = 'logs/shop.txt';
const lightcss = 'width:100px;background-color:#333333;border: 1px solid white;border-radius:6px;color:white;box-shadow: 0px 0px 5px #fff;';
const darkcss = 'width:100px;background-color:#999999;border: 1px solid white;border-radius:6px;color:white;box-shadow: 0px 0px 5px #fff;';
const db = new sqlite3.Database('config/Renegade.db', function () {
	db.run("CREATE TABLE IF NOT EXISTS users(userid TEXT, money INTEGER, title TEXT, profilecolor TEXT, textcolor TEXT, background TEXT, music TEXT, isDev NUMBER, seen INTEGER)");
});
const shop = new sqlite3.Database('config/shop.db', function () {
	shop.run("CREATE TABLE IF NOT EXISTS items(name TEXT, id TEXT, desc TEXT, price INTEGER)");
});

let requests = {};

try {
	requests = JSON.parse(fs.readFileSync('config/requests.json', 'utf8'));
} catch (e) {
	console.log('Error Loading requests file....');
	console.log('Creating new json....');
	fs.writeFileSync('config/requests.json', JSON.stringify(requests));
	console.log('Created!');
}

function saveRequests() {
	fs.writeFileSync('config/requests.json', JSON.stringify(requests));
}

exports.commands = {
	wallet: 'atm',
	purse: 'atm',
	cashmachine: 'atm',
	atm: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) target = user.userid;
		target = toId(target);
		if (target.length > 18) return this.errorReply('Usernames may not be more than 18 characters.');
		Renegade.getMoney(target, atm => {
			this.sendReplyBox(Renegade.font(target, Renegade.hashcolor(target), true, false) + ' has ' + atm + (atm === 1 ? ' buck.' : ' bucks.'));
			if (this.broadcasting && room) room.update();
		});
	},
	givemoney: 'givebucks',
	givebucks: function (target, room, user) {
		if (!this.can('declare')) return false;
		if (!target) return this.sendReply('Usage : /givebucks (user), (amount), (reason)');
		let parts = target.split(',');
		if (parts.length < 3) return this.errorReply('Usage : /givebucks (user), (amount), (reason)');
		let userid = toId(parts[0]);
		let amount = Math.round(Number(parts[1].trim()));
		let reason = parts[2].trim();
		if (userid.length > 18) return this.errorReply('Usernames may not be more than 18 characters.');
		if (isNaN(amount)) return this.errorReply('/givebucks - Must provide a number.');
		if (toId(reason).length < 1) return this.errorReply('You must provide a reason.');
		Renegade.addMoney(userid, amount);
		Renegade.getMoney(userid, atm => {
			if (Users.get(userid) && Users.get(userid).connected) Users.get(userid).popup('You have been given ' + amount + (amount === 1 ? ' buck.' : ' bucks.') + ' You now have ' + atm + (atm === 1 ? ' buck.' : ' bucks.'));
		});
		Renegade.log(file, userid + ' has been given ' + amount + (amount === 1 ? ' buck' : ' bucks') + ' by ' + user.name + '. [' + reason + ']');
		return this.sendReply(userid + ' has been given ' + amount + (amount === 1 ? '  buck.' : ' bucks.'));
	},
	takemoney: 'takebucks',
	takebucks: function (target, room, user) {
		if (!this.can('declare')) return false;
		if (!target) return this.sendReply('Usage : /takeebucks (user), (amount), (reason)');
		let parts = target.split(',');
		if (parts.length < 3) return this.sendReply('Usage : /takeebucks (user), (amount), (reason)');
		let userid = toId(parts[0]);
		let amount = Math.round(Number(parts[1].trim())) * -1;
		let reason = parts[2].trim();
		if (userid.length > 18) return this.errorReply('Usernames may not be more than 18 characters.');
		if (isNaN(amount)) return this.errorReply('/givebucks - Must provide a number.');
		if (toId(reason).length < 1) return this.errorReply("Please specify a reason to give bucks.");
		Renegade.getMoney(userid, atm => {
			if (atm < (amount * -1)) {
				return this.errorReply('You cannot take away more bucks than a user has.');
			} else {
				Renegade.addMoney(userid, amount);
				Renegade.getMoney(userid, atm => {
					if (Users.get(userid) && Users.get(userid).connected) Users.get(userid).popup('You have been taken of ' + (amount * -1) + (amount === 1 ? ' buck.' : ' bucks.') + ' You now have ' + atm + (atm === 1 ? ' buck.' : ' bucks.'));
				});
				Renegade.log(file, userid + ' has been taken of ' + (amount * -1) + (amount === 1 ? ' buck' : ' bucks') + ' by ' + user.name + '.');
				return this.sendReply(userid + ' has been taken of ' + (amount * -1) + (amount === 1 ? '  buck.' : ' bucks. [' + reason + ']'));
			}
		});
	},
	confirmtransferbucks: 'transferbucks',
	transferbucks: function (target, room, user, connection, cmd) {
		if (!target) return this.sendReply('Usage : /transferbucks (user), (amount), (reason)');
		let parts = target.split(',');
		if (parts.length < 3) return this.sendReply('Usage : /transferbucks (user), (amount), (reason)');
		let userid = toId(parts[0]);
		let amount = Math.round(Number(parts[1].trim()));
		let reason = parts[2].trim();
		if (amount < 0) return this.errorReply('You cannot transfer a negative amount of bucks.');
		if (userid.length > 18) return this.errorReply('Usernames may not be more than 18 characters.');
		if (isNaN(amount)) return this.errorReply('/transferbucks - Must provide a number.');
		if (toId(reason).length < 1) return this.errorReply("Please specify a reason to give bucks.");
		Renegade.getMoney(user.userid, atm => {
			if (atm < amount) return this.errorReply('You cannot transfer more money than you have.');
			if (cmd !== 'confirmtransferbucks') {
				return this.popupReply('|html|<font color="red"><center><b>CLick the button below to confirm you want to transfer ' + amount + (amount === 1 ? ' buck ' : ' bucks ') + 'to ' + userid + '</b><br><button name="send" value="/confirmtransferbucks ' + userid + ',' + amount + ',' + reason + '">Confirm</button><br><b>If no staff member was involved in this transaction, we are not intervene in any conflicts that may arise.<br><br>YOU have been warned.</b></center></font>');
			}
			Renegade.addMoney(userid, amount);
			Renegade.addMoney(user.userid, -amount);
			if (Users.get(userid) && Users.get(userid).connected) Users.get(userid).popup('You have been given ' + amount + (amount === 1 ? ' buck by ' + user.name + '.' : ' bucks by ' + user.name + '.') + ' You now have ' + (atm + amount) + (atm === 1 ? ' buck.' : ' bucks.'));
			this.sendReply('You have successfully transfered ' + amount + (amount === 1 ? ' buck ' : ' bucks ') + 'to ' + userid + ' and now have ' + (atm - amount) + ((atm - amount) === 1 ? ' buck ' : ' bucks '));
			this.popupReply('You have successfully transfered ' + amount + (amount === 1 ? ' buck ' : ' bucks ') + 'to ' + userid + ' and now have ' + (atm - amount) + ((atm - amount) === 1 ? ' buck ' : ' bucks '));
			Renegade.log(file, user.name + ' has transfered ' + amount + (amount === 1 ? ' buck ' : ' bucks ') + 'to ' + userid + '. [' + reason + ']');
		});
	},
	shop: function (target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) {
			Renegade.allShopItems(items => {
				if (items === 'no items') {
					this.errorReply('There are no items in the shop at the moment, we are sorry for the disappointment.');
				} else {
					let display = '<div style="background:rgba(47,46,44,0.72);text-align:center;color:white;border: 1px solid black; border-radius:12px;"><marquee><i><b><font size="12px">Renegade\'s Shop!</font></b></i></marquee></div><br><div style="max-height:350px;    overflow-y: scroll;"><table cellpadding="5px" width="100%" cellspacing="0" style="border-collapse:collapse;border-spacing:0;"><tr style="color:white;"><th style="border: 1px solid black;background:rgba(47,46,44,0.72);">Item Name</th><th style="border: 1px solid black;background:rgba(47,46,44,0.72);">Description</th><th style="border: 1px solid black;background:rgba(47,46,44,0.72);">Price</th></tr>';
					for (let i = 0; i < items.length; i++) {
						display += '<tr style="color:white;">';
						display += '<td style="border: 1px solid black;background:' + (i % 2 === 0 ? 'rgba(47,46,44,0.32)' : 'rgba(47,46,44,0.54)') + ';text-align:center;"><button style="' + (i % 2 === 0 ? lightcss : darkcss) + '" name="send" value="/buy ' + items[i].id + '">' + items[i].name + '</button></td><td style="border: 1px solid black;background:' + (i % 2 === 0 ? 'rgba(47,46,44,0.32)' : 'rgba(47,46,44,0.54)') + ';text-align:center;">' + items[i].desc + '</td><td style="border: 1px solid black;background:' + (i % 2 === 0 ? 'rgba(47,46,44,0.32)' : 'rgba(47,46,44,0.54)') + ';text-align:center;">' + items[i].price + '</td>';
						display += '<tr/>';
					}
					display += '</table></div><br><br><div style="background:rgba(47,46,44,0.72);text-align:center;color:white;border: 1px solid black; border-radius:12px;font-size:16px;"><marquee><i>REMINDERS : Purchases are not refundable. There are currently no sales going on at this moment.</i></marquee></div>';
					this.sendReply('|html|' + display);
					if (this.broadcasting && room) room.update();
				}
			});
		}
		let parts = target.split(',');
		switch (toId(parts[0])) {
		case 'add':
			if (!this.can('declare')) return false;
			if (parts.length < 4) return this.sendReply('Usage /shop add, (item name), (desc), (price)');
			let itemName = parts[1].trim();
			let desc = parts[2].trim();
			let price = Math.round(Number(parts[3].trim()));
			if (isNaN(price)) return this.errorReply('/shop - Must provide a numerical value for the price.');
			Renegade.addShopItem(itemName, desc, price, returnValue => {
				if (returnValue === '<font color="maroon">This item is already exists in the shop.</font>') {
					this.sendReply('|html|' + returnValue);
				} else {
					Renegade.log(shopFile, itemName + ' has been added to the shop. (price:' + price + ',' + 'desc:' + desc + ') by ' + user.name + '.');
					this.sendReply('|html|' + returnValue);
					Rooms.rooms.get("staff").add('|c|~Shop Monitor|**' + user.name + '** has added a new item to the shop. **' + itemName + '** is now open to be purchased.');
					Rooms.rooms.get("staff").update();
				}
			});
			break;
		case 'delete':
			if (!this.can('declare')) return false;
			if (parts.length < 2) return this.sendReply('Usage : /shop delete, item name');
			let item = toId(parts[1]);
			Renegade.removeShopItem(item, result => {
				if (result === '<font color="maroon">This item was not found in the shop.</font>') {
					this.sendReply('|html|' + result);
				} else {
					Renegade.log(shopFile, item + ' has been removed from the shop by ' + user.name + '.');
					this.sendReply(result);
					Rooms.rooms.get("staff").add('|c|~Shop Monitor|**' + user.name + '** has removed the shop item ' + item + ' and is now not apart of the shop.');
					Rooms.rooms.get("staff").update();
				}
			});
			break;
		case 'clear':
			Renegade.isDev(user.userid, result => {
				if (result) {
					Renegade.clearShop(result => {
						this.sendReply('Shop was cleared.');
						Rooms.rooms.get("staff").add('|c|~Shop Monitor|**' + user.name + '** has cleared all the shop data. There is no shop at the moment.');
						Rooms.rooms.get("staff").update();
						Renegade.log(shopFile, user.name + ' has cleared the shop.');
					});
				} else {
					this.sendReply('You must be a developer of Renegade to use this command.');
				}
			});
			break;
		}
	},
	buy: function (target, room, user) {
		if (!target) return this.errorReply('Usage: /buy (item)');
		target = toId(target);
		Renegade.getPrice(target, item => {
			if (item.price === false) {
				return this.errorReply('This item was not found in our shop.');
			} else {
				Renegade.getMoney(user.userid, atm => {
					if (atm < item.price) return this.errorReply('You do not have enough money to purchase a ' + item.name + '. You need ' + (item.price - atm) + ' more buck' + ((item.price - atm) === 1 ? '.' : 's.'));
					Renegade.addMoney(user.userid, -item.price);
					Renegade.log(shopFile, user.name + ' has purchased ' + item.id + '. He or She now has ' + (atm - item.price) + ' buck' + ((atm - item.price) === 1 ? '.' : 's.'));
					this.sendReply('You have purchased a ' + item.name + '. You now have ' + (atm - item.price) + ' buck' + ((atm - item.price) === 1 ? '.' : 's. You obtain your purchase, contact staff.'));
					let id = shortid.generate();
					requests[id] = [user.userid, item.name, id];
					saveRequests();
					Rooms.rooms.get("staff").add('|c|~Shop Monitor|**' + user.name + '** has purchased the shop item **' + item.name + '**.');
					Rooms.rooms.get("staff").update();
				});
			}
		});
	},
	richestusers: function (target, room, user) {
		if (!target) target = 10;
		target = Number(target);
		if (isNaN(target)) target = 10;
		if (!this.runBroadcast()) return;
		if (this.broadcasting && target > 10) target = 10;
		if (target > 500) target = 500;
		Renegade.richestUsers(target, rows => {
			let display = '<div style="background:rgba(47,46,44,0.72);text-align:center;border: 1px solid black; border-radius:12px;"><i><b><font size="12px">Richest Users!</font></b></i></div><br><div style="max-height:350px;    overflow-y: scroll;"><table cellpadding="5px" width="100%" cellspacing="0" style="border-collapse:collapse;border-spacing:0;"><tr><th style="border: 1px solid black;background:rgba(47,46,44,0.72);">Place</th><th style="border: 1px solid black;background:rgba(47,46,44,0.72);">User</th><th style="border: 1px solid black;background:rgba(47,46,44,0.72);">Bucks</th></tr>';
			for (let i = 0; i < rows.length; i++) {
				display += '<tr>';
				display += '<td style="border: 1px solid black;background:' + (i % 2 === 0 ? 'rgba(47,46,44,0.32)' : 'rgba(47,46,44,0.54)') + ';text-align:center;">' + (i + 1) + '</td><td style="border: 1px solid black;background:' + (i % 2 === 0 ? 'rgba(47,46,44,0.32)' : 'rgba(47,46,44,0.54)') + ';text-align:center;">' + rows[i].userid + '</td><td style="border: 1px solid black;background:' + (i % 2 === 0 ? 'rgba(47,46,44,0.32)' : 'rgba(47,46,44,0.54)') + ';text-align:center;">' + rows[i].money + '</td>';
				display += '<tr/>';
			}
			display += '</table></div>';
			this.sendReply('|html|' + display);
			if (this.broadcasting && room) room.update();
		});
	},
	requests: function (target, room, user) {
		if (!target) return this.parse('/requests view');
		if (!this.can('mute')) return false;
		if (!this.runBroadcast()) return;
		let parts = target.split(',');
		switch (toId(parts[0])) {
		case 'view':
			if (requests === {}) return this.errorReply('There are no requests!');
			let display = '<center><table width="100%" border="1" cellspacing="0"><tr><th>User</th><th>Item</th><th>Contact?</th><th>Done?</th><th>Delete?</th></tr>';
			for (let i in requests) {
				display += '<tr>';
				display += '<td>' + requests[i][0] + '</td><td>' + requests[i][1] + '</td><td><button name="send" value="/pm ' + requests[i][0] + ', Hey! I am here to talk to you about your purchase of a ' + requests[i][1] + '. What do you want ?">Contact!</button></td><td><button name="send" value="/requests done, ' + requests[i][2] + '">Done?</button></td><td><button name="send" value="/requests delete, ' + requests[i][2] + '">Done?</button></td></tr>';
				display += '</tr>';
			}
			display += '</table></center>';
			return this.sendReplyBox(display);
		case 'delete':
			if (parts.length < 2) return this.errorReply('Usage : /requests delete, request');
			if (!requests[parts[1].trim()]) return this.errorReply('This request does not exist.');
			Renegade.log(shopFile, user.name + ' deleted the request for ' + requests[parts[1].trim()][0] + '\'s ' + requests[parts[1].trim()][1] + '.');
			delete requests[parts[1].trim()];
			saveRequests();
			return this.sendReply('This request was deleted.');
		case 'done':
			if (parts.length < 2) return this.errorReply('Usage : /requests delete, request');
			if (!requests[parts[1].trim()]) return this.errorReply('This request does not exist.');
			Renegade.log(shopFile, user.name + ' has done the request for ' + requests[parts[1].trim()][0] + '\'s ' + requests[parts[1].trim()][1] + '.');
			delete requests[parts[1].trim()];
			saveRequests();
			return this.sendReply('This request was been marked as done.');
		default:
			return this.parse('/requests view');
		}
	},
};
