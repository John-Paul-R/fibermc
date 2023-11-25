import { ObjectPool, PooledObject } from "./object_pool.js";

export abstract class ListElementRenderer<
    TRowData extends object,
    TElemData,
    TElement = HTMLLIElement
> {
    private objectPool: ObjectPool<TElemData, TRowData>;

    constructor() {
        this.objectPool = new ObjectPool(
            (modData) => {
                const elements = this.listElementTemplate();
                this.fillListElementData(elements, modData);
                return elements;
            },
            () => {}
        );
    }

    public createElement(rowData: TRowData): PooledObject<TElement> {
        const elemData = this.objectPool.create(rowData);
        const element = this.getElementFromElemData(elemData);
        (element as PooledObject<TElement>).free = elemData.free;
        return element as PooledObject<TElement>;
    }

    protected abstract listElementTemplate(): TElemData;

    protected abstract fillListElementData(
        elements: TElemData,
        rowData: TRowData
    ): void;

    protected abstract getElementFromElemData(elements: TElemData): TElement;
}
