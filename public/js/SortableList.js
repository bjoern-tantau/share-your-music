class SortableList {
    constructor(ul) {
        this.ul = ul;

        ul.addEventListener('drag', e => {
            if (e.target.parentNode === ul) {
                this.lastDragged = e.target;
                e.target.classList.add('sorting');
            }
        });

        ul.addEventListener('dragover', e => {
            e.preventDefault();
            if (ul.contains(e.target)) {
                let li = e.target;
                while (li && li.parentNode !== ul) {
                    li = li.parentNode;
                }
                this.lastOver = li;
                if (this.lastOver && this.lastDragged && this.lastDragged != this.lastOver) {
                    this.lastOver.before(this.lastDragged);
                }
            }
        });

        ul.addEventListener('drop', e => {
            e.preventDefault();
            if (this.lastDragged) {
                this.lastDragged.classList.remove('sorting');
            }
            this.lastDragged = null;
            this.lastOver = null;
            this.dispatchEvent(new Event('sorted'));
        });

        this.ul.childNodes.forEach(li => {
            li.draggable = true;
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