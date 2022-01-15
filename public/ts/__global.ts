export {};

declare global {
    interface Array<T> {
        at(index: number): T;
    }
}
