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

var towns = [];

myThroneWars.login.then(function(){	

	if(argv._.length == 1) {
		target = argv._[0];
	}else if(argv._.length == 3){
		//we got coordinates, find the town		
		/*x = argv._[0];
		y = argv._[1];
		ordinal = argv._[2];
		
		myThroneWars.getMapData(y, x, ordinal).then(function(){
		});*/
	}


	console.log("Getting listing of towns...");
	myThroneWars.getReport(target).then(function(data){
		console.log("Got towns.");
		
		console.log("Loading towns...");
		var loadPromises = [];
		_.forEach(data._ret[0].towns, function(town){
			console.log("Loading town    " + town + "...");		
			
			towns[town] = [];
			
			var reportPromise = myThroneWars.getReport(town);
			
			loadPromises.push(reportPromise);
			
			reportPromise.then(function(data){
				console.log("Loaded town    " + town + ".");
				towns[town] = data._ret[1];
			});
		});
		
		Q.all(loadPromises).then(function(){
			console.log("All towns loaded.");
			console.log("");			
			console.log("");
			
			_.forEach(data._ret[0].towns, function(town){
				var coords = myThroneWars.getFakeXAndY(towns[town].x, towns[town].y);
				var weapons = myThroneWars.fixWeapons(towns[town].weapons);
				var resources = {
					iron: towns[town].resources.iron,
					stone: towns[town].resources.stone,
					wood: towns[town].resources.wood,
					sum: towns[town].resources.iron + towns[town].resources.stone + towns[town].resources.wood
				};
								
				console.log(coords.ordinal + "" + coords.x + "," + coords.y + ": " + towns[town].name);
				console.log("\tFood: " + towns[town].upkeep + "/" + towns[town].foodSlots + " Ratio: " + (towns[town].upkeep/towns[town].foodSlots).toFixed(4));
				console.log("\tResources: Total: " + resources.sum + ", Wood: " + resources.wood + ", Stone: " + resources.stone + ", Iron: " + resources.iron);
				console.log("\tArmy: Infantry: " + weapons.infantry + ", Archers: " + weapons.bowmen + ", Catapults: " + weapons.catapult + ", Cavlery: " + weapons.cavlery);
			});
			
			console.log("Loading activities...");
			myThroneWars.getTravels(target).then(function(travels){
				console.log("Loaded activities.");
				
				//now the fun part, the travels
				if(travels._ret[4].travels.length == 0){
					console.log("\tNo activity.");
				}
				for(var i = 0; i < travels._ret[4].travels.length;i++){
					var travel = travels._ret[4].travels[i];
					var weapons = [];
					if(travel.weapons){
						weapons = myThroneWars.fixWeapons(travel.weapons);					
					}
					
					var sourceCoords = myThroneWars.getFakeXAndY(travel.source.x, travel.source.y);
					var destCoords = myThroneWars.getFakeXAndY(travel.dest.x, travel.dest.y);
				
					switch(travel.type){
						case 'support':
							console.log("\t" + ((travel.state == "stationed")? "Supporting" : "Sending Support"));
							console.log("\t\tState: " + travel.state);
							console.log("\t\tSource: " + sourceCoords.ordinal + "" + sourceCoords.x + "," + sourceCoords.y + " " + travel.source.townname);
							console.log("\t\tDestination: " + destCoords.ordinal + "" + destCoords.x + "," + destCoords.y + " " + travel.dest.townname);
							console.log("\t\tArmy: Infantry: " + weapons.infantry + ", Archers: " + weapons.bowmen + ", Catapults: " + weapons.catapult + ", Cavlery: " + weapons.cavlery);
							break;
						case 'attack':
							console.log("\tAttacking");
							console.log("\t\tState: " + travel.state);
							console.log("\t\tSource: " + sourceCoords.ordinal + "" + sourceCoords.x + "," + sourceCoords.y + " " + travel.source.townname);
							console.log("\t\tDestination: " + destCoords.ordinal + "" + destCoords.x + "," + destCoords.y + " " + travel.dest.townname);
							console.log("\t\tArmy: Infantry: " + weapons.infantry + ", Archers: " + weapons.bowmen + ", Catapults: " + weapons.catapult + ", Cavlery: " + weapons.cavlery);
							break;
						case 'spy':
							console.log("\tSpying");						
							console.log("\t\tState: " + travel.state);
							console.log("\t\tSource: " + sourceCoords.ordinal + "" + sourceCoords.x + "," + sourceCoords.y + " " + travel.source.townname);
							console.log("\t\tDestination: " + destCoords.ordinal + "" + destCoords.x + "," + destCoords.y + " " + travel.dest.townname);
							break;
						case 'gift':
							console.log("\tSending");						
							console.log("\t\tState: " + travel.state);
							console.log("\t\tSource: " + sourceCoords.ordinal + "" + sourceCoords.x + "," + sourceCoords.y + " " + travel.source.townname);
							console.log("\t\tDestination: " + destCoords.ordinal + "" + destCoords.x + "," + destCoords.y + " " + travel.dest.townname);
							console.log("\t\tArmy: Infantry: " + weapons.infantry + ", Archers: " + weapons.bowmen + ", Catapults: " + weapons.catapult + ", Cavlery: " + weapons.cavlery);
							break;
						default:
							console.log("\tUnknown activity.");
							console.log(travel);
					}
				}
			});
		});
	});
});
