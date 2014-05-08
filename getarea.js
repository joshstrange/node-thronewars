var ThroneWars = require('./index.js');
var _ = require('lodash');
var fs = require('fs');

//Feel free to re-use these creds, they belong to one of my (many) android emulators that I don't care about
/*var userId = '0b43fd0c-517a-4171-afbf-14f9b1d48653';
var username = '15jfs';
var password = 'ednjtdaiy7';
var server = 'tw-us-vir-12';*/

var userId = '922f68bf-35c2-4544-bf1a-7fc8867fcaff';
var username = '18wdf';
var password = '6tawaq4o26';
var server = 'tw-us-vir-10';

var myThroneWars = new ThroneWars(userId, username, password, server);


myThroneWars.login.then(function(){	
	
	fs.unlink('map.csv', function(){
		fs.appendFile('map.csv', "Cardinal,X,Y,Username,Clan Tag,ClanID,UserID\n");
	});
	
	myThroneWars.getMapData(73, 64, "NW").then(function(){
		console.log(myThroneWars.mapRange);

	
	 
		var map = myThroneWars.getMapArray();
		for(var i = 0; i < map.length; i++){
			for(var j = 0; j < map[i].length; j++){
				if(map[i][j].user && map[i][j].user.username && map[i][j].user.clantag){
					var x = map[i][j].x;
					var y = map[i][j].y;

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
					
					console.log(prefix + "," + y + "," + x + "," + map[i][j].user.username + "," + map[i][j].user.clantag + "," + map[i][j].user.clanid + "," + map[i][j].user.userid);
					fs.appendFile('map.csv', prefix + "," + y + "," + x + "," + map[i][j].user.username + "," + map[i][j].user.clantag + "," + map[i][j].user.clanid + "," + map[i][j].user.userid + "\n");
				}
			}
		}
	});

	/*console.log("Session id: " + myThroneWars.sessionId);
	var listing = {};

	fs.appendFile('info.csv', "Cardinal,X,Y,City Name,Player Name,Clan Rank,Level,Militia,Infantry,Archers,Cavalry,Catapults,Carts,PlayerID,CityID\n");

	myThroneWars.getClan(joshsClanId).then(function(){
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

					var weapons = myThroneWars.towns[town].weapons;

					if(weapons.militia == undefined) weapons.militia = 0;
					if(weapons.cavlery == undefined) weapons.cavlery = 0;
					if(weapons.catapult == undefined) weapons.catapult = 0;
					if(weapons.cart == 0) weapons.cart = 0;

					console.log(prefix + "," + y + "," + x + "," + myThroneWars.towns[town].name + "," + username + "," + clanrole + "," + level + "," + weapons.militia + "," + weapons.infantry + "," + weapons.bowmen + "," + weapons.cavlery + "," + weapons.catapult + "," + weapons.cart);
					fs.appendFile('info.csv', prefix + "," + y + "," + x + "," + myThroneWars.towns[town].name + "," + username + "," + clanrole + "," + level + "," + weapons.militia + "," + weapons.infantry + "," + weapons.bowmen + "," + weapons.cavlery + "," + weapons.catapult + "," + weapons.cart + "," + user.userid + "," + town + "\n");
				});
			});
		});
	});*/
});