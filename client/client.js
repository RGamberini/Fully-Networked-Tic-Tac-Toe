const EventEmitter = require('events').EventEmitter;
const Model = require('./js/model');
const View = require('./js/view');
const Controller = require('./js/controller');
const Packets = require("../shared/Packets");

class State {
    static events = {
        exit:"exit",
        send_packet:"send_packet",
        set_id: "set_id",
        show_modal: "show_modal",
        hide_modal: "hide_modal"
    };

    constructor() {
    }

    handlePacket (packet) {}


    changeState(state, params) {
        Client.states.emit(State.events.exit, state, params);
    }

    emit(event) {
        Client.states.emit(event, ...[...arguments].slice(1));
    }

    enter() {}
    exit(nextState) {}
}


class Client {
    static states = new class extends EventEmitter {
        Failed = new class extends State {
            enter() {
                console.error("BAD THINGS HAVE HAPPENED");
            }
        };

        MainMenu = new class extends State {

            constructor() {
                super();
                this.go = document.querySelector("#play");
                this.start = document.querySelector("#start");
                this.name = document.querySelector("#name");
                this.bot = document.querySelector("#bot");

                this.go.addEventListener('click', () => this.play());
            }

            play() {
                let payload = Packets.client_hello.encode(this.name.value);
                this.emit(State.events.send_packet, Packets.client_hello.ID, payload);
            }

            handlePacket(packet) {
                if (packet.ID !== Packets.server_hello.ID) this.changeState(Client.states.Failed);
                else {
                    this.emit(State.events.set_id, Packets.server_hello.decode(packet.payload));
                    this.changeState(Client.states.SelectOpponent);
                }
            }

            enter() {
                // this.bot.addEventListener('click', () => showModal());
            }

            exit() {
                this.start.classList.toggle('left');
            }
        };

        SelectOpponent = new class extends State {
            players = [];
            constructor() {
                super();
                this.screen = document.querySelector("#selectOpponent");
                this.buttons = this.screen.querySelector("#buttons");
                this.noPlayers = this.screen.querySelector("h2");
            }

            enter() {
                this.screen.classList.remove('gone');
                this.screen.classList.remove('right');

                this.emit(State.events.send_packet, Packets.client_start_matchmaking.ID, Packets.client_start_matchmaking.encode());
            }

            exit(nextState) {
                if (nextState === Client.states.Game) this.screen.classList.toggle('left');
            }

            handlePacket(packet) {
                switch (packet.ID) {
                    case Packets.server_player_list.ID:
                        let oldPlayers = this.players;
                        this.players = Packets.server_player_list.decode(packet.payload);
                        console.log(`Received player-list ${packet.payload}, length: ${this.players.length}`);

                        if (this.players.length === 0) this.noPlayers.classList.remove("nodisplay");
                        else this.noPlayers.classList.add("nodisplay");

                        let additions = this.players.filter(player => oldPlayers.findIndex(_player => player.id === _player.id && player.name === _player.name) === -1);
                        let removals = oldPlayers.filter(player => this.players.findIndex(_player => player.id === _player.id && player.name === _player.name) === -1);

                        console.log(`Removing: ${JSON.stringify(removals)}`);
                        removals.forEach(player => this.removePlayer(player.ID, player.name));

                        console.log(`Adding: ${JSON.stringify(additions)}`);
                        additions.forEach(player => this.addPlayer(player.ID, player.name));
                        break;

                    case Packets.server_match_request.ID:
                        let playerID = Packets.server_match_request.decode(packet.payload);
                        let playerName = this.players.find(player => player.ID === playerID).name;
                        this.changeState(Client.states.MatchRequest, {ID: playerID, name: playerName});
                        break;
                    default:
                        this.changeState(Client.states.Failed);
                }
            }

            removePlayer(id, name) {
                this.screen.querySelector(`[player_id="${id}"][player_name="${name}"`).remove();
            }

            addPlayer(id, name) {
                let newPlayer = document.createElement("button");

                newPlayer.setAttribute("player_id", id);
                newPlayer.setAttribute("player_name", name);
                newPlayer.textContent = name;

                // newPlayer.addEventListener('click', () => this.changeState(Client.states.MatchRequest, {name:"test"}));
                newPlayer.addEventListener('click', () => this.selectPlayer(id, name));


                this.buttons.appendChild(newPlayer);
            }

            selectPlayer(id, name) {
                this.emit(
                    State.events.send_packet,
                    Packets.client_player_select.ID,
                    Packets.client_player_select.encode(id));

                this.changeState(Client.states.WaitingForResponse, {id: id, name: name});
            }
        };

        MatchRequest = new class extends State {
            enter(params) {
                let name = params.name;
                this.emit(State.events.show_modal, {
                    title: "Match Request",
                    subtitle: `${name} would like to play a game`,
                    buttons: [
                        {
                            text: "Reject",
                            click: () => {
                                this.emit(State.events.hide_modal);
                                let payload = Packets.client_match_response.encode(0);
                                this.emit(State.events.send_packet, Packets.client_match_response.ID, payload);
                                this.changeState(Client.states.SelectOpponent);
                            }
                        },

                        {
                            text: "Accept",
                            click: () => {
                                this.emit(State.events.hide_modal);
                                let payload = Packets.client_match_response.encode(1);
                                this.emit(State.events.send_packet, Packets.client_match_response.ID, payload);
                                Client.states.SelectOpponent.exit(Client.states.Game);
                                this.changeState(Client.states.Game);
                            }
                        }
                    ]
                });
            }
        };

        WaitingForResponse = new class extends State {
            enter(params) {
                let name = params.name;
                this.emit(State.events.show_modal, {
                    title: "Waiting for response",
                    subtitle: `Waiting for ${name} to respond`,
                    buttons: [
                        {
                            text: "Cancel",
                            click: () => {
                                let payload = Packets.client_cancel_match_request.encode(0);
                                this.emit(State.events.send_packet, Packets.client_cancel_match_request.ID, payload);
                                this.changeState(Client.states.SelectOpponent);
                            }
                        }
                    ]
                });
            }

            handlePacket(packet) {
                if (packet.ID !== Packets.server_match_response.ID) this.changeState(Client.states.Failed);
                else {
                    let response = Packets.server_match_response.decode(packet.payload);
                    if (response === 1) {
                        this.changeState(Client.states.Game);
                        Client.states.SelectOpponent.exit(Client.states.Game);
                    } else if (response === 0) this.changeState(Client.states.SelectOpponent);
                    else this.changeState(Client.states.Failed);
                }
            }

            exit() {
                this.emit(State.events.hide_modal);
            }
        };

        Game = new class extends State {
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
        };
    };

    static modal = new class {
        constructor() {
            this.container = document.querySelector(".cardWrapper");
            this.modal = document.querySelector(".card");

            this.title = this.modal.querySelector("h3");
            this.subtitle = this.modal.querySelector("p");
            this.buttonContainer = this.modal.querySelector(".cardButtons");
        }

        show(modalConf) {
            this.title.textContent = modalConf.title;
            this.subtitle.textContent = modalConf.subtitle;

            while(this.buttonContainer.firstChild) this.buttonContainer.firstChild.remove();
            for (let button of modalConf.buttons) {
                let newButton = document.createElement("button");
                newButton.textContent = button.text;
                newButton.addEventListener('click', button.click);
                this.buttonContainer.appendChild(newButton);
            }

            this.container.classList.remove("gone");
            this.modal.classList.remove("top");
        }

        hide() {
            this.modal.classList.add("top");
            this.container.classList.add("gone");
        }
    };

    constructor(InitialState) {
        this.enter(InitialState);

        this.connection = new WebSocket("ws://localhost:8080");
        this.connection.binaryType = 'arraybuffer';
        this.connection.onmessage = message => this.handlePacket(message.data);

        Client.states.on(State.events.exit, (state, params) => this.changeState(state, params));
        Client.states.on(State.events.send_packet, (header, payload) => this.send(header, payload));
        Client.states.on(State.events.set_id, id => this.ID = id);
        Client.states.on(State.events.show_modal, modelConf => Client.modal.show(modelConf));
        Client.states.on(State.events.hide_modal, () => Client.modal.hide());
    }

    enter(state, params) {
        let currentStateName = Object.keys(Client.states).find(k=>Client.states[k]===this.currentState);
        let nextStateName = Object.keys(Client.states).find(k=>Client.states[k]===state);
        console.log(`Entering: ${nextStateName} from ${currentStateName}`);

        this.currentState = state;
        this.currentState.enter(params);
    }

    changeState(nextState, params) {
        this.currentState.exit();
        this.enter(nextState, params);
    }

    handlePacket(message) {
        let packet = Packets.decodePacket(message);
        let stateName = Object.keys(Client.states).find(k=>Client.states[k]===this.currentState);
        console.log(`Received: ${Packets.packets[packet.ID].name} from Server with ${JSON.stringify(packet.payload)}. Currently in state ${stateName}`);
        this.currentState.handlePacket(packet);
    }

    send(header, payload) {
        let stateName = Object.keys(Client.states).find(k=>Client.states[k]===this.currentState);
        console.log(`Sending: ${Packets.packets[header].name} to server with ${JSON.stringify(payload)}. Currently in state ${stateName}`);
        this.connection.send(Packets.encodePacket(header, payload));
    }
}

let model = new Model();
let view = new View(model);
let controller = new Controller(model, view);
let client = new Client(Client.states.MainMenu);

