const EventEmitter = require('events').EventEmitter;
class Model extends EventEmitter {
    static events = {
        boardUpdate: "boardUpdate"
    };

    static players = {
        player1: 1,
        player2: -1
    };

    constructor (predefinedState) {
        super();
        this.board = [...Array(3)].map(x=>Array(3).fill(0));
        this.wins = [...Array(3)].map(x=>Array(3).fill(0));
        this.currentPlayer = Model.players.player1;
    }

    setMark(x, y) {
        this.board[x][y] = this.currentPlayer;
        this.wins[0][x] += this.currentPlayer;
        this.wins[1][y] += this.currentPlayer;
        let sum = x + y;
        if (sum % 2 === 0) {
            this.wins[2][Number(x === y)] += this.currentPlayer;
            if (x === 1) this.wins[2][0] += this.currentPlayer;
        }
        this.currentPlayer *= -1;
        this.emit(Model.events.boardUpdate, x, y, this.currentPlayer + 1);
        this.checkForWin();
    }

    getSpace(x, y) {
        return this.board[x][y] + 1;
    }

    checkForWin() {
        for (let i = 0; i < this.wins.length; i++) {
            for (let j = 0; j < this.wins[i].length; j++) {
                if (Math.abs(this.wins[i][j]) === 3) {
                    console.log("BIG W");
                }
            }
        }
    }
}
module.exports = Model;