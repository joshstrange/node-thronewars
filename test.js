var ThroneWars = require('./index.js');
var _ = require('lodash');
var fs = require('fs');


//Feel free to re-use these creds, they belong to one of my (many) android emulators that I don't care about
var userId = '922f68bf-35c2-4544-bf1a-7fc8867fcaff';
var username = '18wdf';
var password = '6tawaq4o26';
var server = 'tw-us-vir-10';

var myThroneWars = new ThroneWars(userId, username, password, server);



var turksClanID = "52f4f599489d3c8102000191";

/*myThroneWars.loadAll().spread(function(clan){
	console.log(clan);
});*/


myThroneWars.login.then(function(){
	/*console.log(myThroneWars.getFunction('exponential_flat'));
	console.log(myThroneWars.execFunction('exponential_flat', {
		A: 300,
		C: -319,
		B: 1.51,
		T: 14,
		A2: 1.8,
		B2: 0.93,
		C2: -0.64,
		x: 4
	}));*/
	/*myThroneWars.getMapData(17, 16, "SE").then(function(){
		console.log(myThroneWars.mapRange);
		
		var map = myThroneWars.getMapArray();
		for(var x = 0; x < map.length; x++){
			for(var y = 0; y < map[x].length; y++){
				if(map[x][y].user && map[x][y].user.username && map[x][y].user.clantag){
					console.log("SW " + map[x][y].y + ":" + map[x][y].x + " " + map[x][y].user.username + " [" + map[x][y].user.clantag + "], " + map[x][y].user.clanid);
				}
			}
		}
	});*/
	var listing = {};
	
	myThroneWars.getClan(turksClanID).then(function(){
		myThroneWars.clan.memberList.forEach(function(user){
			var username = user.username;
			var clanrole = user.clanrole;
			var level = user.level;
			
			listing[username] = {
				username: username,
				role: clanrole,
				level: level,
				towns: []
			}
			
			user.towns.forEach(function(town){				
				myThroneWars.getTown(town).then(function(){
					var x = myThroneWars.towns[town].x;
					var y = myThroneWars.towns[town].y;
					
					var prefix = "SE";
					
					if(x < 0 && y < 0){
						x = -x;
						y = -y;
						prefix = "NW";
					}else if(x < 0 && y >= 0){
						x = -x;
						prefix = "SW";
					}else if(x >= 0 && y < 0){
						y = -y;
						prefix = "NE";
					}
					
					/*listing.username.towns.push({
						prefix: prefix,
						x : x,
						y : y,
						name : name
					});*/
					
					console.log(prefix + ":" + y + "," + x + " (" + myThroneWars.towns[town].name + ")\t\t" + username + "," + clanrole + "," + level);
					fs.appendFile('messages.txt', prefix + ":" + y + "," + x + " (" + myThroneWars.towns[town].name + ")\t\t" + username + "," + clanrole + "," + level);
				});
			});
		});		
	});
	
	/*setTimeout(function(){
		var listingKeys = _.keys(listing);
		listingKeys.forEach(function(key){
			var member = listing[key];
			console.log(member.username + "," + member.role + "," + member.level);
			for(var i = 0; i < member.towns.length; i++){
				console.log("\t" + member.towns[i].prefix + ":" + member.towns[i].y + ","  + member.towns[i].x + "," + member.towns[i].name);
			}
		});
	}, 1000);*/
	
	
	
	/*myThroneWars.getTown("51efdd484671a6583300070b").then(function(){
		console.log(myThroneWars.towns);
	});*/

	//return myThroneWars.get('Bookmark');
	//return myThroneWars.getMapData(50, 50);
	//console.log('here');
});/*.then(function(resp){
	//console.log(resp);
	//console.log(JSON.stringify(myThroneWars.getMapArray()));
});*/
//myThroneWars.finishBuilding(name, townId);