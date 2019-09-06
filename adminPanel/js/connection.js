var socket = io.connect("http://104.237.111.55:4343/");
socket.on("connection", function(socket) {
  console.log("ESTABLISHED CONNECTION WITH MASTER SERVER WITH SOCKET ID " + socket);
});
