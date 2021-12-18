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

import { Mod, Author } from "./mod_types.js";

function createListElement(modData: Mod) {
    const tr = document.createElement("tr");
    tr.setAttribute("class", "mod_row");

    const name = document.createElement("td");
    const name_link = document.createElement("a");
    name_link.textContent = modData.name;
    let cflink =
        "https://www.curseforge.com/minecraft/mc-mods/" + modData.cf_slug;
    name_link.setAttribute("href", cflink);
    name_link.setAttribute("target", "_blank");
    name_link.setAttribute("rel", "noreferrer");
    name.appendChild(name_link);

    const links = document.createElement("td");
    links.classList.add("table_mod_links");
    {
        const cfAnchor = document.createElement("a");
        const cfAnchorIcon = document.createElement("div");
        if (modData.cf_slug) {
            const cflink =
                "https://www.curseforge.com/minecraft/mc-mods/" +
                modData.cf_slug;
            cfAnchor.setAttribute("href", cflink);
            cfAnchor.setAttribute("target", "_blank");
        } else {
            cfAnchor.classList.add("filter-grey");
            cfAnchor.title = `No CurseForge link found for ${modData.name}.`;
        }
        cfAnchor.classList.add("icon_button");
        cfAnchorIcon.classList.add("cf_icon");
        cfAnchorIcon.classList.add("icon_dark"); // for multi-pallete-js
        cfAnchor.appendChild(cfAnchorIcon);
        links.appendChild(cfAnchor);

        const mrAnchor = document.createElement("a");
        const mrAnchorIcon = document.createElement("div");
        if (modData.mr_slug) {
            const mrLink = "https://modrinth.com/mod/" + modData.mr_slug;
            mrAnchor.setAttribute("href", mrLink);
            mrAnchor.setAttribute("target", "_blank");
        } else {
            mrAnchor.classList.add("filter-grey");
            mrAnchor.title = `No Modrinth link found for ${modData.name}.`;
        }
        mrAnchor.classList.add("icon_button");
        mrAnchorIcon.classList.add("mr_icon");
        mrAnchor.appendChild(mrAnchorIcon);
        links.appendChild(mrAnchor);
    }

    const desc = document.createElement("td");
    desc.textContent = modData.summary;

    const authorCell = document.createElement("td");
    try {
        const authorAnchor = document.createElement("a");
        const mod_author = modData.authors[0];
        const link_value = `https://www.curseforge.com/members/${mod_author.cf_slug}/projects`;
        authorAnchor.textContent = mod_author.name;
        authorAnchor.setAttribute("href", link_value);
        authorAnchor.setAttribute("target", "_blank");
        authorAnchor.setAttribute("rel", "noreferrer");
        authorCell.appendChild(authorAnchor);
    } catch {
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
    // Fill content of elements
    //cfButtonIcon.textContent = 'launch'
    //cfButtonIcon.setAttribute('class', 'material-icons');
    //cfButton.setAttribute('href', cflink);
    //cfButton.setAttribute('target', '_blank');

    //cfButton.appendChild(cfButtonIcon);

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
        doneCount / remainingCount
    ).toFixed(0)}%)`;
};
var updateLoadbar = () => {
    numElemsBuilt = resultsListElement.children.length;
    const percentComplete = (numElemsBuilt / numResults) * 100;
    loadbar.setLoadedPercent(percentComplete);
    loadbar.setText(getLoadbarText(numElemsBuilt, numResults));

    if (numElemsBuilt === numResults) {
        batchesRemain = false;
    }

    console.log("updateLoadbar!");
};

function buildTableBatched(modsData: Mod[]) {
    var start = performance.now();
    table.scrollTop = 0;
    // loadbar.setLoadedPercent(0);
    // loadbar.setText(getLoadbarText(numElemsBuilt, numResults));
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

const getElementById = (id: string) => {
    const elem = document.getElementById(id);
    if (!elem) {
        throw new Error(`Could not find elemnt with id ${id}`);
    }
    return elem;
};
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

// Logic createListElement, true, LI_HEIGHT, BATCH_SIZE, createBatch
var loadbar: LoadbarResult;
type ModWithElem = Mod & {
    elem: HTMLTableRowElement;
};

loader.addCompletionFunc(() => {
    loadbar = createLoadbar({
        parentElement: getElementById("loadbar_container"),
    });

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
