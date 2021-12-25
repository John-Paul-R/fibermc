import {
    init,
    initSearch,
    initCategoriesSidebar,
    fabric_category_id,
    loader,
    mod_data,
    setModData,
    CATEGORIES,
    setCategories,
    resultsListElement,
    setResultsListElement,
    storeBatches,
    runBatches,
    resetBatches,
    pxAboveTop,
    pxBelowBottom,
    data_batches as dataBatches,
    batch_containers,
    last_contentful_container_idx,
    first_contentful_container_idx,
    LI_HEIGHT,
    BATCH_SIZE,
    setLiHeight,
} from "./mod_search_logic.js";
import {
    executeIfWhenDOMContentLoaded,
    getElementById,
    setHidden,
} from "./util.js";
import {
    createCurseAuthorIcon,
    createCurseLinkIcon,
    createModrinthAuthorIcon,
    createModrinthLinkIcon,
} from "./platform_links.js";
import { getCurseAuthorUrl, Mod } from "./mod_types.js";
import { LoadbarResult } from "./loadbar.js";

function createListElement(modData: Mod, includeCategories = true) {
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

        try {
            const mod_author = modData.authors[0];
            const nameSpan = document.createElement("span");
            nameSpan.textContent = mod_author.name;
            authorDiv.appendChild(nameSpan);
            authorDiv.appendChild(createCurseAuthorIcon(mod_author));
            authorDiv.appendChild(createModrinthAuthorIcon(mod_author));
        } catch {
            authorDiv.innerText = "undefined";
        }

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
    } catch (err) {
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
        try {
            const mod_author = modData.authors[0];
            const nameSpan = document.createElement("span");
            nameSpan.textContent = mod_author.name;
            authorDiv.appendChild(nameSpan);
            authorDiv.appendChild(createCurseAuthorIcon(mod_author));
            authorDiv.appendChild(createModrinthAuthorIcon(mod_author));
        } catch {
            authorDiv.innerText = "undefined";
        }

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

// var BATCH_SIZE = 25;
var numElemsBuilt;
var numResults: number;

function buildTableBatched(modsData: Mod[]) {
    var start = performance.now();
    table.scrollTop = 0;
    // showLoadbar(0);
    numResults = modsData.length;
    batchesRemain = true;
    numElemsBuilt = 0;
    resetBatches();
    storeBatches(modsData, 0, Math.min(BATCH_SIZE, modsData.length), false);
    runBatches(modsData, 0, -1, 10, () => {});

    console.log(performance.now() - start);
}
const initialNumBatches = 10;
function buildList(resultsArray: Mod[]) {
    let listBuildTime = performance.now();

    resetBatches();
    storeBatches(resultsArray, 0, Math.min(BATCH_SIZE, resultsArray.length));
    // runBatches(resultsArray, idx, Math.min(BATCH_SIZE, resultsArray.length), -1, 10);//Math.floor(window.innerHeight/40)
    runBatches(resultsArray, 0, -1, initialNumBatches); //Math.floor(window.innerHeight/40)

    listBuildTime = performance.now() - listBuildTime;
    listBuildTimeAvg =
        (listBuildTimeAvg * (searchCount - 1) + listBuildTime) / searchCount;
    console.log(
        `List Build - A:${listBuildTimeAvg.toFixed(
            3
        )} ms, I:${listBuildTime.toFixed(3)} ms, numMatches: ${
            resultsArray.length
        }`
    );
}

var listBuildTimeAvg = 0;
var fuzzysortAvg = 0;
var searchCount = 0;
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
// var firstLoadedBatchIdx;
var lastLoadedBatchIdx;

var firstElem;
var batchesRemain;
var table: HTMLElement;

// Logic createListElement, true, LI_HEIGHT, BATCH_SIZE, createBatch
var loadbar_container;
var loadbar_text;
var loadbar_content;
type ModWithElem = Mod & {
    elem: HTMLElement;
};

loader.addCompletionFunc(() => {
    loadbar_container = document.getElementById("loadbar_container");
    loadbar_text = document.getElementById("loadbar_text");
    loadbar_content = document.getElementById("loadbar_content");
    const MAX_FAILS = 100;
    let failCount = 0;
    for (const mod of mod_data as ModWithElem[]) {
        try {
            mod.elem = createListElement(mod);
        } catch (err) {
            console.warn(`Could not load elem for mod`);
            // console.warn(mod);
            // console.error(err);
            failCount++;
            if (failCount > MAX_FAILS) {
                break;
            }
        }
    }
});
loader.addCompletionFunc(() =>
    setResultsListElement(getElementById("search_results_list"))
);
function getLiHeight() {
    const fmt = (val: string) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);
    const pseudoPadding = parseInt(
        fmt(style.getPropertyValue("--pseudo-padding"))
    );
    const titleFontSize = parseInt(
        fmt(style.getPropertyValue("--title-font-size"))
    );
    const descFontSize = parseInt(
        fmt(style.getPropertyValue("--desc-font-size"))
    );
    const descLineCount = parseInt(style.getPropertyValue("--desc-line-count"));
    const borderThickness = parseInt(
        style.getPropertyValue("--border-thickness")
    );
    return (
        2 * pseudoPadding +
        2 * borderThickness +
        titleFontSize +
        descFontSize * descLineCount
    );
}
function getLiHeightDetailed() {
    const fmt = (val: string) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);
    const pseudoPadding = parseInt(
        fmt(style.getPropertyValue("--pseudo-padding"))
    );
    const titleFontSize = parseInt(
        fmt(style.getPropertyValue("--title-font-size"))
    );
    const descFontSize = parseInt(
        fmt(style.getPropertyValue("--desc-font-size"))
    );
    const descLineCount = parseInt(style.getPropertyValue("--desc-line-count"));
    const borderThickness = parseInt(
        style.getPropertyValue("--border-thickness")
    );
    return (
        2 * pseudoPadding +
        2 * borderThickness +
        titleFontSize +
        descFontSize * descLineCount +
        36 +
        8
    );
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
executeIfWhenDOMContentLoaded(() => {
    getElementById("list_view_cycle_button").addEventListener(
        "click",
        cycleListViewModes
    );
});

loader.addCompletionFunc(() => {
    initSearch({
        results_persist: true,
        // listElemCreationFunc: createListElement,
        batchCreationFunc: createBatch,
        // listCreationFunc: buildList,
        lazyLoadBatches: true,
        batch_size: 20,
        li_height: getLiHeightDetailed(),
    });
    updateViewModes();
});
loader.addCompletionFunc(() => console.log(getLiHeightDetailed()));
init();
