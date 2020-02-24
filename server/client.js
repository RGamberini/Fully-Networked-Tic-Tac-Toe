const EventEmitter = require('events').EventEmitter;
const Packets = require('../shared/Packets');
class Client extends EventEmitter {
    static events = {
        start_matchmaking: "start_matchmaking",
        request_match: "request_match",
        reject_match: "reject_match",
        accept_match: "accept_match",
        disconnect: "disconnect"
    };

    static states = {
        failed: {
            handle: (connection, packet) => {}
        },

        client_hello: {
            handle: (connection, packet) => {
                if (packet.ID !== Packets.client_hello.ID) return Client.states.failed;
                connection.name = Packets.client_hello.decode(packet.payload);

                let payload = Packets.server_hello.encode(connection.ID);
                connection.send(Packets.server_hello.ID, payload);

                return Client.states.start_matchmaking;
            }
        },

        start_matchmaking: {
            handle: (connection, packet) => {
                if (packet.ID !== Packets.client_start_matchmaking.ID) return Client.states.failed;
                connection.emit(Client.events.start_matchmaking);

                return Client.states.waiting_for_match;
            }
        },

        waiting_for_match: {
            handle: (connection, packet) => {
                if (packet.ID !== Packets.client_player_select.ID) return Client.states.failed;
                let opponentID = Packets.client_player_select.decode(packet);
                connection.emit(Client.events.request_match, opponentID);

                return Client.states.waiting_for_response;
            }
        },

        waiting_for_confirm: {
            handle: (connection, packet) => {
                if (packet.ID !== Packets.client_match_response) return Client.states.failed;
                let response = Packets.client_match_response.decode(packet);

                if (response === 0) {
                    connection.emit(Client.events.reject_match);
                    return Client.states.waiting_for_match;
                }
                else if(response === 1) {
                    connection.emit(Client.events.accept_match);
                    return Client.states.game;
                }
                else return Client.states.failed;
            }
        },

        waiting_for_response: {
            handle: (connection, packet) => {
                return Client.states.failed;
            }
        },

        game: {
            handle: (connection, packet) => {

            }
        }
    };

    constructor(socket) {
        super();
        this.socket = socket;
        this.currentState = Client.states.client_hello;
    }

    handlePacket(message) {
        let packet = Packets.decodePacket(message);
        console.log(`Received: ${Packets.packets[packet.ID].name} from client ${this.ID} ${this.name ? this.name : ""}`);
        this.currentState = this.currentState.handle(this, packet);
        if (this.currentState === Client.states.failed) this.close();
        // else console.log("Received: " + Packets.packets[packet.ID].name + " from " + this.name);
    }

    updatePlayerList(server) {
        let payload = Packets.server_player_list.encode(server.matchmaking);
        this.send(Packets.server_player_list.ID, payload);
    }

    matchRequest(opponentID) {
        let payload = Packets.server_match_request.encode(opponentID);
        this.currentState = Client.states.waiting_for_confirm;
        this.send(Packets.server_match_request.ID, payload);
    }

    close() {
        console.log("SUPPOSED TO BE CLOSING: " + this.ID);
    }

    send(header, payload) {
        console.log(`Sending: ${Packets.packets[header].name} to client ${this.ID} ${this.name} with ${JSON.stringify(Packets.packets[header].decode(payload))}`);
        this.socket.send(Packets.encodePacket(header, payload));
    }
}
module.exports = Client;