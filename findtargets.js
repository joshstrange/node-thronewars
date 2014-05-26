var ThroneWars = require('./index.js');
var _ = require('lodash');
var Q = require('q');
var argv = require('yargs').argv;
var fs = require('fs');
var stringify = require('csv-stringify');
stringifier = stringify();
var moment = require('moment');

if(argv._.length != 4) {
	console.error("You must provide a Clan ID!");
	console.error("Example: node findtargets.js {x} {y} {region} {searchArea}");
	console.error("{searchArea} is how many 20x20 blocks surrounding your location to search, start with 1");
	process.exit(1);
}



var getRegion = function(x, y) {
	if(x >= 0 && y >= 0) {
		return "SE";
	} else if(x >= 0 && y < 0) {
		return "NE";
	} else if(x < 0 && y >= 0) {
		return "SW";
	} else if(x < 0 && y < 0) {
		return "NW";
	} else {
		return "There was an error finding the region";
	}
};

try {
	var filename = "./build/target-"+argv._[0]+'-'+argv._[1]+'_'+argv._[2]+'_'+argv._[3]+".csv";
	var stream = fs.createWriteStream(filename);
	stream.once('open', function () {


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
			console.log("File saved to: "+filename);
		});
		//Feel free to re-use these creds, they belong to one of my (many) android emulators that I don't care about

		//Server 12
		var userId = '0b43fd0c-517a-4171-afbf-14f9b1d48653';

		//Server 10
		//var userId = '922f68bf-35c2-4544-bf1a-7fc8867fcaff';

		var myThroneWars = new ThroneWars(userId);
		var users = {};

		//1, 8, 16, 24

		//       4444444
		//       4333334
		//       4322234
		//       4321234
		//       4322234
		//       4333334
		//       4444444


		myThroneWars.login.then(function () {
			console.log("Session id: " + myThroneWars.sessionId);
			//yes we are flipping x and y here
			var x = argv._[1];
			var y = argv._[0];
			var region = argv._[2];
			var searchArea = argv._[3];

			console.log(x, y, region, searchArea);
			var realXAndY = myThroneWars.getRealXAndY(x, y, region);
			console.log(realXAndY);

			var bounds = {
				xMin: realXAndY.x - (20 * searchArea),
				xMax: realXAndY.x + (20 * searchArea),
				yMin: realXAndY.y - (20 * searchArea),
				yMax: realXAndY.y + (20 * searchArea)
			};

			console.log(bounds);

			var headers = [
				'Username',
				'Clan ID',
				'Location',
				'Infantry',
				'Bowmen',
				'Cavlery',
				'Catapult',
				'Cart',
				'Iron',
				'Stone',
				'Wood',
				'Last Login',
				'Last Login Timestamp'
			];
			stringifier.write(headers);
			//process.exit(1);
			var mapPromises = [];

			for (var x = bounds.xMin; x < bounds.xMax; x = x + 20) {
				for (var y = bounds.yMin; y < bounds.yMax; y = y + 20) {
					console.log("Fetching: " + x + "," + y);
					mapPromises.push(myThroneWars.getMapData(x, y));
				}
			}
			return Q.all(mapPromises);
		}).then(function () {
			console.log("All map fetched");

			var map = myThroneWars.getMapArray();

			var getTownPromises = [];
			for (var i = 0; i < map.length; i++) {
				for (var j = 0; j < map[i].length; j++) {
					if (map[i][j].type == 'user') {
						users[map[i][j].user.userid] = map[i][j].user;
						getTownPromises.push(myThroneWars.getTown(map[i][j].id));
					}
				}
			}
			return Q.all(getTownPromises);
		}).then(function () {
			for (townId in myThroneWars.towns) {
				var town = myThroneWars.towns[townId];
				var clanId = '';
				if (users[town.userid] && users[town.userid].clanid) {
					clanId = users[town.userid].clanid;
				}

				if (town.userid != '5325a0a392fc56a6540018a1' && clanId != '53235c59905efafa0700451f' && clanId != '531c242da185af26330086cb') {
					var data = [
						'', //Username
						'', //Clan
						'', //Location
						'0', //Infantry
						'0', //Bowmen
						'0', //Cavlery
						'0', //Catapult
						'0', //Cart
						'0', //Iron
						'0', //Stone
						'0', //Wood
						'', //Last Login
						'' //Last Login Timestamp
					];
					if (!users[town.userid]) {
						users[town.userid] = {
							username: "NONE?"
						};
					}


					data[0] = users[town.userid].username;
					//console.log("User: " + users[town.userid].username);
					if (clanId != '') {
						data[1] = users[town.userid].clantag + "(" + users[town.userid].clanid + ")";
						//console.log("Clan: " + users[town.userid].clantag + "(" + users[town.userid].clanid + ")");
					}
					data[2] = getRegion(town.x, town.y) + " " + Math.abs(town.y) + ", " + Math.abs(town.x);
					//console.log("Location: " + getRegion(town.x, town.y) + " " + Math.abs(town.y) + ", " + Math.abs(town.x));
					//console.log("Weapons:");
					if(town.weapons.infantry) {
						data[3] = town.weapons.infantry;
					}
					if(town.weapons.bowmen) {
						data[4] = town.weapons.bowmen;
					}
					if(town.weapons.cavalry) {
						data[5] = town.weapons.cavalry;
					}
					if(town.weapons.catapult) {
						data[6] = town.weapons.catapult;
					}
					if(town.weapons.cart) {
						data[7] = town.weapons.cart;
					}

					/*for (weaponType in town.weapons) {
						var weaponCount = town.weapons[weaponType];
						if (weaponCount > 0) {
							console.log("--" + weaponType + ": " + weaponCount);
						}
					}*/
					/*console.log("Resources:");
					for (resource in town.resources) {
						var resourceCount = town.resources[resource];
						if (resourceCount > 0) {
							console.log("--" + resource + ": " + resourceCount);
						}
					}*/
					if(town.resources.iron) {
						data[8] = town.resources.iron;
					}
					if(town.resources.stone) {
						data[9] = town.resources.stone;
					}
					if(town.resources.wood) {
						data[10] = town.resources.wood;
					}

					if(myThroneWars.users[users[town.userid].username]) {
						data[11] = moment.unix(myThroneWars.users[users[town.userid].username].lastLogin).fromNow();
						data[12] = myThroneWars.users[users[town.userid].username].lastLogin;
					}
					stringifier.write(data);
					//console.log("");
					//console.log("");
				}
			}
			stringifier.end();
		}).catch(function (error) {
			console.log("Error:");
			console.log(error);
		});
	});
} catch(ex) {
	console.log(ex);
}
