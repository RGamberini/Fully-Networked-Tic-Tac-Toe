const Room = require('./room');
const Client = require('./client');
module.exports = {
    clients: [],
    matchmaking: [],
    rooms: [],
    addClient: function(client) {
        client.on(Client.events.start_matchmaking, () => {
            this.matchmaking.push(client);
            this.updatePlayerLists();
        });

        client.on(Client.events.request_match, (opponentID) => {
            this.matchmaking = this.matchmaking.filter((currentClient) =>
                currentClient.ID !== client.ID && currentClient.ID !== opponentID);
            this.updatePlayerLists();

            let room = this.rooms[this.rooms.push(new Room([client.ID, opponentID]))];
            client.room = room;
            this.clients[opponentID].room = room;

            this.getClient(opponentID).matchRequest(client.ID);
        });

        client.on(Client.events.reject_match, () => {
            let room = client.room;
            room.clients.forEach((client) => {
                this.matchmaking.push(client);
                delete client.room;
            });
            this.updatePlayerLists();
            this.rooms = this.rooms.filter((currentRoom) => room !== currentRoom);
        });

        client.on(Client.events.disconnect, () => {
            console.log("Server disconnecting " + client.ID);
            this.clients = this.clients.filter(currentClient => currentClient.ID !== client.ID);
            this.matchmaking = this.matchmaking.filter(currentClient => currentClient.ID !== client.ID);
            this.updatePlayerLists();
        });

        client.on(Client.events.accept_match, () => {
        });
        return this.clients.push(client);
    },

    updatePlayerLists: function() {
        this.matchmaking.forEach((client) => client.updatePlayerList(this));
    },

    getClients: function() {
        return this.clients;
    },

    getClient: function(ID) {
        return this.clients[ID];
    },

};