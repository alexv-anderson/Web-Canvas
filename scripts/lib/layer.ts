
import { Point, Renderable, RenderableAtPoint, Updatable } from "./common.js";

/**
 * Represents a layer of sprites which for the background/floor
 */
export interface Layer extends Renderable, Updatable {
    update(dt: number): void;
    
    /**
     * Renders the layer on the supplied canvas
     * @param context The rendering context of the canvas on which the layer should be rendered
     */
    render(context: CanvasRenderingContext2D): void;
}

/**
 * Represents a list of layers
 */
export class LayeredLayout<L extends Layer> implements Renderable {
    /**
     * Adds a layer on top of the existing layers
     * @param layer The layer to be placed at the top of the list
     */
    public addLayer(layer: L): void {
        this.layers.push(layer);
    }

    /**
     * Supplies the layer at the given index.
     * 
     * Note: the lowest layer has an index of 0
     * @param index The index of the desired layer
     */
    public getLayer(index: number): L {
        return this.layers[index];
    }

    /**
     * The number of layers in this layout
     */
    public get depth(): number {
        return this.layers.length;
    }

    /**
     * Renders the layers of the layout in order
     * @param context The rendering context of the canvas on which the layout should be rendered
     */
    public render(context: CanvasRenderingContext2D): void {
        this.layers.forEach((layer: Layer) => { layer.render(context); });
    }

    private layers: Array<L> = [];
}

export abstract class Block<C extends Updatable & RenderableAtPoint> implements RenderableAtPoint, Updatable {
    constructor(row: number, column: number) {
        this._row = row;
        this._column = column;
    }

    public update(dt: number): void {
        this.contents.update(dt);
    }

    public renderAt(context: CanvasRenderingContext2D, point: Point): void {            
        this.contents.renderAt(context, point);
    }

    protected abstract get contents(): C;

    public get row(): number {
        return this._row;
    }
    public get column(): number {
        return this._column;
    }

    private _row: number;
    private _column: number;
}

export class BlockGridLayer<C extends RenderableAtPoint & Updatable> implements Layer {
    constructor(rowHeight: number, columnWidth: number) {
        this._blocks = new Array<Block<C>>();

        this._rowStepSize = rowHeight;
        this._rowOffset = rowHeight / 2;
        this._columnStepSize = columnWidth;
        this._columnOffset = columnWidth / 2;
    }

    public update(dt: number): void {
        this._blocks.forEach(i => i.update(dt));
    }

    public render(context: CanvasRenderingContext2D): void {
        this._blocks.forEach(b => b.renderAt(
            context,
            new Point(
                (b.column * this._columnStepSize) + this._columnOffset,  // which column
                (b.row * this._rowStepSize) + this._rowOffset            // which row
            )
        ));
    }

    protected addBlock(block: Block<C>): void {
        this._blocks.push(block);
    }

    private _blocks: Array<Block<C>>;

    private _columnStepSize: number;
    private _columnOffset: number;
    private _rowStepSize: number;
    private _rowOffset: number;
}