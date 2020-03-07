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
        this.model.setMark(x, y);
    }
}
module.exports = Controller;