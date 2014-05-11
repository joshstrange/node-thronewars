var ThroneWars = require('./index.js');
var argv = require('yargs').argv;
var _ = require('lodash');

if(argv._.length != 3) {
	console.error("You must provide an X, Y, and Region!");
	console.error("Example: node getclanidfromlocation.js {x} {y} {region}");
	process.exit(1);
}
try {
	var x = argv._[0];
	var y = argv._[1];
	var region = argv._[2];


	//Server 12
	var userId = '0b43fd0c-517a-4171-afbf-14f9b1d48653';

	//Server 10
	//var userId = '922f68bf-35c2-4544-bf1a-7fc8867fcaff';


	var myThroneWars = ThroneWars(userId);

	myThroneWars.login.then(function () {
		console.log("Session id: " + myThroneWars.sessionId);
		return myThroneWars.getMapData(x, y, region);
	}).then(function(data){
		var realCords = myThroneWars.getRealXAndY(y, x, region);
		var found = false;
		data._ret[0].map.forEach(function(location) {
			if(location.x == realCords.x && location.y == realCords.y) {
				found = true;
				if(_.isUndefined(location.user.clanid)) {
					console.log('User is not in a clan!');
				} else {
					console.log('Clan Id: '+location.user.clanid);
				}
			}
		});
		if(!found) {
			console.log('User is not in that location!');
		}
		//console.log(JSON.stringify(data));
	});
} catch(ex) {
	console.log("Error:");
	console.log(ex);
}
