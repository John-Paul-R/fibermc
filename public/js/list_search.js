var _a;
import { init, initSearch, fabric_category_id, loader, mod_data, CATEGORIES, resultsListElement, setResultsListElement, batch_containers, setLiHeight, } from "./mod_search_logic.js";
import { executeIfWhenDOMContentLoaded, getElementById } from "./util.js";
import { createCurseAuthorIcon, createCurseLinkIcon, createModrinthAuthorIcon, createModrinthLinkIcon, } from "./platform_links.js";
var authorListPopup = (function createAuthorListDiv() {
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("hidden");
    contentDiv.classList.add("item_author_list");
    document.body.appendChild(contentDiv);
    return contentDiv;
})();
/**
 *
 * @param {HTMLElement} node
 */
function clearChildren(node) {
    while (node.hasChildNodes()) {
        node.removeChild(node.firstChild);
    }
}
function showAuthorList(listDiv, authors, x, y, triggeringElement, triggeringListener) {
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
    listDiv.classList.remove("hidden");
    triggeringElement.removeEventListener("pointerover", triggeringListener);
    listDiv.addEventListener("pointerleave", (e) => {
        listDiv.classList.add("hidden");
        triggeringElement.addEventListener("pointerover", triggeringListener);
    }, { once: true });
}
function fillAuthorDiv(authorDiv, modData) {
    if (modData.authors && modData.authors.length > 0) {
        if (modData.authors.length === 1) {
            const mod_author = modData.authors[0];
            const nameSpan = document.createElement("span");
            nameSpan.textContent = mod_author.name;
            authorDiv.appendChild(nameSpan);
            authorDiv.appendChild(createCurseAuthorIcon(mod_author));
            authorDiv.appendChild(createModrinthAuthorIcon(mod_author));
        }
        else {
            authorDiv.textContent = "Several People...";
            const hoverListener = (e) => {
                const textRect = e.target.getBoundingClientRect();
                showAuthorList(authorListPopup, modData.authors, textRect.x, textRect.y, authorDiv, hoverListener);
            };
            authorDiv.addEventListener("pointerover", hoverListener);
        }
    }
    else {
        authorDiv.innerText = "undefined";
    }
}
function createListElement(modData, includeCategories = true) {
    const li = document.createElement("li");
    const container = document.createElement("div");
    const front_container = document.createElement("div");
    const end_container = document.createElement("div");
    const title_container = document.createElement("div");
    const name = document.createElement("a");
    const authorDiv = document.createElement("div");
    authorDiv.setAttribute("class", "author");
    const categories = document.createElement("ul");
    const desc = document.createElement("p");
    let startContainer;
    let dlCount;
    li.setAttribute("class", "item");
    container.setAttribute("class", "container");
    front_container.setAttribute("class", "front_container");
    end_container.setAttribute("class", "end_container");
    name.setAttribute("class", "name");
    categories.setAttribute("class", "item_categories");
    desc.setAttribute("class", "desc");
    try {
        desc.setAttribute("data-text", modData.summary);
        // Add DL Count Element
        startContainer = document.createElement("div");
        dlCount = document.createElement("p");
        dlCount.setAttribute("class", "dl_count");
        startContainer.setAttribute("class", "start_container");
        dlCount.textContent = modData.downloadCount.toLocaleString();
        startContainer.appendChild(dlCount);
        li.appendChild(startContainer);
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
    }
    catch (err) {
        console.group();
        console.warn("Failed to fill mod info.");
        console.warn(err);
        console.warn(modData);
        console.groupEnd();
    }
    // Add elements as children where they belong and return root elem
    title_container.appendChild(name);
    title_container.insertAdjacentText("beforeend", " by ");
    title_container.appendChild(authorDiv);
    front_container.appendChild(title_container);
    front_container.appendChild(desc);
    container.appendChild(front_container);
    end_container.appendChild(categories);
    container.appendChild(end_container);
    li.appendChild(container);
    return li;
}
function createListElementDetailed(modData) {
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
        dateUpdated.textContent = new Date(modData.dateModified).toLocaleDateString();
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
    }
    catch (err) {
        console.group();
        console.warn("Failed to fill mod info.");
        console.warn(err);
        console.warn(modData);
        console.groupEnd();
    }
    return li;
}
var createBatch = (batchIdx, data_batches) => {
    for (const result_data of data_batches[batchIdx]) {
        try {
            batch_containers[batchIdx].appendChild(currentListCreationFunc(result_data));
        }
        catch (err) {
            batch_containers[batchIdx]
                .appendChild(document.createElement("li"))
                .setAttribute("class", "item");
            console.warn(err);
            console.warn(result_data);
        }
    }
};
loader.addCompletionFunc(() => {
    const MAX_FAILS = 100;
    let failCount = 0;
    for (const mod of mod_data) {
        try {
            mod.elem = createListElement(mod);
        }
        catch (err) {
            console.warn(`Could not load elem for mod`);
            failCount++;
            if (failCount > MAX_FAILS) {
                break;
            }
        }
    }
});
loader.addCompletionFunc(() => setResultsListElement(getElementById("search_results_list")));
function getLiHeight() {
    const fmt = (val) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);
    const pseudoPadding = parseInt(fmt(style.getPropertyValue("--pseudo-padding")));
    const titleFontSize = parseInt(fmt(style.getPropertyValue("--title-font-size")));
    const descFontSize = parseInt(fmt(style.getPropertyValue("--desc-font-size")));
    const descLineCount = parseInt(style.getPropertyValue("--desc-line-count"));
    const borderThickness = parseInt(style.getPropertyValue("--border-thickness"));
    return (2 * pseudoPadding +
        2 * borderThickness +
        titleFontSize +
        descFontSize * descLineCount);
}
function getLiHeightDetailed() {
    const fmt = (val) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);
    const pseudoPadding = parseInt(fmt(style.getPropertyValue("--pseudo-padding")));
    const titleFontSize = parseInt(fmt(style.getPropertyValue("--title-font-size")));
    const descFontSize = parseInt(fmt(style.getPropertyValue("--desc-font-size")));
    const descLineCount = parseInt(style.getPropertyValue("--desc-line-count"));
    const borderThickness = parseInt(style.getPropertyValue("--border-thickness"));
    return (2 * pseudoPadding +
        2 * borderThickness +
        titleFontSize +
        descFontSize * descLineCount +
        36 +
        8);
}
var viewModes = [createListElement, createListElementDetailed];
var modeLiHeights = [getLiHeight, getLiHeightDetailed];
const CURRENT_LIST_VIEW_IDX_STORAGE_KEY = "currentListViewIdx";
var currentViewIdx = (_a = Number(window.localStorage.getItem(CURRENT_LIST_VIEW_IDX_STORAGE_KEY))) !== null && _a !== void 0 ? _a : 0;
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
    window.localStorage.setItem(CURRENT_LIST_VIEW_IDX_STORAGE_KEY, currentViewIdx.toString());
    updateViewModes();
}
executeIfWhenDOMContentLoaded(() => {
    getElementById("list_view_cycle_button").addEventListener("click", cycleListViewModes);
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
//# sourceMappingURL=list_search.js.map