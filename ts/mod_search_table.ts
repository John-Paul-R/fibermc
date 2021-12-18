import { createLoadbar, LoadbarResult } from "./loadbar.js";
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
} from "./mod_search_logic.js";
import { getElementById } from "./util.js";
import {
    Mod,
    Author,
    getModrinthModUrl,
    getCurseModUrl,
    getModrinthAuthorUrl,
    getCurseAuthorUrl,
} from "./mod_types.js";
import {
    createCurseLinkIcon,
    createModrinthLinkIcon,
} from "./platform_links.js";

function createListElement(modData: Mod) {
    const tr = document.createElement("tr");
    tr.setAttribute("class", "mod_row");

    const name = document.createElement("td");
    const name_link = document.createElement("a");
    name_link.textContent = modData.name;
    name.appendChild(name_link);

    const links = document.createElement("td");
    links.classList.add("table_mod_links");
    links.appendChild(createCurseLinkIcon(modData));
    links.appendChild(createModrinthLinkIcon(modData));

    const desc = document.createElement("td");
    desc.textContent = modData.summary;

    const authorCell = document.createElement("td");

    const mod_author = modData.authors[0];
    if (mod_author) {
        const authorAnchor = document.createElement("a");
        const link_value = mod_author.mr_slug
            ? getModrinthAuthorUrl(mod_author.mr_slug)
            : mod_author.cf_slug
            ? getCurseAuthorUrl(mod_author.cf_slug)
            : undefined;
        authorAnchor.textContent = mod_author.name;
        if (link_value) {
            authorAnchor.setAttribute("href", link_value);
            authorAnchor.setAttribute("target", "_blank");
            authorAnchor.setAttribute("rel", "noreferrer");
        }
        authorCell.appendChild(authorAnchor);
    } else {
        authorCell.innerText = "undefined";
    }

    const categories = document.createElement("td");
    categories.setAttribute("class", "item_categories");
    for (const category of modData.categories) {
        // if not "Fabric"
        if (category !== fabric_category_id) {
            const catElem = document.createElement("li");
            catElem.textContent = CATEGORIES[category].name;
            categories.appendChild(catElem);
        }
    }

    const dlCount = document.createElement("td");
    dlCount.textContent = modData.downloadCount.toLocaleString();

    const versions = document.createElement("td");
    versions.textContent = modData["latestMCVersion"];
    const last_updated = document.createElement("td");
    const last_updated_date = new Date(modData.dateModified);
    last_updated.textContent = last_updated_date.toLocaleDateString();

    // Add elements as children where they belong and return root elem
    tr.appendChild(name);
    tr.appendChild(links);
    tr.appendChild(desc);
    tr.appendChild(authorCell);
    tr.appendChild(categories);
    tr.appendChild(dlCount);
    tr.appendChild(versions);
    tr.appendChild(last_updated);

    return tr;
}

function buildTable(modsData: Mod[]) {
    var start = performance.now();
    for (const mod of modsData) {
        resultsListElement.appendChild(createListElement(mod));
    }
    console.log(performance.now() - start);
}

var BATCH_SIZE = 25;
var numElemsBuilt: number;
var numResults: number;
const getLoadbarText = (doneCount: number, remainingCount: number) => {
    return `Showing ${doneCount}/${remainingCount} mods (${(
        (doneCount / remainingCount) *
        100
    ).toFixed(0)}%)`;
};
var updateLoadbar = () => {
    numElemsBuilt = resultsListElement.children.length;
    loadbar.setLoadedPercent(numElemsBuilt / numResults);
    loadbar.setText(getLoadbarText(numElemsBuilt, numResults));

    if (numElemsBuilt === numResults) {
        batchesRemain = false;
    }

    console.log("updateLoadbar!");
};

function buildTableBatched(modsData: Mod[]) {
    var start = performance.now();
    table.scrollTop = 0;
    numResults = modsData.length;
    batchesRemain = true;
    numElemsBuilt = 0;
    resetBatches();
    storeBatches(modsData, 0, Math.min(BATCH_SIZE, modsData.length), false);
    runBatches(modsData, 0, -1, 10, updateLoadbar);

    console.log(performance.now() - start);
}

var createBatch = (batchIdx: number, data_batches: Mod[][]) => {
    for (const result_data of data_batches[batchIdx] as ModWithElem[]) {
        // setHidden(result_data.elem, false);
        if (result_data.elem) resultsListElement.appendChild(result_data.elem);
    }
    lastLoadedBatchIdx = batchIdx;
    if (batchIdx == data_batches.length - 1) {
        batchesRemain = false;
    }
};
// var firstLoadedBatchIdx;
var lastLoadedBatchIdx: number;

var firstElem;
var batchesRemain: boolean;
var table: HTMLElement;

function lazyLoadBatches() {
    table = getElementById("search_results_list");
    firstElem = table.firstChild;
    table.addEventListener(
        "scroll",
        (e) => {
            let numPxBelowBot = pxBelowBottom(
                resultsListElement.lastChild as HTMLElement,
                table
            );
            // const numPxAboveTop = pxAboveTop(firstElem);
            if (numPxBelowBot < 1024) {
                while (numPxBelowBot < 4096 && batchesRemain) {
                    createBatch(lastLoadedBatchIdx + 1, dataBatches);
                    // clearInner(batch_containers[first_contentful_container_idx]);
                    numPxBelowBot = pxBelowBottom(
                        resultsListElement.lastChild as HTMLElement,
                        table
                    );
                    updateLoadbar();
                }
            } //else if (numPxAboveTop < 64) {
            //     while (addedLessThanDiff){
            //         if (first_contentful_container_idx > 0){
            //             createBatch(first_contentful_container_idx-1, data_batches);
            //             clearInner(batch_containers[last_contentful_container_idx]);

            //             first_contentful_container_idx-=1;
            //             last_contentful_container_idx-=1
            //         }
            //         if (added < numPxAboveTop) {
            //             addedLessThanDiff = false;
            //         }
            //         added -= LI_HEIGHT*BATCH_SIZE;
            //     }
            // }
        },
        { passive: true }
    );
}

var loadbar: LoadbarResult;
type ModWithElem = Mod & {
    elem: HTMLTableRowElement;
};

loader.addCompletionFunc(() => {
    loadbar = createLoadbar({
        parentElement: getElementById("content_main"),
        hideOnComplete: true,
    });

    const MAX_FAILS = 100;
    let failCount = 0;
    for (const mod of mod_data as ModWithElem[]) {
        try {
            mod.elem = createListElement(mod);
        } catch (err) {
            console.warn(`Could not load elem for mod`, mod);
            failCount++;
            if (failCount > MAX_FAILS) {
                break;
            }
        }
    }
});
loader.addCompletionFunc(() =>
    setResultsListElement(getElementById("search_results_content"))
);
loader.addCompletionFunc(() =>
    initSearch({
        results_persist: true,
        listElemCreationFunc: createListElement,
        batchCreationFunc: createBatch,
        listCreationFunc: buildTableBatched,
        lazyLoadBatches: lazyLoadBatches,
        batch_size: BATCH_SIZE,
    })
);

init();
