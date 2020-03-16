const EventEmitter = require('events').EventEmitter;
class Controller extends EventEmitter {
    static events = {
        click:"click"
    };

    constructor(model, view) {
        super();
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
                    this.emit(Controller.events.click, x, y);
                };
            }
        }
    }

    setMark(x, y) {
        this.model.setMark(x, y);
    }
}
module.exports = Controller;