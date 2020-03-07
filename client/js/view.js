const Model = require("./model");
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
module.exports = View;