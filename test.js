var ThroneWars = require('./index.js');
var _ = require('lodash');
var fs = require('fs');
var stringify = require('csv-stringify');
stringifier = stringify();
var Q = require('q');
try {
	var stream = fs.createWriteStream("info.csv");
	stream.once('open', function (fd) {
		//Feel free to re-use these creds, they belong to one of my (many) android emulators that I don't care about
		var userId = '0b43fd0c-517a-4171-afbf-14f9b1d48653';
		var username = '15jfs';
		var password = 'ednjtdaiy7';
		var server = 'tw-us-vir-12';

		/*var userId = '922f68bf-35c2-4544-bf1a-7fc8867fcaff';
		 var username = '18wdf';
		 var password = '6tawaq4o26';
		 var server = 'tw-us-vir-10';*/

		var myThroneWars = new ThroneWars(userId, username, password, server);


		var joshsClanId = "5331d3142257a06b54007e6b";
		var russianClan = "531d790312dcd5316f0038ba";
		//var turksClanID = "52f4f599489d3c8102000191";


		stringifier.on('readable', function () {
			while (row = stringifier.read()) {
				stream.write(row);
			}
		});
		stringifier.on('error', function (err) {
			console.log(err.message);
		});
		stringifier.on('finish', function () {
			stream.end();
		});

		myThroneWars.login.then(function () {
			//console.log("Session id: " + myThroneWars.sessionId);
			var headers = ['User ID', 'Username', 'Level', 'Clan Role', 'Town Name', 'Region', 'X', 'Y', 'Militia', 'Infantry', 'Bowmen', 'Cavlery', 'Catapult', 'Cart'];
			stringifier.write(headers);

			return myThroneWars.getClan(russianClan);


		}).then(function () {
			var allPromises = [];
			myThroneWars.clan.memberList.forEach(function (user) {
				var userData = [user.userid, user.username, user.clanrole, user.level];
				var townsPromise = [];
				user.towns.forEach(function (town) {
					townsPromise.push(myThroneWars.getTown(town));
				});

				allPromises = allPromises.concat(townsPromise);
				Q.all(townsPromise).then(function () {
					user.towns.forEach(function (town) {
						var x = myThroneWars.towns[town].x;
						var y = myThroneWars.towns[town].y;

						var prefix = "SE";

						if (x < 0 && y < 0) {
							x = -x;
							y = -y;
							prefix = "NW";
						} else if (x < 0 && y >= 0) {
							x = -x;
							prefix = "SW";
						} else if (x >= 0 && y < 0) {
							y = -y;
							prefix = "NE";
						}


						/*listing.username.towns.push({
						 prefix: prefix,
						 x : x,
						 y : y,
						 name : name
						 });*/
						var weapons = myThroneWars.towns[town].weapons;

						if (_.isUndefined(weapons.militia)) {
							weapons.militia = 0;
						}
						if (_.isUndefined(weapons.cavlery)) {
							weapons.cavlery = 0;
						}
						if (_.isUndefined(weapons.bowmen)) {
							weapons.bowmen = 0;
						}
						if (_.isUndefined(weapons.catapult)) {
							weapons.catapult = 0;
						}
						if (_.isUndefined(weapons.cart)) {
							weapons.cart = 0;
						}
						var townData = [myThroneWars.towns[town].name, prefix, x, y, weapons.militia, weapons.infantry, weapons.bowmen, weapons.cavlery, weapons.catapult, weapons.cart];
						stringifier.write(userData.concat(townData));
					});

				});
			});
			Q.all(allPromises).then(function () {
				stringifier.end();
			});
		});
	});
} catch(ex) {
	console.log(ex);
}
