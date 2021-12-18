export {
    throttle,
    debounce,
    executeOrWait,
    executeIfWhenDOMContentLoaded,
    FunctionBatch,
    toggleHidden,
    setHidden,
};

/**
 *
 * @param {function} func The function to be throttled.
 * @param {number} timeInterval The time interval, in miliseconds, in which to apply the trottle.
 *
 * @returns {function} The throttled function.
 */
function throttle(func: () => void, timeInterval: number): () => void {
    var lastTime = 0;
    return function () {
        var now = Date.now();
        if (now - lastTime >= timeInterval) {
            func();
            lastTime = now;
        } else {
            setTimeout(func, lastTime + timeInterval);
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
function debounce(func: (...funcArgs: any) => void, delay: number): () => void {
    let debounceTimer: number | undefined;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(
            () => func.apply(context, Array.from(args)),
            delay
        );
    };
}
/**
 * Conditionally executes 'execFunc' now (if 'condition' is met) otherwise
 * executes 'waitFunc'
 * @param {function} execFunc
 * @param {boolean} condition
 * @param {function} waitFunc
 */
function executeOrWait(
    execFunc: () => void,
    condition: boolean,
    waitFunc: (execFunc: () => void) => void
) {
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
function executeIfWhenDOMContentLoaded(func: () => void) {
    executeOrWait(
        func,
        document.readyState === "complete" ||
            document.readyState === "interactive",
        () => window.addEventListener("DOMContentLoaded", func)
    );
}

class FunctionBatch<TArgs> {
    funcs: ((args: TArgs) => void)[];
    /**
     *
     * @param {Array<function>} arrFuncs an array of functions
     */
    constructor(arrFuncs: ((args: TArgs) => void)[]) {
        this.funcs = arrFuncs || [];
    }

    /**
     * Add a function to the batch. Chainable.
     * @param {function} func
     * @return {FunctionBatch}
     */
    add(func: (args: TArgs) => void) {
        this.funcs.push(func);
        return this;
    }

    /**
     * Execute all functions in the batch.
     */
    runAll(args: TArgs) {
        for (const func of this.funcs) {
            func(args);
        }
    }
}

function toggleHidden(htmlElement: HTMLElement) {
    if (htmlElement.className.includes("hidden"))
        htmlElement.className = htmlElement.className.replace(
            /(?:^|\s)hidden(?!\S)/g,
            ""
        );
    else htmlElement.className = htmlElement.className + " hidden";
}
/**
 *
 * @param {HTMLElement} htmlElement
 * @param {boolean} hidden
 */
function setHidden(htmlElement: HTMLElement, hidden: boolean) {
    if (hidden) {
        if (!htmlElement.className.includes("hidden")) {
            htmlElement.className = htmlElement.className + " hidden";
        }
    } else {
        if (htmlElement.className.includes("hidden")) {
            htmlElement.className = htmlElement.className.replace(
                /(?:^|\s)hidden(?!\S)/g,
                ""
            );
        }
    }
}
