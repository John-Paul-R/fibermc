export { AsyncDataResourceLoader, ResourceEntry };

import { executeIfWhenDOMContentLoaded, FunctionBatch } from "./util.js";

class ResourceEntry<TResponse> {
    fn: () => Promise<TResponse>;
    funcs: FunctionBatch<TResponse>;
    /**
     *
     * @param {string} resourceFetchFn
     * @param {Array<Function>} responseFuncs
     */
    constructor(
        resourceFetchFn: () => Promise<TResponse>,
        responseFuncs: ((response: TResponse) => void)[]
    ) {
        this.fn = resourceFetchFn;
        this.funcs = new FunctionBatch(responseFuncs);
    }
}

const requestOpts: RequestInit = {
    method: "GET",
};

class AsyncDataResourceLoader {
    resources: ResourceEntry<any>[];
    completionWaitForDCL: boolean;
    data: { [key: string]: any };
    completionFuncs: FunctionBatch<void>;
    /**
     *
     * @param {Object} options
     * @param {Array<ResourceEnrty>} options.arrResources
     * @param {boolean} options.completionWaitForDCL
     */
    constructor(
        options: {
            resources?: ResourceEntry<any>[];
            completionWaitForDCL: boolean;
        } = {
            resources: [],
            completionWaitForDCL: false,
        }
    ) {
        /**
         * @type {Array<ResourceEntry>}
         */
        this.resources = options.resources ?? [];
        this.completionWaitForDCL = options.completionWaitForDCL;

        this.data = {};
        for (const address of this.resources) {
            this.data[address.toString()] = null;
        }
        this.completionFuncs = new FunctionBatch([]);
    }

    /**
     * Add a resource (and its functions) to the ResourceLoader
     * @param {string} resourceURL
     * @param {Array<Function>} responseFuncs an array of functions to be executed once the resource is laoded
     */
    addResource<TResponse>(
        resourceURL: string,
        responseFuncs: ((response: TResponse) => void)[]
    ) {
        this.resources.push(
            new ResourceEntry(
                () =>
                    fetch(new Request(resourceURL, requestOpts)).then(
                        (response) => {
                            if (response.status === 200) {
                                return response.json();
                            } else {
                                throw new Error(
                                    "Requested data file could not be retrieved from server."
                                );
                            }
                        }
                    ),
                responseFuncs
            )
        );
        return this;
    }

    addResourceFn<TResponse>(
        resourceFn: () => Promise<TResponse>,
        responseFuncs: ((response: TResponse) => void)[]
    ) {
        this.resources.push(new ResourceEntry(resourceFn, responseFuncs))
        return this;
    }

    /**
     * Add a function to be run once ALL resources have been fetched. Chainable.
     * @param {Function} func
     */
    addCompletionFunc(func: () => void) {
        this.completionFuncs.add(func);
        return this;
    }

    fetchResources() {
        const promises = [];

        for (const resource of this.resources) {
            promises.push(
                resource
                    .fn()
                    .then((resJson) => {
                        console.debug(resJson);
                        resource.funcs.runAll(resJson);
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            );
        }
        // 'values' is an array of all final values of the 'promises'
        Promise.all(promises).then((values) => {
            for (const value of values) {
                console.debug(value);
            }
            if (this.completionWaitForDCL) {
                executeIfWhenDOMContentLoaded(() =>
                    this.completionFuncs.runAll()
                );
            } else {
                this.completionFuncs.runAll();
            }
        });
    }
}
