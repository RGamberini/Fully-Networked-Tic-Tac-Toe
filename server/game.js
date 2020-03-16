const Model = require("../shared/model");
class Game {
    constructor(clients) {
        this.clients = clients;
        this.model = new Model();
    }

    handle(update) {
        this.model.setMark(update[0], update[1]);
        for (let client of this.clients) {
            client.gameUpdate(update);
        }
    }
}
module.exports = Game;