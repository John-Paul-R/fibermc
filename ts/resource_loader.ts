export { AsyncDataResourceLoader, ResourceEntry };

import { executeIfWhenDOMContentLoaded, FunctionBatch } from "./util";

class ResourceEntry<TResponse> {
    url: string;
    funcs: FunctionBatch<TResponse>;
    /**
     *
     * @param {string} resourceURL
     * @param {Array<Function>} responseFuncs
     */
    constructor(
        resourceURL: string,
        responseFuncs: ((response: TResponse) => void)[]
    ) {
        this.url = resourceURL;
        this.funcs = new FunctionBatch(responseFuncs);
    }
}

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
        this.resources.push(new ResourceEntry(resourceURL, responseFuncs));
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
        const requestOpts = {
            method: "GET",
        };

        for (const resource of this.resources) {
            promises.push(
                fetch(new Request(resource.url, requestOpts))
                    .then((response) => {
                        if (response.status === 200) {
                            return response.json();
                        } else {
                            throw new Error(
                                "Requested data file could not be retrieved from server."
                            );
                        }
                    })
                    .then((resJson) => {
                        console.debug("hi there");
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
