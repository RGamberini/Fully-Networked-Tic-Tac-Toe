const WebSocket = require('ws');
const Client = require('./client');
const server = require('./server');
const wss = new WebSocket.Server({port: 8080});

wss.on('connection', function connection(ws, req) {
    let client = new Client(ws);
    server.addClient(client);
    console.log(`Client ${client.ID} connecting from: ${req.connection.remoteAddress}`);

    ws.binaryType = 'arraybuffer';
    ws.on('message', function incoming(message) {
        client.handlePacket(message);
    });

    ws.on('close', function(reasonCode, description) {
        console.log(`Lost connection ${client.ID} ${client.name ? client.name : ""} at ${req.connection.remoteAddress}`);
        client.emit(Client.events.disconnect);
    });
});