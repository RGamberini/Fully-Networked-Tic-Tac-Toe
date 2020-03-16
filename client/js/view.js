const Model = require("../../shared/model");
class View {
    static marks = {
        0: 'X',
        1: '',
        2: 'O'
    };

    constructor(model, player) {
        this.model = model;
        this.player = player;
        model.on(Model.events.boardUpdate, (x, y, player) => this.update(x, y, player));
        this.boardView = [];

        this.tbody = document.querySelector("tbody");
        for (let x = 0; x < this.tbody.children.length; x++) {
            this.boardView.push(this.tbody.children[x].children);
            for (let y = 0; y < this.tbody.children.length; y++) {
                this.boardView[x][y].textContent = View.marks[model.getSpace(x, y)];
            }
        }

        if (model.currentPlayer !== this.player) {
            this.tbody.classList.add("nopointer");
        }
    }

    update(x, y, player) {
        this.boardView[x][y].classList.add("non-clickable");
        this.boardView[x][y].onclick = function (event) {
        };
        this.boardView[x][y].textContent = View.marks[player];

        if (player === this.player) this.tbody.classList.add("nopointer");
        else this.tbody.classList.remove("nopointer");
    }
}
module.exports = View;