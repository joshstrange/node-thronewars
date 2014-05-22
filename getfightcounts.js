//51efde7f4671a6583301aaeb
var ThroneWars = require('./index.js');
var _ = require('lodash');
var fs = require('fs');
var stringify = require('csv-stringify');
stringifier = stringify();
var Q = require('q');
var argv = require('yargs').argv;

if(argv._.length != 1) {
	console.error("You must provide a Town ID!");
	console.error("Example: node gettravels.js {townId}");
	process.exit(1);
}

var townId = argv._[0];
//Server 12
var userId = '0b43fd0c-517a-4171-afbf-14f9b1d48653';

//Server 10
//var userId = '922f68bf-35c2-4544-bf1a-7fc8867fcaff';

var myThroneWars = new ThroneWars(userId);

var fightCounts = {
	support: {

	},
	attack: {

	}
};
var townsToLookForTroopCounts = [];
var townLookups = [];

var travelsToProcess = {};

var travels = [];

function addSupport(data) {
	console.log(JSON.stringify(data.weapons));

	_.forEach(data.weapons, function(weaponCount, weaponName) {
		console.log(weaponCount, weaponName);
		if(_.isUndefined(fightCounts.support[weaponName])) {
			fightCounts.support[weaponName] = 0;
		}
		fightCounts.support[weaponName] = fightCounts.support[weaponName] + weaponCount;
	});
}

function addAttack(data) {
	_.forEach(data.weapons, function(weaponCount, weaponName) {
		if(_.isUndefined(fightCounts.attack[weaponName])) {
			fightCounts.attack[weaponName] = 0;
		}
		fightCounts.attack[weaponName] = fightCounts.attack[weaponName] + weaponCount;
	});
}

myThroneWars.login.then(function () {
	console.log("Session id: " + myThroneWars.sessionId);
	return myThroneWars.getTravels(townId);
}).then(function (data) {
	data._ret.forEach(function(response){
		if(response._type == 'travels') {
			console.log('setting travels');
			travels = response.travels;
			//console.log(JSON.stringify(response));
		}
	});
	travels.forEach(function(travelData){
		if(travelData.type == 'support') {
			console.log('adding support');
			addSupport(travelData);
		} else if(travelData.type == 'attack') {
			//We need to lookup on this town
			townsToLookForTroopCounts.push(travelData.source.townid);
			townLookups.push(myThroneWars.getTravels(travelData.source.townid));
		}
	});
	Q.all(townLookups).then(function(townLookupsData){
		townLookupsData.forEach(function(townLookupData){
			townLookupData._ret.forEach(function(wsResponse){
				if(wsResponse._type == 'travels') {
					wsResponse.travels.forEach(function(travelData){
						travelsToProcess[travelData.source.townid] = travelData;
					});
				}
			});
		});

		townsToLookForTroopCounts.forEach(function(townId) {
			addAttack(travelsToProcess[townId]);
		});
		console.log(JSON.stringify(fightCounts));
	});

});