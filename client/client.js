const EventEmitter = require('events').EventEmitter;
class Model extends EventEmitter {
    static events = {
        boardUpdate: "boardUpdate"
    };
    constructor () {
        super();
        this.board = [...Array(3)].map(x=>Array(3).fill(0));
        this.wins = [...Array(3)].map(x=>Array(3).fill(0));
        this.PLAYERS = {
            PLAYER1: 1,
            PLAYER2: -1
        };
        this.currentPlayer = this.PLAYERS.PLAYER1;
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

class View {
    constructor(model) {
        this.model = model;
        model.on(Model.events.boardUpdate, (x, y, player) => this.update(x, y, player));
        this.boardView = [];
        this.MARKS = {
            0: 'X',
            1: '',
            2: 'O'
        };
        let tbody = document.querySelector("tbody");
        for (let x = 0; x < tbody.children.length; x++) {
            this.boardView.push(tbody.children[x].children);
            for (let y = 0; y < tbody.children.length; y++) {
                this.boardView[x][y].textContent = this.MARKS[model.getSpace(x, y)];
            }
        }
    } 

    update(x, y, player) {
        this.boardView[x][y].textContent = this.MARKS[player];
    }
}

class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        let tbody = document.querySelector("tbody");
        this.playerTypes = {
            'Local': {

            }
        };
        for (let x = 0; x < tbody.children.length; x++) {
            let currentRow = tbody.children[x].children;
            for (let y = 0; y < tbody.children.length; y++) {
                currentRow[y].onclick = (event) => {
                    this.setMark(x, y);
                    currentRow[y].classList.add("non-clickable");
                    currentRow[y].onclick = function(event){};
                };
            }
        }
    }

    setMark(x, y) {
        model.setMark(x, y);
    }
}

class State extends EventEmitter {
    static events = {
        exit:"exit"
    };

    constructor() {
        super();
    }
    enter() {}
    exit() {}
}


class StateMachine {
    static states = {
        MainMenu: class extends State{
            constructor() {
                super();
                this.go = document.querySelector("#play");
                this.start = document.querySelector("#start");
                this.bot = document.querySelector("#bot");

                this.go.addEventListener('click', () => this.emit(State.events.exit, StateMachine.states.SelectOpponent));
                this.bot.addEventListener('click', () => showModal());
            }

            enter() {
            }

            exit() {
                this.start.classList.toggle('left');
            }
        },

        SelectOpponent: class extends State {
            constructor() {
                super();
                this.screen = document.querySelector("#selectOpponent");
                this.button = this.screen.querySelector("button");
                this.button.addEventListener('click', () => this.emit(State.events.exit, StateMachine.states.Game));
            }

            enter() {
                this.screen.classList.toggle('gone');
                this.screen.classList.toggle('right');
            }

            exit() {
                this.screen.classList.toggle('left')
            }
        },
        Game: class extends State {
            constructor() {
                super();
                this.game = document.querySelector("#tableContainer")
            }

            enter() {
                this.game.classList.toggle('gone');
                this.game.classList.toggle('right');
            }

            exit() {

            }
        }
    };
    constructor(InitialState) {
        this.enter(InitialState);
    }

    enter(State) {
        this.currentState = new State();
        this.currentState.on(State.events.exit, State => this.changeState(State));
        this.currentState.enter();
    }

    changeState(NewState) {
        this.currentState.exit();
        this.enter(NewState);
    }
}

function showModal() {
    let container = document.querySelector(".cardWrapper");
    let modal = document.querySelector(".card");

    container.classList.toggle("gone");
    modal.classList.toggle("top");
}

let model = new Model();
let view = new View(model);
let controller = new Controller(model, view);
let stateMachine = new StateMachine(StateMachine.states.MainMenu);