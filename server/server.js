const Room = require('./room');
const Client = require('./client');
function shuffle(arr) {
    let currentIndex = arr.length;
    let temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = arr[currentIndex];
        arr[currentIndex] = arr[randomIndex];
        arr[randomIndex] = temporaryValue;
    }

    return arr;
}

module.exports = {
    clients: [],
    matchmaking: [],
    rooms: [],
    possibleIDs: shuffle([...Array(255).keys()]),

    addClient: function(client) {
        this.clients.push(client);
        client.ID = this.possibleIDs.shift();

        client.on(Client.events.start_matchmaking, () => {
            this.matchmaking.push(client);
            this.updatePlayerLists();
        });

        client.on(Client.events.request_match, (opponentID) => {
            this.matchmaking = this.matchmaking.filter((currentClient) =>
                currentClient.ID !== client.ID && currentClient.ID !== opponentID);
            this.updatePlayerLists();

            let opponent = this.getClient(opponentID);
            let room = this.rooms[this.rooms.push(new Room([client, opponent])) - 1];
            client.room = room;
            opponent.room = room;

            opponent.matchRequest(client.ID);
        });

        client.on(Client.events.reject_match, () => {
            let room = client.room;
            room.clients.forEach((currentClient) => {
                if (currentClient && currentClient !== client) {
                    currentClient.rejectMatch();
                    delete currentClient.room;
                }
            });

            this.rooms = this.rooms.filter((currentRoom) => room !== currentRoom);
        });

        client.on(Client.events.accept_match, () => {
            let room = client.room;
            room.clients.forEach(client => {
                client.acceptMatch();
            })
        });

        client.on(Client.events.disconnect, () => {
            console.log("Server disconnecting " + client.ID);
            if (client.room) {
                client.emit(Client.events.reject_match);
            }
            this.clients = this.clients.filter(currentClient => currentClient.ID !== client.ID);
            this.matchmaking = this.matchmaking.filter(currentClient => currentClient.ID !== client.ID);
            this.possibleIDs.push(client.ID);
            this.updatePlayerLists();
        });
    },

    updatePlayerLists: function() {
        this.matchmaking.forEach((client) => client.updatePlayerList(this));
    },

    getClient: function(ID) {
        return this.clients.find(client => client.ID === ID);
    },
};