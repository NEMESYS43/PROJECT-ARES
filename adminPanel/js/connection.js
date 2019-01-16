var socket = io.connect("http://localhost:4343");
socket.on("connection", function(socket) {
  console.log("ESTABLISHED CONNECTION WITH MASTER SERVER WITH SOCKET ID " + socket);
});
