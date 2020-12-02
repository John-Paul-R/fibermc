
export {
    AsyncDataResourceLoader, ResourceEntry,
};

import {
    executeIfWhenDOMContentLoaded,
    FunctionBatch
} from './util.js';

class ResourceEntry {
    /**
     * 
     * @param {string} resourceURL 
     * @param {Array<Function>} responseFuncs 
     */
    constructor (resourceURL, responseFuncs) {
        this.url = resourceURL;
        this.funcs = new FunctionBatch(responseFuncs);
    }
}

class AsyncDataResourceLoader {
    /**
     * 
     * @param {Object} options
     * @param {Array<ResourceEnrty>} options.arrResources 
     * @param {boolean} options.completionWaitForDCL 
     */
    constructor(options={
        arrResources: [],
        completionWaitForDCL: false 
    }) {
        /**
         * @type {Array<ResourceEntry>}
         */
        this.resources = options.arrResources || [];
        this.completionWaitForDCL = options.completionWaitForDCL;

        this.data = {};
        for (const address of this.resources) {
            this.data[address] = null;
        }
        this.completionFuncs = new FunctionBatch();
    }
    
    /**
     * Add a resource (and its functions) to the ResourceLoader
     * @param {string} resourceURL 
     * @param {Array<Function>} responseFuncs an array of functions to be executed once the resource is laoded
     */
    addResource(resourceURL, responseFuncs) {
        this.resources.push(new ResourceEntry(resourceURL, responseFuncs));
        return this;
    }

    /**
     * Add a function to be run once ALL resources have been fetched. Chainable.
     * @param {Function} func 
     */
    addCompletionFunc(func) {
        this.completionFuncs.add(func);
        return this;
    }

    fetchResources() {
        const promises = [];
        const requestOpts = {
            method: "GET"
        }

        for (const resource of this.resources) {
            promises.push(fetch(new Request(resource.url, requestOpts))
                .then(response => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        throw new Error('Requested data file could not be retrieved from server.');
                    }
                })
                .then(resJson => {
                    console.debug("hi there");
                    console.debug(resJson);
                    resource.funcs.runAll(resJson);
                })
                .catch(error => {
                    console.error(error);
                }
            ));
        }
        // 'values' is an array of all final values of the 'promises'
        Promise.all(promises).then((values) => {
            for (const value of values) {
                console.debug(value);
            }
            if (this.completionWaitForDCL) {
                executeIfWhenDOMContentLoaded(()=>this.completionFuncs.runAll());
            } else {
                this.completionFuncs.runAll();
            }
            
        });
    }
}

