var request = require('request');
var Q = require('q');
var querystring = require('querystring');
var _ = require('lodash');

function ThroneWars(userId, username, password, server) {
	var instance = this;
	instance.version = "1.3.0";
	instance.language = "en";
	instance.userId = userId;
	instance.username = username;
	instance.password = password;
	instance.server = server;
	instance.rootURL = 'http://{server}.trackingflaregames.net';

	instance.tsid = null;
	instance.sessionId = null;

	instance.model = null;

	instance.user = null;
	instance.userServers = null;
	instance.towns = {};
	instance.clanId = null;
	instance.clan = null;
	instance.bookmarks = [];

	instance.playerUsername = null;

	instance.map = {};
	instance.mapRange = null;

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
			},
			callback: function(data) {
				instance.parseData(data);
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
			},
			callback: function(data) {
				instance.bookmarks = data._ret[0].bookmarks;
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
		SendMail: {
			url: '/send/message/{townId}',
			data: {
				message: '{message}',
				time: 0,
				touser: '{recipient}',
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
	instance.buildBuilding = function(name, townId) {
		return instance.build('building', name, townId, {
			slot: instance.getBuildingSlot(name, townId)
		})
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
		instance.fillInEmptyMapPoints();
	};

	instance.updateMapPoint = function(point) {
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

	instance.parseData = function(data) {
		//Looks like 0..x-2 is town info
		//x-1 is user info
		//x is user server info
		//They all contain a _type variable that is one of the following:
		//town/user/userServers
		data._ret.forEach(function(item){
			switch(item._type) {
				case 'user':
					instance.user = item;
					instance.parseUser();
					break;
				case 'userServers':
					instance.userServers = item;
					break;
				case 'town':
					instance.towns[item.id] = item;
					break;
				case 'clan':
					instance.clan = item;
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
					instance.updateMap(item.map);
					break;
			}
		});
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


	instance.loadAll = function() {
		return Q.all([
			instance.get('Clan'),
			instance.get('Model')
		]);
	};


	instance.get = function (endpoint) {
		return instance.login.then(function () {
			return instance.fetch(instance.endpoints[endpoint]);
		});
	};


	instance.randomString = function(length, chars) {
		var result = '';
		for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
		return result;
	};

	instance.login = function () {
		return instance.fetch(instance.endpoints.TSID).then(function () {
			return instance.fetch(instance.endpoints.Login);
		});
	}();

	return instance;
}

module.exports = ThroneWars;