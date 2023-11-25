export type PooledObject<T> = T & {
    free: () => void;
};

class Queue<T> {
    private queue: T[];
    constructor() {
        this.queue = [];
    }

    enqueue(element: T) {
        return this.queue.push(element);
    }

    dequeue() {
        if (this.queue.length > 0) {
            return this.queue.shift(); // remove first element
        }
    }

    peek() {
        return this.queue[this.queue.length - 1];
    }

    size() {
        return this.queue.length;
    }

    isEmpty() {
        return this.queue.length == 0;
    }

    clear() {
        this.queue = [];
    }
}

export class ObjectPool<T, TKey extends object = object> {
    private availableObjects: Queue<T> = new Queue();
    private listElementObjectPool: WeakMap<TKey, PooledObject<T>> =
        new WeakMap();
    private creationFn: (key: TKey) => PooledObject<T>;
    private initFn: (obj: PooledObject<T>, key: TKey) => void;

    constructor(
        creationFn: (key: TKey) => T,
        initFn: (obj: PooledObject<T>, key: TKey) => void
    ) {
        this.creationFn = (key: TKey) => {
            return this._addFreeFn(key, creationFn(key));
        };
        this.initFn = initFn;
    }

    private _addFreeFn(key: TKey, obj: T): PooledObject<T> {
        (obj as PooledObject<T>).free = () => {
            // @ts-expect-error
            obj.free = undefined;
            this.listElementObjectPool.delete(key);
            this.availableObjects.enqueue(obj);
        };
        return obj as PooledObject<T>;
    }

    // to be run when not found in the active object pool for the key
    private _create(key: TKey): PooledObject<T> {
        let obj: PooledObject<T>;
        if (this.availableObjects.isEmpty()) {
            obj = this.creationFn(key);
            // console.log("create!", obj);
        } else {
            obj = this._addFreeFn(key, this.availableObjects.dequeue()!);
            // console.log("object pool!", (key as any).name, obj);
        }
        this.initFn(obj, key);
        return obj;
    }

    public create(key: TKey) {
        const cachedValue = this.listElementObjectPool.get(key);
        if (cachedValue) {
            // console.log("cache!", cachedValue);
            return cachedValue;
        }
        const createdValue = this._create(key);

        this.listElementObjectPool.set(key, createdValue);

        return createdValue;
    }
}
