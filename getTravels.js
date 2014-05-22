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


myThroneWars.login.then(function () {
	console.log("Session id: " + myThroneWars.sessionId);
	return myThroneWars.getTravels(townId);
}).then(function (data) {
	data._ret.forEach(function(response){
		if(response._type == 'travels') {
			console.log(JSON.stringify(response));
		}

	});
});