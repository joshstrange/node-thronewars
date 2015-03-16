###NOTE: This is no longer supported, I haven't played TW in months I'm OS-ing this repo because I need more private GH repo's and this isn't sensitive info. Feel free to do what you want with this code, most of the holes have been patched. This project started as a way to create a better map browsing interface for TW but once we found out all holes in TW's backend I started to try to re-create TW in HTML using this with another repo that contained the frontend code.

# node-thronewars
## A library to interact with the Throne Wars servers


### Install

*Not currently in the npm registry!*

````
npm install thronewars
````


### Example

````js
var ThroneWars = require('thronewars');

var myThroneWars = ThroneWars('userId');
// You also need to put a file in /users/{userId}.js with your username/password/server

````

### Methods

