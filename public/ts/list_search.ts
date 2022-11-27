import {
    init,
    initSearch,
    fabric_category_id,
    loader,
    CATEGORIES,
    resultsListElement,
    setResultsListElement,
    batch_containers,
    setLiHeight,
} from "./mod_search_logic.js";
import { executeIfWhenDOMContentLoaded, getElementById } from "./util.js";
import {
    createCurseAuthorIcon,
    createCurseLinkIcon,
    createModrinthAuthorIcon,
    createModrinthLinkIcon,
} from "./platform_links.js";
import { Mod, Author } from "./mod_types.js";
import { formatNumberCompact } from "./number_formatter.js";

var authorListPopup = (function createAuthorListDiv() {
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("hidden");
    contentDiv.classList.add("item_author_list");
    document.body.appendChild(contentDiv);
    contentDiv.addEventListener('click', (e) => e.stopPropagation());
    return contentDiv;
})();

/**
 *
 * @param {HTMLElement} node
 */
function clearChildren(node: HTMLElement) {
    while (node.hasChildNodes()) {
        node.removeChild(node.firstChild!);
    }
}

/**
 *
 * @param listDiv
 * @param authors
 * @param x
 * @param y
 * @param hoverTrigger if null, don't unregister any listeners
 */
function showAuthorList(
    listDiv: HTMLElement,
    authors: Author[],
    x: number,
    y: number,
    hoverTrigger?: {
        element: HTMLElement,
        listener: (e: MouseEvent) => void,
    }
) {
    clearChildren(authorListPopup);

    listDiv.style.top = `${y}px`;
    listDiv.style.left = `${x}px`;

    for (const mod_author of authors) {
        const authorRow = document.createElement("div");
        const nameSpan = document.createElement("span");
        nameSpan.textContent = mod_author.name;
        authorRow.appendChild(nameSpan);
        authorRow.appendChild(createCurseAuthorIcon(mod_author));
        authorRow.appendChild(createModrinthAuthorIcon(mod_author));
        listDiv.appendChild(authorRow);
    }

    let isActive = true;
    listDiv.classList.remove("hidden");
    hoverTrigger?.element.removeEventListener("mouseover", hoverTrigger.listener);

    const handleExit = () => {
        isActive = false;
        listDiv.classList.add("hidden");
        hoverTrigger?.element.addEventListener(
            "mouseover",
            hoverTrigger.listener
        );
        document.body.removeEventListener('click', handleExit);
    };

    document.body.addEventListener('click', handleExit);

    if (hoverTrigger) {
        const checkForExit = () => {
            if (!isActive || !(listDiv.matches(':hover') || hoverTrigger.element.matches(':hover'))) {
                handleExit();
                return;
            }
            requestAnimationFrame(checkForExit);
        };
        setTimeout(() => checkForExit(), 1);
    }
}

function fillAuthorDiv(authorDiv: HTMLDivElement, modData: Mod) {
    if (modData.authors && modData.authors.length > 0) {
        if (modData.authors.length === 1) {
            const mod_author = modData.authors[0];
            const nameSpan = document.createElement("span");
            nameSpan.textContent = mod_author.name;
            authorDiv.appendChild(nameSpan);
            authorDiv.appendChild(createCurseAuthorIcon(mod_author));
            authorDiv.appendChild(createModrinthAuthorIcon(mod_author));
        } else {
            authorDiv.textContent = "Several People...";

            const hoverListener = (e: MouseEvent) => {
                const textRect = (
                    e.target as HTMLElement
                ).getBoundingClientRect();

                showAuthorList(
                    authorListPopup,
                    modData.authors,
                    textRect.x,
                    textRect.y,
                    {
                        element: authorDiv,
                        listener: hoverListener,
                    },
                );
            };
            authorDiv.addEventListener("mouseover", hoverListener);

            authorDiv.addEventListener("click", (e) => {
                const textRect = (
                    e.target as HTMLElement
                ).getBoundingClientRect();
                console.log("click")

                showAuthorList(
                    authorListPopup,
                    modData.authors,
                    textRect.x,
                    textRect.y
                );

                e.stopPropagation();
            });
        }
    } else {
        authorDiv.innerText = "undefined";
    }
}

const listElementTemplate = (() => {
    const li = document.createElement("li");

    const container = document.createElement("div");
    const front_container = document.createElement("div");
    const end_container = document.createElement("div");

    const title_container = document.createElement("div");
    const name = document.createElement("a");

    const authorDiv = document.createElement("div");

    const categories = document.createElement("ul");
    const desc = document.createElement("p");

    const startContainer = document.createElement("div");
    const dlCount = document.createElement("p");

    authorDiv.setAttribute("class", "author");
    li.setAttribute("class", "item");
    container.setAttribute("class", "container");
    front_container.setAttribute("class", "front_container");
    end_container.setAttribute("class", "end_container");
    name.setAttribute("class", "name");
    categories.setAttribute("class", "item_categories");
    desc.setAttribute("class", "desc");
    dlCount.setAttribute("class", "dl_count");
    startContainer.setAttribute("class", "start_container");

    return () => {
        const elements = {
            li:              li             .cloneNode(true) as HTMLLIElement,
            container:       container      .cloneNode(true) as HTMLDivElement,
            front_container: front_container.cloneNode(true) as HTMLDivElement,
            end_container:   end_container  .cloneNode(true) as HTMLDivElement,
            title_container: title_container.cloneNode(true) as HTMLDivElement,
            name:            name           .cloneNode(true) as HTMLAnchorElement,
            authorDiv:       authorDiv      .cloneNode(true) as HTMLDivElement,
            categories:      categories     .cloneNode(true) as HTMLUListElement,
            desc:            desc           .cloneNode(true) as HTMLParagraphElement,
            startContainer:  startContainer .cloneNode(true) as HTMLDivElement,
            dlCount:         dlCount        .cloneNode(true) as HTMLParagraphElement,
        }

        // Add elements as children where they belong and return root elem
        elements.li.appendChild(elements.startContainer);
        elements.startContainer.appendChild(elements.dlCount);
        elements.title_container.appendChild(elements.name);
        elements.title_container.insertAdjacentText("beforeend", " by ");
        elements.title_container.appendChild(elements.authorDiv);
        elements.front_container.appendChild(elements.title_container);
        elements.front_container.appendChild(elements.desc);
        elements.container.appendChild(elements.front_container);
        elements.end_container.appendChild(elements.categories);
        elements.container.appendChild(elements.end_container);
        elements.li.appendChild(elements.container);

        return elements;
    };
})()
function createListElement(modData: Mod) {
    const {
        li,
        end_container,
        name,
        authorDiv,
        categories,
        desc,
        dlCount,
    } = listElementTemplate();

    try {
        desc.setAttribute("data-text", modData.summary);

        // Add DL Count Element
        dlCount.textContent = formatNumberCompact(modData.downloadCount);

        // Fill content of elements
        name.textContent = modData.name;

        fillAuthorDiv(authorDiv, modData);

        for (const category of modData.categories) {
            // if not "Fabric"
            if (category !== fabric_category_id) {
                categories.appendChild(modCategoryElements[category]());
            }
        }
        desc.textContent = modData.summary;

        end_container.appendChild(createCurseLinkIcon(modData));
        end_container.appendChild(createModrinthLinkIcon(modData));
    } catch (err) {
        console.group();
        console.warn("Failed to fill mod info.");
        console.warn(err);
        console.warn(modData);
        console.groupEnd();
    }

    return li;
}

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
        const categoryReferenceElements = CATEGORIES
            .map(c => {
                const catElem = document.createElement("li");
                catElem.textContent = c.name;
                return catElem;
            });
        return categoryReferenceElements.map((c) => () => c.cloneNode(true));
    })();
})

function getLiHeight() {
    const fmt = (val: string) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);
    return parseInt(fmt(style.getPropertyValue('--item-height'))) + 2;
}

function getLiHeightDetailed() {
    const fmt = (val: string) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);

    return parseInt(fmt(style.getPropertyValue('--item-height'))) + 36 + 8 + 2;
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
}

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
