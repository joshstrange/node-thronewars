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


myThroneWars.login.then(function(){	
	
	/*fs.unlink('./build/map.csv', function(){
		fs.appendFile('./build/map.csv', "Cardinal,X,Y,Username,Clan Tag,ClanID,UserID,Town,TownID\n");
	});*/
	
	var x = 57;
	var y = 30;
	var ordinal = "SE";	
	
	if(argv._.length == 3) {
		x = argv._[0];
		y = argv._[1];
		ordinal = argv._[2];
	}
	
	myThroneWars.getMapData(y, x, ordinal).then(function(){
		console.log(myThroneWars.mapRange);
		console.log("Width: " + (myThroneWars.mapRange.xMax - myThroneWars.mapRange.xMin) + " Height: " + (myThroneWars.mapRange.yMax - myThroneWars.mapRange.yMin));

	
	 
		var map = myThroneWars.getMapArray();
		var getTownPromises = [];
		for(var i = 0; i < map.length; i++){
			for(var j = 0; j < map[i].length; j++){
				if(map[i][j].user && map[i][j].user.username && map[i][j].user.clantag){
					var town = map[i][j].id;
					
					getTownPromises.push(myThroneWars.getTown(town));
				}
			}
		}
		Q.all(getTownPromises).then(function() {
			var canidates = [];
			_.forEach(myThroneWars.towns, function(town){
				var sum = town.resources.iron + town.resources.stone + town.resources.wood;
				
				if(sum > 1000000){
					var x = town.x;
					var y = town.y;

					var coords = myThroneWars.getFakeXAndY(x,y);
					
					var weapons = town.weapons;
					if(weapons.militia == undefined) weapons.militia = 0;
					if(weapons.infantry == undefined) weapons.infantry = 0;
					if(weapons.bowmen == undefined) weapons.bowmen = 0;
					if(weapons.cavlery == undefined) weapons.cavlery = 0;
					if(weapons.catapult == undefined) weapons.catapult = 0;
					if(weapons.cart == 0) weapons.cart = 0;
					
					canidates.push({
						ordinal: coords.ordinal,
						x: coords.x,
						y: coords.y,
						userid: town.userid,
						sum: sum,
						weapons: weapons
					});
				}
			});
			
			function compare(a,b) {
			  if (a.sum < b.sum)
				 return -1;
			  if (a.sum > b.sum)
				return 1;
			  return 0;
			}

			canidates.sort(compare);
			canidates.reverse();
			
			_.forEach(canidates, function(canidate){
				var weapons = canidate.weapons;
				console.log(canidate.ordinal + "," + canidate.x + "," + canidate.y + "," + canidate.userid + "," + canidate.sum + "," + weapons.militia + "," + weapons.infantry + "," + weapons.bowmen + "," + weapons.catapult + "," + weapons.cavlery);
			});
		});
		
	});
});
