var ThroneWars = require('./index.js');
var _ = require('lodash');
var Q = require('q');
var argv = require('yargs').argv;
/*
if(argv._.length != 3) {
	console.error("You must provide a Weapon name, town id, and number of weapons to build!");
	console.error("Example: node buildweapon.js {weaponName} {townId} {numberOfWeapons}");
	process.exit(1);
}*/

var myThroneWars = new ThroneWars('0b43fd0c-517a-4171-afbf-14f9b1d48653');

myThroneWars.login.then(function(){
	return myThroneWars.buildWeapon('infantry', '51efdecd4671a6583301f24f' /* Trenta */, 1);
}).then(function(resp){
	console.log(resp);
}).catch(function(err) {
	console.log(err);
});