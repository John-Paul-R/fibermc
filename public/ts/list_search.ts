import { DefaultListElementRenderer } from "./list_elem_default.js";
import { DetailedListElementRenderer } from "./list_elem_detailed.js";
import { setModCategoryElements } from "./list_item_shared.js";
import {
    CATEGORIES,
    batch_containers,
    init,
    initSearch,
    loader,
    resultsListElement,
    setLiHeight,
    setResultsListElement,
} from "./mod_search_logic.js";
import { Mod } from "./mod_types.js";
import { executeIfWhenDOMContentLoaded, getElementById } from "./util.js";

type ListElementRenderFn = (modData: Mod) => HTMLLIElement;

const createListElement: ListElementRenderFn = DefaultListElementRenderer();

const createListElementDetailed: ListElementRenderFn =
    DetailedListElementRenderer();

var createBatch = (batchIdx: number, data_batches: Mod[][]) => {
    for (const result_data of data_batches[batchIdx]) {
        try {
            batch_containers[batchIdx].appendChild(
                currentListCreationFunc(result_data)
            );
        } catch (err) {
            batch_containers[batchIdx]
                .appendChild(document.createElement("li"))
                .setAttribute("class", "item");

            console.warn(err);
            console.warn(result_data);
        }
    }
};

// // Logic createListElement, true, LI_HEIGHT, BATCH_SIZE, createBatch
// type ModWithElem = Mod & {
//     elem: HTMLElement;
//     _elem: HTMLElement;
//     _elemFn: () => HTMLElement;
//     getElem: () => HTMLElement;
// };
//
// loader.addCompletionFunc(() => {
//     const MAX_FAILS = 100;
//     let failCount = 0;
//     for (const mod of mod_data as ModWithElem[]) {
//         try {
//             // mod.elem = createListElement(mod);
//             // mod._elemFn = () => mod._elem = createListElement(mod);
//         } catch (err) {
//             console.warn(`Could not load elem for mod`);
//             failCount++;
//             if (failCount > MAX_FAILS) {
//                 break;
//             }
//         }
//     }
// });

loader.addCompletionFunc(() =>
    setResultsListElement(getElementById("search_results_list"))
);

var modCategoryElements: (() => Node)[];
loader.addCompletionFunc(() => {
    modCategoryElements = (() => {
        const categoryReferenceElements = CATEGORIES.map((c) => {
            const catElem = document.createElement("li");
            catElem.textContent = c.name;
            return catElem;
        });
        return categoryReferenceElements.map((c) => () => c.cloneNode(true));
    })();
    setModCategoryElements(modCategoryElements);
});

function getLiHeight() {
    const fmt = (val: string) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);
    return parseInt(fmt(style.getPropertyValue("--item-height"))) + 2;
}

function getLiHeightDetailed() {
    const fmt = (val: string) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);

    return parseInt(fmt(style.getPropertyValue("--item-height"))) + 36 + 8 + 2;
}

var viewModes = [createListElement, createListElementDetailed];
var modeLiHeights = [getLiHeight, getLiHeightDetailed];
const CURRENT_LIST_VIEW_IDX_STORAGE_KEY = "currentListViewIdx";
var currentViewIdx =
    Number(window.localStorage.getItem(CURRENT_LIST_VIEW_IDX_STORAGE_KEY)) ?? 0;
var currentListCreationFunc = viewModes[0];
function updateViewModes() {
    currentListCreationFunc = viewModes[currentViewIdx];
    setLiHeight(modeLiHeights[currentViewIdx]());
}
function cycleListViewModes() {
    currentViewIdx++;
    if (currentViewIdx >= viewModes.length) {
        currentViewIdx = 0;
    }
    window.localStorage.setItem(
        CURRENT_LIST_VIEW_IDX_STORAGE_KEY,
        currentViewIdx.toString()
    );
    updateViewModes();
}

window.matchMedia("only screen and (max-width: 1000px)").onchange = () => {
    updateViewModes();
};

executeIfWhenDOMContentLoaded(() => {
    getElementById("list_view_cycle_button").addEventListener(
        "click",
        cycleListViewModes
    );
});

loader.addCompletionFunc(() => {
    initSearch({
        results_persist: true,
        batchCreationFunc: createBatch,
        lazyLoadBatches: true,
        batch_size: 20,
        li_height: modeLiHeights[currentViewIdx](),
    });
    updateViewModes();
});

init();
