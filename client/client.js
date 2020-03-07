const EventEmitter = require('events').EventEmitter;
const Model = require('./js/model');
const View = require('./js/view');
const Controller = require('./js/controller');
const Packets = require("../shared/Packets");

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
        MainMenu: Object.assign({
            go: document.querySelector("#play"),
            start: document.querySelector("#start"),
            bot: document.querySelector("#bot"),

            enter: function () {
                this.go.addEventListener('click', () => this.emit(State.events.exit, StateMachine.states.SelectOpponent));
                // this.bot.addEventListener('click', () => showModal());
            },

            exit() {
                this.start.classList.toggle('left');
            }
        }, new EventEmitter()),

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