var net = require('net');
var port = 1337;
var host = '127.0.0.1'

//
// Client
//

function openSocket() {
    var socket = net.connect(port, host);
    socket.setKeepAlive(true);
    socket.on('connect', onConnect.bind({}, socket));
    socket.on('error', onError.bind({}, socket));
}

var interval;
function onConnect(socket) {

    console.log('Socket is open!');


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