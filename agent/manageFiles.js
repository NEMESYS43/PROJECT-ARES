//version 1.4.3
var socket = require('socket.io-client')('http://http://192.241.141.94/:4343');
var spawn = require('child_process').spawn;
var fork = require('child_process').fork;
const { exec } = require('child_process');
var ncp = require('ncp').ncp;
console.log("manageFiles")
socket.emit('updateStat','Finishing Up')
ncp('update/latestAgent', '../agent', function (err) {
    if (err) {
      return console.error(err);
    }
    console.log('done!');
    socket.emit('updateStat','Update Completed Succesfully')
    var child = fork('./agent.js')
   });