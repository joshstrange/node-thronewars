var ThroneWars = require('./index.js');


//Feel free to re-use these creds, they belong to one of my (many) android emulators that I don't care about
var userId = '0b43fd0c-517a-4171-afbf-14f9b1d48653';
var username = '15jfs';
var password = 'ednjtdaiy7';
var server = 'tw-us-vir-12';

var myThroneWars = new ThroneWars(userId, username, password, server);

/*myThroneWars.loadAll().spread(function(clan){
	console.log(clan);
});*/


myThroneWars.login.then(function(){
	//return myThroneWars.get('Bookmark');
	return myThroneWars.getMapData(50, 50);
	//console.log('here');
}).then(function(resp){
	console.log(resp);
	console.log(JSON.stringify(myThroneWars.getMapArray()));
});
//myThroneWars.finishBuilding(name, townId);