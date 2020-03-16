const Game = require('./game');
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
    games: [],
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
            let game = this.games[this.games.push(new Game([client, opponent])) - 1];
            client.game = game;
            opponent.game = game;

            opponent.matchRequest(client.ID);
        });

        client.on(Client.events.reject_match, () => {
            let game = client.game;
            game.clients.forEach((currentClient) => {
                if (currentClient && currentClient !== client) {
                    currentClient.rejectMatch();
                    delete currentClient.game;
                }
            });

            this.games = this.games.filter((currentRoom) => game !== currentRoom);
        });

        client.on(Client.events.accept_match, () => {
            let game = client.game;
            game.clients.forEach(_client => {
                if (client !== _client) _client.acceptMatch();
            })
        });

        client.on(Client.events.disconnect, () => {
            console.log(`Server disconnecting Client ${client.ID} ${client.name ? ` '${client.name}'` : ''}`);
            if (client.currentState === Client.states.waiting_for_match || client.currentState === Client.states.waiting_for_response) {
                client.emit(Client.events.reject_match);
            }
            this.clients = this.clients.filter(currentClient => currentClient.ID !== client.ID);
            this.matchmaking = this.matchmaking.filter(currentClient => currentClient.ID !== client.ID);
            this.possibleIDs.push(client.ID);
            this.updatePlayerLists();
        });

        client.on(Client.events.game_update, update => {
            client.game.handle(update);
        });
    },

    updatePlayerLists: function() {
        this.matchmaking.forEach((client) => client.updatePlayerList(this));
    },

    getClient: function(ID) {
        return this.clients.find(client => client.ID === ID);
    },
};