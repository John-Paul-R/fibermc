import { setHidden } from "./util.js";

type LoadbarOptions = {
    parentElement: HTMLElement | undefined | null;
    startPercent?: number;
    hideOnComplete?: boolean;
};

type MutableRef<TValue> = {
    current: TValue;
};

function asRef<TValue>(initalValue: TValue) {
    const ref: MutableRef<TValue> = {
        current: initalValue,
    };
    return ref;
}

export type LoadbarResult = {
    setLoadedPercent: (percentLoaded: number) => void;
    getLoadedPercent: () => number;
    setText: (text: string) => string;
};

export function createLoadbar({
    parentElement,
    startPercent = 0,
    hideOnComplete = false,
}: LoadbarOptions): LoadbarResult {
    if (!parentElement) {
        throw new Error("Loadbar parent element was null.");
    }
    const loadbar_container = document.createElement("div");
    loadbar_container.classList.add("loadbar_container");

    const loadbar_text = document.createElement("div");
    loadbar_text.classList.add("loadbar_content");

    const loadbar_content = document.createElement("div");
    loadbar_content.classList.add("loadbar_text");

    const percentLoadedRef = asRef(startPercent);

    return {
        setLoadedPercent: (percentLoaded: number) => {
            percentLoadedRef.current = percentLoaded;
            loadbar_content.style.width = `calc(${percentLoaded}% - 4px`;

            if (hideOnComplete && percentLoaded >= 1) {
                setTimeout(() => {
                    loadbar_text.textContent = "All mods loaded!";
                    hideLoadbar(loadbar_container, 1000);
                }, 100);
            } else {
                loadbar_text.textContent = "";
                showLoadbar(loadbar_container, 0);
            }
        },
        getLoadedPercent: () => percentLoadedRef.current,
        setText: (text: string) => (loadbar_text.textContent = text),
    };
}

function hideLoadbar(loadbarElement: HTMLElement, delay: number) {
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
function showLoadbar(loadbarElement: HTMLElement, delay: number) {
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
