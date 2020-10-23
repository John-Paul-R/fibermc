
export {
    throttle,
    debounce,
    executeOrWait,
    executeIfWhenDOMContentLoaded,
    FunctionBatch,
    toggleHidden, setHidden
};

/**
 * 
 * @param {function} func The function to be throttled. 
 * @param {number} timeInterval The time interval, in miliseconds, in which to apply the trottle.
 * 
 * @returns {function} The throttled function.
 */
function throttle(func, timeInterval) {
    var lastTime = 0;
    return function () {
        var now = Date.now();
        if (now - lastTime >= timeInterval) {
            func();
            lastTime = now;
        } else {
            setTimeout(func, lastTime+timeInterval);
        }
    };
}

/**
 * 
 * @param {function} func The function to be debounced. 
 * @param {number} delay The time interval, in miliseconds, in which to apply the debounce.
 * 
 * @returns {function} The debounced function.
 */
function debounce(func, delay) { 
    let debounceTimer 
    return function() { 
        const context = this
        const args = arguments 
            clearTimeout(debounceTimer) 
                debounceTimer 
            = setTimeout(() => func.apply(context, args), delay) 
    } 
}
/**
 * Conditionally executes 'execFunc' now (if 'condition' is met) otherwise 
 * executes 'waitFunc'
 * @param {function} execFunc 
 * @param {boolean} condition 
 * @param {function} waitFunc 
 */
function executeOrWait(execFunc, condition, waitFunc) {
    if (condition) {
        execFunc();
    } else {
        waitFunc(execFunc);
    }
}
/**
 * If DOM content is loaded, executes the provided function now,
 * otherwise adds an event listener for 'DOMContentLoaded' to execute the
 * provided function.
 * 
 * @param {function} func 
 */
function executeIfWhenDOMContentLoaded(func) {
    executeOrWait(
        func, 
        (
            document.readyState === "complete" 
            || document.readyState === "loaded" 
            || document.readyState === "interactive"
        ),
        () => window.addEventListener('DOMContentLoaded', func)
    );
}

class FunctionBatch {
    /**
     * 
     * @param {Array<function>} arrFuncs an array of functions
     */
    constructor(arrFuncs) {
        this.funcs = arrFuncs || [];
    }

    /**
     * Add a function to the batch. Chainable.
     * @param {function} func 
     * @return {FunctionBatch}
     */
    add(func) {
        this.funcs.push(func);
        return this;
    }

    /**
     * Execute all functions in the batch.
     */
    runAll(args) {
        for (const func of this.funcs) {
            func(args);
        }
    }
}

function toggleHidden(htmlElement) {
    if (htmlElement.className.includes("hidden"))
        htmlElement.className = htmlElement.className.replace( /(?:^|\s)hidden(?!\S)/g , '' );
    else
        htmlElement.className = htmlElement.className +" hidden";
}
/**
 * 
 * @param {HTMLElement} htmlElement 
 * @param {boolean} hidden 
 */
function setHidden(htmlElement, hidden) {
    if (hidden) {
        if (!htmlElement.className.includes("hidden")) {
            htmlElement.className = htmlElement.className +" hidden";
        }
    }
    else {
        if (htmlElement.className.includes("hidden")) {
            htmlElement.className = htmlElement.className.replace( /(?:^|\s)hidden(?!\S)/g , '' );

        }

    }
}

