/*

*************************************************************
*                                                           *
*                      Renegade.js                          *
*                                                           *
*                      By Execute                           *
*                                                           *
* This file contains :                                      *
* - Majority of the functions Renegade Relies on            *
* - Majority of the Data management                         *
* - Assignment of Most functions to global Renegade Object  *
*                                                           *
*************************************************************

*/

'use strict';

/*eslint no-restricted-modules: [0]*/

const moment = require('moment');
const color = require('../config/color');
const http = require('http');
const shortid = require('shortid');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('config/Renegade.db', function () {
	db.run("CREATE TABLE IF NOT EXISTS users(userid TEXT, money INTEGER, title TEXT, profilecolor TEXT, textcolor TEXT, background TEXT, music TEXT, isDev NUMBER, seen INTEGER)");
});
const shop = new sqlite3.Database('config/shop.db', function () {
	shop.run("CREATE TABLE IF NOT EXISTS items(name TEXT, id TEXT, desc TEXT, price INTEGER)");
});

Renegade.customColors = {};

Object.assign(Renegade, {
	font:function (text, color, bold, italic) {
		return '<font color="' + (color ? color : 'black') + '">' + (bold ? '<b>' : '') + (italic ? '<i>' : '') + text + (italic ? '</i>' : '') + (bold ? '</b>' : '') + '</font>';
	},
	img:function (link, width, height) {
		return '<img src="' + link + '"' + (height ? ' height="' + height + '"' : '') + (width ? ' width="' + width + '"' : '') + '/>';
	},
	initUser:function (user) {
		db.all("SELECT * FROM users WHERE userid=$userid", {$userid:user}, function (err, rows) {
			if (err) return console.log(err);
			if (rows.length < 1) {
				db.run("INSERT INTO users(userid, money) VALUES ($userid, $money)", {$userid:user, $money:0}, function (err) {
					if (err) console.log(err);
				});
			}
		});
	},
	updateSeen:function (user) {
		db.run("UPDATE users SET seen=$date WHERE userid=$userid", {$userid:user, $date:Date.now()}, function (err) {
			if (err) return console.log(err);
		});
	},
	lastSeen:function (user, callback) {
		db.all("SELECT * FROM users WHERE userid=$userid", {$userid: user}, function (err, rows) {
			if (err) return console.log(err);
			if (callback) return callback(rows[0] ? Renegade.font(moment(rows[0].seen).fromNow(), 'black', true, false) : null);
		});
	},
	hashcolor:function (user) {
		if (Renegade.customColors[toId(user)]) return Renegade.customColors[toId(user)];
		return color(user);
	},
	addTitle:function (user, title) {
		db.run("UPDATE users SET title=$title WHERE userid=$userid", {$title:title, $userid:user}, function (err) {
			if (err) console.log(err);
		});
	},
	getTitle:function (user, callback) {
		db.all("SELECT * FROM users WHERE userid=$userid", {$userid:user}, function (err, rows) {
			if (err) console.log(err);
			if (callback) return callback(rows[0] ? rows[0].title : 'None');
		});
	},
	addBackground:function (user, background) {
		db.run("UPDATE users SET background=$background WHERE userid=$userid", {$background:background, $userid:user}, function (err) {
			if (err) console.log(err);
		});
	},
	getBackground:function (user, callback) {
		db.all("SELECT * FROM users WHERE userid=$userid", {$userid:user}, function (err, rows) {
			if (err) console.log(err);
			if (callback) return callback(rows[0] ? rows[0].background : 'None');
		});
	},
	addTextColor:function (user, textcolor) {
		db.run("UPDATE users SET textcolor=$textcolor WHERE userid=$userid", {$textcolor:textcolor, $userid:user}, function (err) {
			if (err) console.log(err);
		});
	},
	getTextColor:function (user, callback) {
		db.all("SELECT * FROM users WHERE userid=$userid", {$userid:user}, function (err, rows) {
			if (err) console.log(err);
			if (callback) return callback(rows[0] ? rows[0].textcolor : 'None');
		});
	},
	addProfileColor:function (user, profilecolor) {
		db.run("UPDATE users SET profilecolor=$profilecolor WHERE userid=$userid", {$profilecolor:profilecolor, $userid:user}, function (err) {
			if (err) console.log(err);
		});
	},
	getProfileColor:function (user, callback) {
		db.all("SELECT * FROM users WHERE userid=$userid", {$userid:user}, function (err, rows) {
			if (err) console.log(err);
			if (callback) return callback(rows[0] ? rows[0].profilecolor : 'None');
		});
	},
	addMusic:function (user, song) {
		db.run("UPDATE users SET music=$music WHERE userid=$userid", {$music:song, $userid:user}, function (err) {
			if (err) console.log(err);
		});
	},
	getMusic:function (user, callback) {
		db.all("SELECT * FROM users WHERE userid=$userid", {$userid:user}, function (err, rows) {
			if (err) console.log(err);
			if (callback) return callback(rows[0] ? rows[0].music : 'None');
		});
	},
	editDev:function (user, rank) {
		db.run("UPDATE users SET isDev=$rank WHERE userid=$userid", {$rank:rank, $userid:user}, function (err) {
			if (err) console.log(err);
		});
	},
	isDev:function (user, callback) {
		db.all("SELECT * FROM users WHERE userid=$userid", {$userid:user}, function (err, rows) {
			if (err) console.log(err);
			if (callback) return callback(rows[0] && rows[0].isDev === 1);
		});
	},
	getProfileData:function (user, callback) {
		let reply = {
			money : 0,
			lastSeen : 'Never',
			title : null,
			background : null,
			profilecolor : null,
			textcolor : null,
			isDev : false,
			music : null,
			regdate: '(Unregistered)',
		};
		db.all("SELECT * FROM users WHERE userid=$userid", {$userid:user}, function (err, rows) {
			if (err) console.log(err);
			Renegade.regdate(user, res => {
				if (!rows[0]) {
					if (!res) return callback(reply);
					reply.regdate = moment(res).format("MMMM DD, YYYY");
					return callback(reply);
				} else {
					if (res) rows[0].regdate = moment(res).format("MMMM DD, YYYY");
					if (!res) rows[0].regdate = '(Unregistered)';
					return callback(rows[0]);
				}
			});
		});
	},
	addMoney:function (user, amount) {
		db.run("UPDATE users SET money=money + $amount WHERE userid=$user", {$amount:amount, $user:user}, function (err) {
			if (err) console.log(err);
		});
	},
	getMoney:function (user, callback) {
		db.all("SELECT * FROM users WHERE userid=$userid", {$userid:user}, function (err, rows) {
			if (err) console.log(err);
			if (callback) return callback(rows[0] ? rows[0].money : 0);
		});
	},
	log:function (file, message) {
		if (!message) return false;
		fs.appendFile(file, '[' + new Date().toUTCString() + '] ' + message + '\n');
	},
	addShopItem:function (name, desc, price, callback) {
		let id = toId(name);
		shop.all("SELECT * FROM items WHERE id=$id", {$id: id}, function (err, rows) {
			if (err) console.log(err);
			if (rows.length < 1) {
				shop.run("INSERT INTO items(name, id, desc, price) VALUES ($name, $id, $desc, $price)", {$name:name, $id:id, $desc:desc, $price:price}, function (err) {
					if (err) console.log(err);
					if (callback) return callback('This item has been added to the shop.');
				});
			} else {
				if (callback) return callback('<font color="maroon">This item is already exists in the shop.</font>');
			}
		});
	},
	removeShopItem:function (id, callback) {
		id = toId(id);
		shop.all("SELECT * FROM items WHERE id=$id", {$id: id}, function (err, rows) {
			if (err) console.log(err);
			if (rows.length < 1) {
				if (callback) return callback('<font color="maroon">This item was not found in the shop.</font>');
			} else {
				shop.run("DELETE FROM items WHERE id=$id", {$id: id}, function (err) {
					if (err) console.log(err);
					if (callback) return callback('This item has been deleted from the shop.');
				});
			}
		});
	},
	allShopItems:function (callback) {
		shop.all("SELECT * FROM items ORDER BY PRICE ASC", {}, function (err, rows) {
			if (rows.length < 1) {
				if (callback) return callback('no items');
			} else {
				if (callback) return callback(rows);
			}
		});
	},
	getPrice:function (item, callback) {
		shop.all("SELECT * FROM items WHERE id=$id", {$id:item}, function (err, rows) {
			if (err) console.log(err);
			if (rows.length < 1) {
				if (callback) return callback(false);
			} else {
				if (callback && rows[0]) return callback(rows[0]);
			}
		});
	},
	clearShop:function (callback) {
		shop.run("DELETE FROM items", {}, function (err) {
			if (err) console.log(err);
			if (callback) return callback('Shop has been cleared.');
		});
	},
	richestUsers:function (target, callback) {
		db.all("SELECT * FROM users ORDER BY money DESC LIMIT $target", {$target: target}, function (err, rows) {
			if (err) console.log(err);
			if (callback) return callback(rows);
		});
	},
	regdate: function (target, callback) {
		target = toId(target);
		let options = {
			host: 'pokemonshowdown.com',
			port: 80,
			path: '/users/' + target + '.json',
			method: 'GET',
		};
		http.get(options, function (res) {
			let data = '';
			res.on('data', function (chunk) {
				data += chunk;
			}).on('end', function () {
				if (data.charAt(0) !== '{') data = JSON.stringify({registertime: 0});
				data = JSON.parse(data);
				let date = data['registertime'];
				if (date !== 0 && date.toString().length < 13) {
					while (date.toString().length < 13) {
						date = Number(date.toString() + '0');
					}
				}
				callback((date === 0 ? false : date));
			});
		});
	},
	
	//Ripped from SpacialGaze
	//Originally Ripped from Main's Client
	//Modified for use with SG Game
	getPokemonIcon: function (pokemon) {
		let base = pokemon;
		pokemon = Dex.getTemplate(pokemon);
		let resourcePrefix = "//play.pokemonshowdown.com/";
		let num = 0;
		if (base === 'pokeball') {
			return 'background:transparent url(' + resourcePrefix + 'sprites/smicons-pokeball-sheet.png) no-repeat scroll -0px 4px';
		} else if (base === 'pokeball-statused') {
			return 'background:transparent url(' + resourcePrefix + 'sprites/smicons-pokeball-sheet.png) no-repeat scroll -40px 4px';
		} else if (base === 'pokeball-none') {
			return 'background:transparent url(' + resourcePrefix + 'sprites/smicons-pokeball-sheet.png) no-repeat scroll -80px 4px';
		}
		let id = toId(base);
		//if (pokemon && pokemon.species) id = toId(pokemon.species);
		if (pokemon && pokemon.volatiles && pokemon.volatiles.formechange && !pokemon.volatiles.transform) id = toId(pokemon.volatiles.formechange[2]);
		if (pokemon && pokemon.num !== undefined) num = pokemon.num;
		if (num < 0) num = 0;
		if (num > 802) num = 0;
		let altNums = {
			egg: 804 + 1,
			pikachubelle: 804 + 2,
			pikachulibre: 804 + 3,
			pikachuphd: 804 + 4,
			pikachupopstar: 804 + 5,
			pikachurockstar: 804 + 6,
			pikachucosplay: 804 + 7,
			castformrainy: 804 + 35,
			castformsnowy: 804 + 36,
			castformsunny: 804 + 37,
			deoxysattack: 804 + 38,
			deoxysdefense: 804 + 39,
			deoxysspeed: 804 + 40,
			burmysandy: 804 + 41,
			burmytrash: 804 + 42,
			wormadamsandy: 804 + 43,
			wormadamtrash: 804 + 44,
			cherrimsunshine: 804 + 45,
			shelloseast: 804 + 46,
			gastrodoneast: 804 + 47,
			rotomfan: 804 + 48,
			rotomfrost: 804 + 49,
			rotomheat: 804 + 50,
			rotommow: 804 + 51,
			rotomwash: 804 + 52,
			giratinaorigin: 804 + 53,
			shayminsky: 804 + 54,
			unfezantf: 804 + 55,
			basculinbluestriped: 804 + 56,
			darmanitanzen: 804 + 57,
			deerlingautumn: 804 + 58,
			deerlingsummer: 804 + 59,
			deerlingwinter: 804 + 60,
			sawsbuckautumn: 804 + 61,
			sawsbucksummer: 804 + 62,
			sawsbuckwinter: 804 + 63,
			frillishf: 804 + 64,
			jellicentf: 804 + 65,
			tornadustherian: 804 + 66,
			thundurustherian: 804 + 67,
			landorustherian: 804 + 68,
			kyuremblack: 804 + 69,
			kyuremwhite: 804 + 70,
			keldeoresolute: 804 + 71,
			meloettapirouette: 804 + 72,
			vivillonarchipelago: 804 + 73,
			vivilloncontinental: 804 + 74,
			vivillonelegant: 804 + 75,
			vivillonfancy: 804 + 76,
			vivillongarden: 804 + 77,
			vivillonhighplains: 804 + 78,
			vivillonicysnow: 804 + 79,
			vivillonjungle: 804 + 80,
			vivillonmarine: 804 + 81,
			vivillonmodern: 804 + 82,
			vivillonmonsoon: 804 + 83,
			vivillonocean: 804 + 84,
			vivillonpokeball: 804 + 85,
			vivillonpolar: 804 + 86,
			vivillonriver: 804 + 87,
			vivillonsandstorm: 804 + 88,
			vivillonsavanna: 804 + 89,
			vivillonsun: 804 + 90,
			vivillontundra: 804 + 91,
			pyroarf: 804 + 92,
			flabebeblue: 804 + 93,
			flabebeorange: 804 + 94,
			flabebewhite: 804 + 95,
			flabebeyellow: 804 + 96,
			floetteblue: 804 + 97,
			floetteeternal: 804 + 98,
			floetteorange: 804 + 99,
			floettewhite: 804 + 100,
			floetteyellow: 804 + 101,
			florgesblue: 804 + 102,
			florgesorange: 804 + 103,
			florgeswhite: 804 + 104,
			florgesyellow: 804 + 105,
			meowsticf: 804 + 115,
			aegislashblade: 804 + 116,
			hoopaunbound: 804 + 118,
			rattataalola: 804 + 119,
			raticatealola: 804 + 120,
			raichualola: 804 + 121,
			sandshrewalola: 804 + 122,
			sandslashalola: 804 + 123,
			vulpixalola: 804 + 124,
			ninetalesalola: 804 + 125,
			diglettalola: 804 + 126,
			dugtrioalola: 804 + 127,
			meowthalola: 804 + 128,
			persianalola: 804 + 129,
			geodudealola: 804 + 130,
			graveleralola: 804 + 131,
			golemalola: 804 + 132,
			grimeralola: 804 + 133,
			mukalola: 804 + 134,
			exeggutoralola: 804 + 135,
			marowakalola: 804 + 136,
			greninjaash: 804 + 137,
			zygarde10: 804 + 138,
			zygardecomplete: 804 + 139,
			oricoriopompom: 804 + 140,
			oricoriopau: 804 + 141,
			oricoriosensu: 804 + 142,
			lycanrocmidnight: 804 + 143,
			Renegadeiwashischool: 804 + 144,
			miniormeteor: 804 + 145,
			miniororange: 804 + 146,
			minioryellow: 804 + 147,
			miniorgreen: 804 + 148,
			miniorblue: 804 + 149,
			miniorviolet: 804 + 150,
			miniorindigo: 804 + 151,
			magearnaoriginal: 804 + 152,
			pikachuoriginal: 804 + 153,
			pikachuhoenn: 804 + 154,
			pikachusinnoh: 804 + 155,
			pikachuunova: 804 + 156,
			pikachukalos: 804 + 157,
			pikachualola: 804 + 158,

			venusaurmega: 972 + 0,
			charizardmegax: 972 + 1,
			charizardmegay: 972 + 2,
			blastoisemega: 972 + 3,
			beedrillmega: 972 + 4,
			pidgeotmega: 972 + 5,
			alakazammega: 972 + 6,
			slowbromega: 972 + 7,
			gengarmega: 972 + 8,
			kangaskhanmega: 972 + 9,
			pinsirmega: 972 + 10,
			gyaradosmega: 972 + 11,
			aerodactylmega: 972 + 12,
			mewtwomegax: 972 + 13,
			mewtwomegay: 972 + 14,
			ampharosmega: 972 + 15,
			steelixmega: 972 + 16,
			scizormega: 972 + 17,
			heracrossmega: 972 + 18,
			houndoommega: 972 + 19,
			tyranitarmega: 972 + 20,
			sceptilemega: 972 + 21,
			blazikenmega: 972 + 22,
			swampertmega: 972 + 23,
			gardevoirmega: 972 + 24,
			sableyemega: 972 + 25,
			mawilemega: 972 + 26,
			aggronmega: 972 + 27,
			medichammega: 972 + 28,
			manectricmega: 972 + 29,
			sharpedomega: 972 + 30,
			cameruptmega: 972 + 31,
			altariamega: 972 + 32,
			banettemega: 972 + 33,
			absolmega: 972 + 34,
			glaliemega: 972 + 35,
			salamencemega: 972 + 36,
			metagrossmega: 972 + 37,
			latiasmega: 972 + 38,
			latiosmega: 972 + 39,
			kyogreprimal: 972 + 40,
			groudonprimal: 972 + 41,
			rayquazamega: 972 + 42,
			lopunnymega: 972 + 43,
			garchompmega: 972 + 44,
			lucariomega: 972 + 45,
			abomasnowmega: 972 + 46,
			gallademega: 972 + 47,
			audinomega: 972 + 48,
			dianciemega: 972 + 49,

			syclant: 1140 + 0,
			revenankh: 1140 + 1,
			pyroak: 1140 + 2,
			fidgit: 1140 + 3,
			stratagem: 1140 + 4,
			arghonaut: 1140 + 5,
			kitsunoh: 1140 + 6,
			cyclohm: 1140 + 7,
			colossoil: 1140 + 8,
			krilowatt: 1140 + 9,
			voodoom: 1140 + 10,
			tomohawk: 1140 + 11,
			necturna: 1140 + 12,
			mollux: 1140 + 13,
			aurumoth: 1140 + 14,
			malaconda: 1140 + 15,
			cawmodore: 1140 + 16,
			volkraken: 1140 + 17,
			plasmanta: 1140 + 18,
			naviathan: 1140 + 19,
			crucibelle: 1140 + 20,
			crucibellemega: 1140 + 21,
			kerfluffle: 1140 + 22,
		};

		if (altNums[id]) {
			num = altNums[id];
		}

		if (pokemon && pokemon.gender === 'F') {
			if (id === 'unfezant' || id === 'frillish' || id === 'jellicent' || id === 'meowstic' || id === 'pyroar') {
				num = altNums[id + 'f'];
			}
		}
		let top = Math.floor(num / 12) * 30;
		let left = (num % 12) * 40;
		let fainted = (pokemon && pokemon.fainted ? ';opacity:.4' : '');
		return 'background:transparent url(' + resourcePrefix + 'sprites/smicons-sheet.png?a1) no-repeat scroll -' + left + 'px -' + top + 'px' + fainted;
	},
});
