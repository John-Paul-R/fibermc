import { DefaultListElementRenderer } from "./list_elem_default.js";
import { fillAuthorDiv, setModCategoryElements } from "./list_item_shared.js";
import {
    CATEGORIES,
    batch_containers,
    fabric_category_id,
    init,
    initSearch,
    loader,
    resultsListElement,
    setLiHeight,
    setResultsListElement,
} from "./mod_search_logic.js";
import { Mod } from "./mod_types.js";
import {
    createCurseLinkIcon,
    createModrinthLinkIcon,
} from "./platform_links.js";
import { executeIfWhenDOMContentLoaded, getElementById } from "./util.js";

const createListElement: (modData: Mod) => HTMLLIElement =
    DefaultListElementRenderer();

function createListElementDetailed(modData: Mod) {
    const li = document.createElement("li");

    const front_container = document.createElement("div");
    const end_container = document.createElement("div");

    const title_container = document.createElement("div");
    const name = document.createElement("a");
    const authorDiv = document.createElement("div");
    authorDiv.setAttribute("class", "author");

    const categories = document.createElement("ul");
    const desc = document.createElement("p");

    let botContainer;

    li.classList.add("item");
    li.classList.add("detailed");
    li.classList.add("container");
    front_container.classList.add("front_container");
    end_container.classList.add("end_container");
    name.classList.add("name");
    categories.classList.add("item_categories");
    desc.classList.add("desc");

    try {
        botContainer = document.createElement("div");
        let dlCount = document.createElement("div");
        let dateUpdated = document.createElement("div");
        let latestSupportedVers = document.createElement("div");

        dlCount.classList.add("dl_count");
        dateUpdated.classList.add("date_updated");
        latestSupportedVers.classList.add("latest_version");
        botContainer.classList.add("bot_container");

        dlCount.textContent = modData.downloadCount.toLocaleString();
        dateUpdated.textContent = new Date(
            modData.dateModified
        ).toLocaleDateString();
        latestSupportedVers.textContent = modData.latestMCVersion;

        botContainer.appendChild(dlCount);
        botContainer.appendChild(dateUpdated);
        botContainer.appendChild(latestSupportedVers);

        // Fill content of elements
        name.textContent = modData.name;

        fillAuthorDiv(authorDiv, modData);

        for (const category of modData.categories) {
            // if not "Fabric"
            if (category !== fabric_category_id) {
                const catElem = document.createElement("li");
                catElem.textContent = CATEGORIES[category].name;
                categories.appendChild(catElem);
            }
        }
        desc.textContent = modData.summary;

        end_container.appendChild(createCurseLinkIcon(modData));
        end_container.appendChild(createModrinthLinkIcon(modData));
        // Add elements as children where they belong and return root elem
        title_container.appendChild(name);
        title_container.insertAdjacentText("beforeend", " by ");
        title_container.appendChild(authorDiv);
        front_container.appendChild(title_container);
        front_container.appendChild(desc);
        li.appendChild(front_container);
        end_container.appendChild(categories);
        li.appendChild(end_container);
        li.appendChild(botContainer);
    } catch (err) {
        console.group();
        console.warn("Failed to fill mod info.");
        console.warn(err);
        console.warn(modData);
        console.groupEnd();
    }

    return li;
}

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
