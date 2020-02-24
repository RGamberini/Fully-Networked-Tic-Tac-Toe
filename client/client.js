const Packets = require('../shared/Packets');

let chatbox = document.querySelector("#chatbox");
let connection = new WebSocket("ws://localhost:8080");
connection.binaryType = 'arraybuffer';

Window.Packets = Packets;
Window.connection = connection;
Window._name = document.querySelector("h1");
function log(toLog) {
    console.log(toLog);
    chatbox.innerHTML += toLog + "<br>";
}

connection.onmessage = (message) => {
    let packet = Packets.decodePacket(message.data);
    Window.payload = packet.payload;

    log("RECEIVED PACKET: " + Packets.packets[packet.ID].name);
    log(packet.payload);
    
    let fullDecode = Packets.packets[packet.ID].decode(packet.payload);
    log("DECODED:");
    log(JSON.stringify(fullDecode));
};

Window.start_matchmaking = () => {
    let start_matchmaking = Window.Packets.encodePacket(Window.Packets.client_start_matchmaking.ID, Window.Packets.client_start_matchmaking.encode());
    Window.connection.send(start_matchmaking);
};

Window.client_hello = () => {
    let name = "RUDE BOT" + Math.floor(Math.random() * 100);
    Window._name.textContent = name;
    let client_hello = Window.Packets.encodePacket(Window.Packets.client_hello.ID, Window.Packets.client_hello.encode(name));
    Window.connection.send(client_hello);
};

