var ThroneWars = require('./index.js');
var _ = require('lodash');
var fs = require('fs');
var argv = require('yargs').argv;
var Q = require('q');

//Feel free to re-use these creds, they belong to one of my (many) android emulators that I don't care about
//Server 12
//var userId = '0b43fd0c-517a-4171-afbf-14f9b1d48653';


//Server 10
var userId = '922f68bf-35c2-4544-bf1a-7fc8867fcaff';


var myThroneWars = new ThroneWars(userId);

//figure out who we're finding
var target = "52f91d456f25977053008885";

if(argv._.length == 1) {
	target = argv._[0];
}


var towns = [];

myThroneWars.login.then(function(){	
	console.log("Getting listing of towns...");
	myThroneWars.getReport(target).then(function(data){
		console.log("Got towns.");
		
		console.log("Loading towns...");
		var loadPromises = [];
		_.forEach(data._ret[0].towns, function(town){
			console.log("Loading town    " + town + "...");
			console.log("Loading travels " + town + "...");			
			
			towns[town] = [];
			
			var reportPromise = myThroneWars.getReport(town);
			var travelPromise = myThroneWars.getTravels(town);
			
			loadPromises.push(reportPromise);
			loadPromises.push(travelPromise);
			
			reportPromise.then(function(data){
				console.log("Loaded town    " + town + ".");
				towns[town].report = data._ret[1];
			});
			travelPromise.then(function(data){
				console.log("Loaded travels " + town + ".");
				towns[town].travels = data._ret[4];
			});
		});
		
		Q.all(loadPromises).then(function(){
			console.log("All towns and travels loaded.");
			console.log("");			
			console.log("");
			
			_.forEach(data._ret[0].towns, function(town){
				var coords = myThroneWars.getFakeXAndY(towns[town].report.x, towns[town].report.y);
				var weapons = myThroneWars.fixWeapons(towns[town].report.weapons);
				var resources = {
					iron: towns[town].report.resources.iron,
					stone: towns[town].report.resources.stone,
					wood: towns[town].report.resources.wood,
					sum: towns[town].report.resources.iron + towns[town].report.resources.stone + towns[town].report.resources.wood
				};
								
				console.log(coords.ordinal + "" + coords.x + "," + coords.y + ": " + towns[town].report.name);
				console.log("\tFood: " + towns[town].report.upkeep + "/" + towns[town].report.foodSlots + " Ratio: " + (towns[town].report.upkeep/towns[town].report.foodSlots).toFixed(4));
				console.log("\tResources: Total: " + resources.sum + ", Wood: " + resources.wood + ", Stone: " + resources.stone + ", Iron: " + resources.iron);
				console.log("\tArmy: Infantry: " + weapons.infantry + ", Archers: " + weapons.bowmen + ", Catapults: " + weapons.catapult + ", Cavlery: " + weapons.cavlery);
				
				//now the fun part, the travels
				if(towns[town].travels.travels.length == 0){
					console.log("\tNo activity.");
				}
				console.log(towns[town].travels);
			});
		});
	});
});
