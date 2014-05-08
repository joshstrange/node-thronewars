var ThroneWars = require('./index.js');
var _ = require('lodash');
var fs = require('fs');

//Feel free to re-use these creds, they belong to one of my (many) android emulators that I don't care about
//Server 12
//var userId = '0b43fd0c-517a-4171-afbf-14f9b1d48653';

//Server 10
var userId = '922f68bf-35c2-4544-bf1a-7fc8867fcaff';

var myThroneWars = new ThroneWars(userId);



//var joshsClanId = "5331d3142257a06b54007e6b";
myThroneWars.login.then(function(){
	console.log(myThroneWars.sessionId);
});
