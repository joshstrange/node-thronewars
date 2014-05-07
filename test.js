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
	return myThroneWars.fetch(myThroneWars.endpoints.Report ,{
		townId: '51efdf004671a65833021e9b'
	});//myThroneWars.buildBuilding('castle', "51efeb144671a6583303a84a");

	//console.log(JSON.stringify(myThroneWars));
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
	//console.log(myThroneWars.getCosts('castle', 4));
	//console.log(myThroneWars.getBuildTimeInSeconds('castle', 4));

	//return myThroneWars.get('Bookmark');
	//return myThroneWars.getMapData(50, 50);
	//console.log('here');
}).then(function(resp){
	console.log("%j", resp);
	//console.log(resp);
	//console.log(resp);
	//console.log(JSON.stringify(myThroneWars.getMapArray()));
});
//myThroneWars.finishBuilding(name, townId);