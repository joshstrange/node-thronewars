var request = require('request');
var Q = require('q');
var querystring = require('querystring');
var _ = require('lodash');

function ThroneWars(userId) {
	var instance = this;
	instance.version = "1.3.1";
	instance.language = "en";
	instance.userId = userId;

	instance.rootURL = 'http://{server}.trackingflaregames.net';

	instance.tsid = null;
	instance.sessionId = null;

	instance.model = null;

	instance.user = null;
	instance.users = {};
	instance.userServers = null;
	instance.towns = {};
	instance.clanId = null;
	instance.clan = null;
	instance.clans = {};
	instance.bookmarks = [];

	instance.playerUsername = null;

	instance.map = {};
	instance.mapRange = null;

	var userData = require('./users/'+userId+'.js');
	instance.username = userData.username;
	instance.password = userData.password;
	instance.server = userData.server;

	instance.watchers = {

	};


	instance.endpoints = {
		Model: {
			url: 'http://{server}.trackingflaregames.net/lmodel/android/300/0/en/none/',
			data: {},
			method: 'GET'
		},
		Register: {
			url: 'http://fgauth.trackingflaregames.net/kingdoms/user/register',
			data: {
				appversion: instance.version,
				locale: instance.language
			},
			method: 'GET',
			callback: function (data) {
				//console.log('setting tsid');
				//console.log(data);
				instance.tsid = data.id;
				instance.userId = data.userId;
				instance.username = '-';
				if(!instance.password) {
					instance.password = instance.randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
				}
			},
			parseData: false
		},
		TSID: {
			url: 'http://fgauth.trackingflaregames.net/kingdoms/user/login/{userId}',
			data: {
				appversion: instance.version,
				locale: instance.language
			},
			method: 'GET',
			callback: function (data) {
				//console.log('setting tsid');
				//console.log(data);
				instance.tsid = data.id;
			},
			parseData: false
		},
		Login: {
			url: '/login/{username}/{password}',
			data: {
				clientVersion: instance.version,
				tsid: null,
				lang: instance.language,
				_reqId: null
			}
		},
		Clan: {
			url: '/clan/get/{clanId}',
			data: {
				_reqId: null
			}
		},
		Build: {
			url: '/build/{type}/{townId}',
			data: {
				_reqId: null
			}
		},
		Finish: {
			url: '/finish/{type}/{townId}',
			data: {
				_reqId: null
			}
		},
		Bookmark: {
			url: '/bookmark/get',
			data: {
				_reqId: null
			}
		},
		Map: {
			url: '/map/{x}/{y}'
		},
		ChangePlayerName: {
			url: '/user/rename',
			data: {
				username: '{newPlayerUsername}',
				townid: '{townId}',
				_reqId: null
			}
		},
		Report: {
			url: '/reports/{townId}',
			data: {
				time: (new Date()).getTime(),
				_reqId: null
			}
		},
		SendMail: {
			url: '/send/message/{townId}',
			data: {
				message: '{message}',
				time: 0,
				touser: '{recipient}',
				_reqId: null
			}
		},
		Town: {
			url: '/reports/{townId}',
			data: {				
				_reqId: null
			}
		},
		Travels: {
			url: '/travels/{townId}',
			data: {
				_reqId: null
			}
		}
	};
	//Attach base URL + session segment if needed
	for(endpoint in instance.endpoints) {
		if(instance.endpoints[endpoint].url.indexOf('http') == -1) {
			instance.endpoints[endpoint].url = instance.rootURL + (endpoint != 'Login' ? '/{sessionId}' : '') + instance.endpoints[endpoint].url;
		}
	}

	instance.getFunction = function(functionName) {
		var functionText = "";
		instance.model.functiontype.forEach(function(item){
			if(item.id == functionName) {
				functionText = item.description;
			}
		});
		functionText = functionText.split(';')[0].replace('xt', 'x').replace('log', 'Math.log')
		var pos = functionText.indexOf('^');
		if(pos != -1) {
			var start = functionText.substr(0,pos-1)+'Math.pow('+functionText.substr(pos-1,1)+',';
			if(functionText.substr(pos+1,1) == '(') {
				var pointer = pos+2;
				while(functionText.substr(pointer,1) != ')') {
					pointer++;
				}
				functionText = start + functionText.substr(pos+1,pointer-pos+1)+ ')'+functionText.substr(pointer);
			} else {
				functionText = start + functionText.substr(pos+1,1)+ ')'+functionText.substr(pos+2);
			}
		}
		return functionText;
	};

	instance.execFunction = function(functionName, variables) {
		var codeToRun = [];
		for(key in variables) {
			if(typeof variables[key] == 'number') {
				codeToRun.push('var '+key+' ='+variables[key]+';');
			}
		}
		codeToRun.push('var result = Math.ceil('+instance.getFunction(functionName)+');');
		eval(codeToRun.join(''));
		return result;
	};

	instance.get = function(type, id, idName) {
		if(!idName) {
			idName = 'id';
		}
		var searchPattern = {};
		searchPattern[idName] = id;
		return _.find(instance.model[type], searchPattern);
	};


	instance.getBuilding = function(buidlingName) {
		return instance.get('building', buidlingName);
	};

	/* building.cost format
	 [
		 {
			 A: 400,
			 funcType: "exponential",
			 resource: "iron",
			 B: 1.55
		 },
		 {
			 A: 250,
			 funcType: "exponential",
			 resource: "stone",
			 B: 1.55
		 },
		 {
			 A: 400,
			 funcType: "exponential",
			 resource: "wood",
			 B: 1.68
		 }
	 ],
	 */
	instance.getBuildingCosts = function(buildingName, level) {
		var building = instance.getBuilding(buildingName);
		var cost = {};
		building.costs.forEach(function(item) {
			cost[item.resource] = instance.execFunction(item.funcType, _.extend({ x: level}, item));
		});
		return cost;
	};

	//Upgraded Farm to 5 and can't upgrade past that till I bring castle to 6
	//Upgraded Farm to

	instance.getBuildingRequirements = function(buildingName, level) {
		var building = instance.getBuilding(buildingName);
		var requirements = {
			technology: [],
			building: []
		};
		if(!_.isUndefined(building.requiredTechnology)) {
			if(_.isObject(building.requiredTechnologyLevel)) {
				requirements.technology[building.requiredTechnology] = instance.execFunction(building.requiredTechnologyLevel.funcType, _.extend({ x: level}, building.requiredTechnologyLevel));
			} else {
				//Must just be the level we need
				requirements.technology[building.requiredTechnology] = building.requiredTechnologyLevel;
			}
		}
		/*{
			"id": "storage_building_unlock",
			"default": 0,
			"steps": [
			{
				"index": 1,
				"value": 1
			},
			{
				"index": 6,
				"value": 5
			},
			{
				"index": 8,
				"value": 7
			},
			{
				"index": 10,
				"value": 9
			}
		]
		},*/
		if(!_.isUndefined(building.requiredBuilding)) {
			if(_.isObject(building.requiredTechnologyLevel)) {
				requirements.technology[building.requiredTechnology] = instance.execFunction(building.requiredTechnologyLevel.funcType, _.extend({ x: level}, building.requiredTechnologyLevel));
			} else {
				//Must just be the level we need
				requirements.technology[building.requiredTechnology] = building.requiredTechnologyLevel;
			}
		}

	};

	instance.getBuildTimeInSeconds = function(buildingName, level) {
		var building = instance.getBuilding(buildingName);

		var seconds = instance.execFunction(building.buildTime.funcType, _.extend({ x: level}, building.buildTime));
		return seconds;
	};

	//This will probably not work if you us gems to build more than one thing at a time
	//I don't know what the build_queue will look in that case
	instance.isBuilding = function(townId) {
		return instance.get('towns', townId).build_queue.length == 1;
	};

	instance.canBuild = function(townId, buildingName) {
		if(instance.isBuilding(townId)) {
			return false;
		}
		var town = instance.towns[townId];
		var level = _.find(town.buildings, {building: buildingName}).level + 1;
		var costs = instance.getBuildingCosts(buildingName, level);
		var canAfford = true;
		for(resourceType in costs) {
			if(costs[resourceType] > town.resources[resourceType]) {
				canAfford = false
			}
		}
		var hasTech = true;


		return canAfford && hasTech;
	};

	instance.register = function() {
		return instance.fetch(instance.endpoints.Register).then(function(){
			return instance.fetch(instance.endpoints.Login);
		});
	};

	instance.changeUsername = function(newPlayerUsername) {
		return instance.fetch(instance.endpoints.ChangePlayerName, {}, {
			newPlayerUsername: newPlayerUsername
		})
	};

	instance.sendMail = function(toHandle, message) {
		return instance.fetch(instance.endpoints.SendMail, {
			townId: instance.user.maintown
		}, {
			message: message,
			recipient: toHandle
		});
	};

	instance.getBuildingSlot = function(name, townId) {
		var slot = false;
		instance.towns[townId].buildings.forEach(function(buildingObj){
			if(buildingObj.building == name) {
				slot = buildingObj.slot;
			}
		});
		return slot;
	};

	/*
	Map of building spots:

	 Iron(2) Wood(3) Castle(0) Open(11)
	Open(5)  Open(6)			Open(10) Open(12) Open(14)
	 	Stone(4)  Open(7) Open(8) Open(9) Open(13)
	 				Wall(1)

	Building name: machinename
	  	Archery Range: archeryrange
		Barracks: barracks
		Castle: castle
		City Guard: cityguard
		Iron Mine: ironmine
		Market: market
		Siege Workshop: siegeworkshop
		Stable: stable
		Stone Quarry: quarry
		Storage: storage
		Tool Smith: toolsmith
		Town Wall: townwall
	 	University: university
		Woodcutter: woodcutter

	 */

	instance.buildWeapon = function(weapon, townId, count) {
		return instance.build('weapon', weapon, townId, {
			count: count
		});
	};


	instance.buildBuilding = function(name, townId) {
		return instance.build('building', name, townId, {
			slot: instance.getBuildingSlot(name, townId)
		});
	};

	instance.buildTechnology = function(name, townId) {
		return instance.build('technology', name, townId, {});
	};

	instance.build = function(type, name, townId, data) {
		return instance.reusableEndpoint('Build', type, name, townId, data);
	};

	instance.finishBuilding = function(name, townId) {
		return instance.finish('building', name, townId);
	};

	instance.finishTechnology = function(name, townId) {
		return instance.finish('technology', name, townId);
	};

	instance.finish = function(type, name, townId) {
		return instance.reusableEndpoint('Finish', type, name, townId);
	};

	instance.reusableEndpoint = function(endpointName, type, name, townId, data) {
		if(!data) {
			data = {};
		}
		var endpointClone = _.cloneDeep(instance.endpoints[endpointName]);
		if(typeof instance.endpoints[endpointName][type+'Callback'] == 'function') {
			endpointClone.callback = instance.endpoints[endpointName][type+'Callback'];
		}
		endpointClone.data[type] = name;
		_.extend(endpointClone.data, data);
		endpointClone.url = instance.replaceTokens(endpointClone.url, {
			type: type,
			townId: townId,
			server: instance.server,
			sessionId: instance.sessionId
		});
		return instance.fetch(endpointClone);
	};

	instance.replaceTokens = function (objectOrString, data) {
		if(!data) {
			data = {};
		}
		//console.log('replacing tokens');
		if (typeof objectOrString == 'string') {
			objectOrString = objectOrString.replace(
				/\{([a-zA-Z]+)\}/g,
				function (_, index) {
					if(typeof data[index] != 'undefined') {
						return data[index];
					} else if(typeof instance[index] != 'undefined') {
						return instance[index];
					} else {
						return '{'+index+'}'
					}
				});
		} else if (typeof objectOrString == 'object')  {
			for (key in objectOrString) {
				if (key == 'tsid') {
					objectOrString.tsid = instance.tsid;
				} else if (key == '_reqId') {
					objectOrString._reqId = Math.floor(Math.random() * 100 + 1);
				} else {
					objectOrString[key] = instance.replaceTokens(objectOrString[key], data);
				}
			}
		}
		return objectOrString;
	};

	instance.getRealXAndY = function(x, y, region) {
		switch(region) {
			case 'NE':
				y= -y;
				break
			case 'SE':
				//Both Positive
				break
			case 'SW':
				x = -x;
				break
			case 'NW':
				y= -y;
				x = -x;
				break
		}
		return {x: x, y:y};
	};
	/*
		{ //Same as Empty
			x: 60,
			y: 51,
			id: '51efdd4b4671a65833000db0',
			name: 'Buffestra',
			handle: '2pc',
			user: {
				handle: '0',
				userid: 'default',
				username: '-',
				clantag: false
			},
			type: 'free',
			protectedUntil: 0,
			townLevel: 1
		},
		{ //Occupied
			x: 60,
			y: 56,
			id: '51efdd4b4671a65833000db4',
			name: 'Deomedum',
			handle: '2pg',
			user:{
				handle: 'svrl',
				userid: '5314b8571162d7ea610000f5',
				username: 'la mort',
				clantag: 'FR',
				clanid: '53296582ba70172c5f00031f'
			},
			type: 'user',
			protectedUntil: 1394126039,
			townLevel: 4
		}
	 */
	instance.getMapData = function(x, y, region) {
		//If we don't pass in region assume we are entering real coords
		if(region) {
			var newCords = instance.getRealXAndY(x, y, region);
			x = newCords.x;
			y = newCords.y;
		}
		return instance.fetch(instance.endpoints.Map, {
			x: x,
			y: y
		});
	};

	instance.updateMap = function(map) {
		//Update with all new points
		map.forEach(function(point){
			instance.updateMapPoint(point);
		});
		//Let's not do this anymore
		//instance.fillInEmptyMapPoints();
	};

	instance.updateMapPoint = function(point) {
		if(instance.mapRange == null) {
			instance.mapRange = {
				xMin: point.x,
				xMax: point.x,
				yMin: point.y,
				yMax: point.y
			};
		}

		//Update map range
		if(instance.mapRange.xMin > point.x) {
			instance.mapRange.xMin = point.x;
		}
		if(instance.mapRange.xMax < point.x) {
			instance.mapRange.xMax = point.x;
		}
		if(instance.mapRange.yMin > point.y) {
			instance.mapRange.yMin = point.y;
		}
		if(instance.mapRange.yMax < point.y) {
			instance.mapRange.yMax = point.y;
		}
		if(!_.isObject(instance.map[point.y])) {
			instance.map[point.y] = {};
		}
		instance.map[point.y][point.x] = point;
	};

	/*
		Take real x and y
	 */
	instance.pointInMapCache = function(x, y) {
		return (instance.mapRange.xMin < x) &&
			(instance.mapRange.xMax > x) &&
			(instance.mapRange.yMin < y) &&
			(instance.mapRange.yMax > y);
	};

	instance.fillInEmptyMapPoints = function() {
		for(var y=instance.mapRange.yMin; y<=instance.mapRange.yMax; y++) {
			for(var x=instance.mapRange.xMin; x<=instance.mapRange.xMax; x++) {
				if (!_.isObject(instance.map[y])) {
					instance.map[y] = {};
				}
				if (!_.isObject(instance.map[y][x])) {
					instance.map[y][x] = {
						x: x,
						y: y
					};
				}
			}
		}
	};

	instance.getMap = function(){
		return instance.map;
	};
	
	instance.getMapArray = function() {
		var map = [];
		var yKeys = _.keys(instance.map);
		var orderedYKeys = _.sortBy(yKeys);
		orderedYKeys.forEach(function(yKey){
			var row = [];
			var xKeys = _.keys(instance.map[yKey]);
			var orderedXKeys = _.sortBy(xKeys);
			orderedXKeys.forEach(function(xKey){
				row.push(instance.map[yKey][xKey])
			});
			map.push(row);
		});
		return map;
	};
	
	//--------------Clans-------------//
	instance.getClan = function(clanid){
		return instance.fetch(instance.endpoints.Clan, {
			clanId: clanid
		});
	};
	
	instance.getTown = function(townId){
		return instance.fetch(instance.endpoints.Town, {
			townId: townId
		});
	};
	
	instance.updateTown = function(townObj){
		instance.towns[townObj.id] = townObj;
	};



	instance.getReport = function(townId){
		return instance.fetch(instance.endpoints.Report, {
			townId: townId
		});
	};

	instance.parseData = function(data) {
		//Maybe we should return the data type we asked for here so that .then(function(dataYouWantedNotEverything
		//We would have to pass a second param to parseData so it know which to return at the end... Needs more thought
		try{
			data._ret.forEach(function(item){
				//console.log(item);
				switch(item._type) {
					case 'user':
						var userId =item.tsid.split('=')[1];
						if(userId == instance.userId) {
							if(instance.user == null) {
								instance.user = {};
							}
							_.extend(instance.user, item);
							instance.parseUser();
						}
						if(_.isUndefined(instance.users[item.username])) {
							instance.users[item.username] = {};
						}
						_.extend(instance.users[item.username], item);
						if(!_.isUndefined(instance.watchers.user)) {
							instance.users[item.username] = instance.watchers.user(instance.users[item.username]);
						}
						//If not then the user is from one of reports/town calls and we don't want
						//to knock out our real user
						break;
					case 'userServers':
						instance.userServers = item.userServers;
						break;
					case 'town':
						if(_.isUndefined(instance.towns[item.id])) {
							instance.towns[item.id] = {};
						}
						_.extend(instance.towns[item.id], item);
						if(!_.isUndefined(instance.watchers.town)) {
							instance.towns[item.id] = instance.watchers.town(instance.towns[item.id]);
						}
						break;
					case 'clan':
						if(instance.user.clanid == item.id) {
							instance.clan = item;
						}
						if((instance.clans[item.id] && item.memberList) || !instance.clans[item.id]) {
							instance.clans[item.id] = item;
							if(!_.isUndefined(instance.watchers.clan)) {
								instance.clans[item.id] = instance.watchers.clan(instance.clans[item.id]);
							}
						}
						break;
					case 'bookmark':
						instance.bookmarks = item.bookmarks;
						break;
					case 'model':
						instance.model = item.model;
						break;
					case 'map':
						if(instance.mapRange == null) {
							instance.mapRange = {
								xMin: item.x,
								xMax: item.x,
								yMin: item.y,
								yMax: item.y
							};
						}
						if(!_.isUndefined(instance.watchers.map)) {
							instance.watchers.map(item.map);
						}
						instance.updateMap(item.map);
						break;
					case 'othertown': //Might not need these now as Report > Town
						instance.updateTown(item);
						break;
					case 'otheruser':
						//stub
						break;
				}
			});
		}catch(Error){
			console.log("Error parsing data. ", Error);
			console.log(data);
		}
	};

	instance.parseUser = function() {
		instance.sessionId = instance.user.sessionId;
		instance.clanId = instance.user.clanid;
		instance.playerUsername = instance.user.username;
	};

	instance.fetch = function (endpoint, urlData, dataData) {
		var deferred = Q.defer();
		if(!urlData) {
			urlData = {};
		}
		if(!dataData) {
			dataData = {};
		}
		var data = instance.replaceTokens(endpoint.data, dataData);
		//console.log(data);
		var qs = '';
		if(!endpoint.method) {
			endpoint.method = 'POST'; //Most everything is POST anyways
		}

		if (endpoint.method == 'GET') {
			qs = '?' + querystring.stringify(data)
		}
		var options = {
			url: instance.replaceTokens(endpoint.url, urlData) + qs,
			method: endpoint.method
		};

		if (endpoint.method == 'POST') {
			options.json = data;
		}
		options.headers = {
			'Content-Type': 'application/json; charset=utf-8',
			'User-Agent': 'Dalvik/1.6.0 (Linux; U; Android 4.3)'
		};
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				if(typeof body == 'string') {
					body = JSON.parse(body);
				}
				if(typeof endpoint.parseData == 'undefined' || endpoint.parseData) {
					instance.parseData(body);
				}
				//Callback happens after parse incase you need updated info
				if(typeof endpoint.callback == 'function') {
					endpoint.callback(body);
				}
				deferred.resolve(body);
			} else {
				console.log(error);
				deferred.reject(new Error(error));
			}
		});
		return deferred.promise;
	};


	//I don't like this name but I'm not sure what else to call it
	//It may not even really be needed but I didn't want to delete it outright
	instance.safeFetch = function (endpoint) {
		return instance.login.then(function () {
			return instance.fetch(instance.endpoints[endpoint]);
		});
	};


	instance.randomString = function(length, chars) {
		var result = '';
		for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
		return result;
	};


	instance.login =  instance.fetch(instance.endpoints.TSID).then(function () {
		return instance.fetch(instance.endpoints.Login);
	}).then(function() {
		return instance.fetch(instance.endpoints.Model);
	});

	return instance;
}

module.exports = ThroneWars;
