export class LayeredLayout {
    constructor() {
        this.layers = [];
    }
    addLayer(layer) {
        this.layers.push(layer);
    }
    getLayer(index) {
        return this.layers[index];
    }
    get depth() {
        return this.layers.length;
    }
    render(context) {
        this.layers.forEach((layer) => { layer.render(context); });
    }
    update(dt) {
        this.layers.forEach(layer => layer.update(dt));
    }
}
export class Block {
    constructor(row, column) {
        this._row = row;
        this._column = column;
    }
    update(dt) {
        this.contents.update(dt);
    }
    render(context) {
        this.contents.render(context);
    }
    get row() {
        return this._row;
    }
    get column() {
        return this._column;
    }
    get location() {
        return this.contents.location;
    }
    move(dx, dy) {
        this.contents.move(dx, dy);
    }
}
export class BlockGridLayer {
    constructor(rowHeight, columnWidth) {
        this._blocks = new Array();
        this._rowStepSize = rowHeight;
        this._rowOffset = rowHeight / 2;
        this._columnStepSize = columnWidth;
        this._columnOffset = columnWidth / 2;
    }
    update(dt) {
        this._blocks.forEach(i => i.update(dt));
    }
    render(context) {
        this._blocks.forEach(b => b.render(context));
    }
    addBlock(block) {
        let blockX = (block.column * this._columnStepSize) + this._columnOffset;
        let blockY = (block.row * this._rowStepSize) + this._rowOffset;
        block.move(blockX - block.location.x, blockY - block.location.y);
        this._blocks.push(block);
    }
}
