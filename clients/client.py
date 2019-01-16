import websocket

SOCKET_IO_HOST = "localhost"
SOCKET_IO_PORT = 4343

socket_io_url = 'ws://' + SOCKET_IO_HOST + ':' + str(SOCKET_IO_PORT) + '/socket.io/websocket'

ws = websocket.create_connection(socket_io_url)