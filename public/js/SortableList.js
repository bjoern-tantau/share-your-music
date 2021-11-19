class SortableList {
    constructor(ul) {
        this.ul = ul;
        this.ul.childNodes.forEach(li => {
            li.draggable = true;
            li.addEventListener('drag', e => {
                this.lastDragged = li;
            });
            li.addEventListener('dragover', e => {
                e.preventDefault();
                this.lastOver = li;
                if (this.lastDragged && this.lastDragged != this.lastOver) {
                    this.lastOver.before(this.lastDragged);
                }
            });
            li.addEventListener('drop', e => {
                e.preventDefault();
                this.lastDragged = null;
                this.lastOver = null;
                this.dispatchEvent(new Event('sorted'));
            });
        });
    }
    
    addEventListener(listenerName, cb) {
        this.ul.addEventListener(listenerName, cb);
    }
    dispatchEvent(event) {
        this.ul.dispatchEvent(event);
    }
}

export default SortableList;