var ThroneWars = require('./index.js');
var _ = require('lodash');
var Q = require('q');
var argv = require('yargs').argv;

if(argv._.length != 3) {
	console.error("Example: node leachresouces.js {userId} {yourTownId} {targetTownId}");
	console.error("Leaches in the order of stone, wood, iron");
	console.error("userId only needs to exist on the server you are leaching from");
	process.exit(1);
}

var userId = argv._[0];
var yourTownId = argv._[1];
var targetTownId = argv._[2];

var myThroneWars = new ThroneWars(userId);

myThroneWars.login.then(function () {
	console.log("Session id: " + myThroneWars.sessionId);
	//console.log(myThroneWars.model);

	return Q.all([myThroneWars.getReport(yourTownId), myThroneWars.getReport(targetTownId)]);
}).then(function () {
	var yourTown = myThroneWars.towns[yourTownId];
	var targetTown = myThroneWars.towns[targetTownId];
	var level = 0;
	//console.log(myThroneWars.usersById);
	if(myThroneWars.usersById[targetTown.userid].technologies.wheelbarow) {
		level = myThroneWars.usersById[targetTown.userid].technologies.wheelbarow;
	}
	var cartCapacity = myThroneWars.execFunction('linear', {A: 100, B:0, x: level}) + 500;
	console.log("Cart Capacity: "+ cartCapacity);
	console.log("Resources:");
	console.log("--Stone: "+targetTown.resources.stone);
	console.log("--Wood: "+targetTown.resources.wood);
	console.log("--Iron: "+targetTown.resources.iron);

	console.log("Carts: "+targetTown.weapons.cart);

	var cartCount = targetTown.weapons.cart;

	var resourcesToSend = {
		stone: 0,
		wood: 0,
		iron: 0
	};

	while(cartCount > 0) {
		if(targetTown.resources.stone - resourcesToSend.stone > cartCapacity) {
			resourcesToSend.stone = resourcesToSend.stone + cartCapacity;
		} else if(targetTown.resources.wood - resourcesToSend.wood > cartCapacity) {
			resourcesToSend.wood = resourcesToSend.wood + cartCapacity;
		} else if(targetTown.resources.iron - resourcesToSend.iron > cartCapacity) {
			resourcesToSend.iron = resourcesToSend.iron + cartCapacity;
		}
		cartCount--;
	}
	console.log("");
	console.log("Sending: ");
	console.log("--Stone: "+resourcesToSend.stone);
	console.log("--Wood: "+resourcesToSend.wood);
	console.log("--Iron: "+resourcesToSend.iron);
	//process.exit(1);

	return myThroneWars.sendResources(targetTown.id, yourTown.id, resourcesToSend, cartCapacity);
	//process.exit(1);
}).then(function(data){
	console.log("Resources Sent");
	//console.log(JSON.stringify(data));
}).catch(function(error){
	console.log("Error:");
	console.log(error);
});


