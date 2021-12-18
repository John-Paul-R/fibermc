import { setHidden } from "./util.js";
function asRef(initalValue) {
    const ref = {
        current: initalValue,
    };
    return ref;
}
export function createLoadbar({ parentElement, startPercent = 0, hideOnComplete = false, }) {
    if (!parentElement) {
        throw new Error("Loadbar parent element was null.");
    }
    const loadbar_container = document.createElement("div");
    loadbar_container.classList.add("loadbar_container");
    const loadbar_text = document.createElement("div");
    loadbar_text.classList.add("loadbar_text");
    const loadbar_content = document.createElement("div");
    loadbar_content.classList.add("loadbar_content");
    loadbar_container.appendChild(loadbar_text);
    loadbar_container.appendChild(loadbar_content);
    parentElement.appendChild(loadbar_container);
    const percentLoadedRef = asRef(startPercent);
    return {
        setLoadedPercent: (percentLoaded) => {
            percentLoadedRef.current = percentLoaded;
            loadbar_content.style.width = `calc(${percentLoaded * 100}% - 4px`;
            if (hideOnComplete && percentLoaded >= 1) {
                setTimeout(() => {
                    loadbar_text.textContent = "All mods loaded!";
                    hideLoadbar(loadbar_container, 1000);
                }, 100);
            }
            else {
                loadbar_text.textContent = "";
                showLoadbar(loadbar_container, 0);
            }
        },
        getLoadedPercent: () => percentLoadedRef.current,
        setText: (text) => (loadbar_text.textContent = text),
    };
}
function hideLoadbar(loadbarElement, delay) {
    setTimeout(() => {
        // @ts-expect-error
        gsap.to(loadbarElement, {
            duration: 1,
            opacity: 0,
        });
        setTimeout(() => {
            setHidden(loadbarElement, true);
        }, 1000);
    }, delay);
}
function showLoadbar(loadbarElement, delay) {
    setTimeout(() => {
        setHidden(loadbarElement, false);
        setTimeout(() => {
            // @ts-expect-error
            gsap.to(loadbarElement, {
                duration: 1,
                opacity: 1,
            });
        }, 1000);
    }, delay);
}
//# sourceMappingURL=loadbar.js.map