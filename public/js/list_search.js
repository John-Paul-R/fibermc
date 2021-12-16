
import {
    init, initSearch, initCategoriesSidebar,
    fabric_category_id,
    loader,
    mod_data, setModData,
    CATEGORIES, setCategories,
    resultsListElement, setResultsListElement,
    storeBatches,
    runBatches,
    resetBatches,
    pxAboveTop, pxBelowBottom,
    data_batches as dataBatches,
    batch_containers,
    last_contentful_container_idx,
    first_contentful_container_idx,
    LI_HEIGHT,
    BATCH_SIZE,
    setLiHeight
} from './mod_search_logic.js';
import {
    executeIfWhenDOMContentLoaded, setHidden
} from './util.js';


function createListElement(modData, includeCategories = true) {
    const li = document.createElement('li');

    const container = document.createElement('div');
    const front_container = document.createElement('div');
    const end_container = document.createElement('div');

    const title_container = document.createElement('div');
    const name = document.createElement('a');
    const authorAnchor = document.createElement('a');

    const categories = document.createElement('ul');
    const desc = document.createElement('p');
    const cfButton = document.createElement('a');
    const cfButtonIcon = document.createElement('i');

    let startContainer;
    let dlCount;

    li.setAttribute('class', 'item');
    container.setAttribute('class', 'container');
    front_container.setAttribute('class', 'front_container');
    end_container.setAttribute('class', 'end_container');
    name.setAttribute('class', 'name');
    authorAnchor.setAttribute('class', 'author');
    categories.setAttribute('class', 'item_categories');
    desc.setAttribute('class', 'desc');
    cfButton.setAttribute('class', 'out_link');
    try {
        desc.setAttribute('data-text', modData.summary);


        // Add DL Count Element
        if (true || results_persist) {
            startContainer = document.createElement('div');
            dlCount = document.createElement('p');

            dlCount.setAttribute('class', 'dl_count');
            startContainer.setAttribute('class', 'start_container');

            dlCount.textContent = modData.downloadCount.toLocaleString();
            startContainer.appendChild(dlCount);
            li.appendChild(startContainer)
        }

        // Fill content of elements
        name.textContent = modData.name;

        try {
            const mod_author = modData.authors[0];
            const link_value = `https://www.curseforge.com/members/${mod_author.cf_slug}/projects`;
            authorAnchor.textContent = mod_author.name;
            authorAnchor.setAttribute('href', link_value);
            authorAnchor.setAttribute('target', '_blank');
            authorAnchor.setAttribute('rel', 'noreferrer');
        } catch {
            authorAnchor.innerText = "undefined";
        }


        for (const category of modData.categories) {
            // if not "Fabric"
            if (category !== fabric_category_id) {
                const catElem = document.createElement('li');
                catElem.textContent = CATEGORIES[category].name;
                categories.appendChild(catElem);
            }
        }
        desc.textContent = modData.summary;
        cfButtonIcon.textContent = 'launch'
        cfButtonIcon.setAttribute('class', 'material-icons');
        let cflink = 'https://www.curseforge.com/minecraft/mc-mods/' + modData.cf_slug;
        cfButton.setAttribute('href', cflink);
        cfButton.setAttribute('target', '_blank');
        name.setAttribute('href', cflink);
        name.setAttribute('target', '_blank');
        authorAnchor.setAttribute('rel', 'noreferrer');

        cfButton.appendChild(cfButtonIcon);

    } catch (err) {
        console.group()
        console.warn("Failed to fill mod info.");
        console.warn(err);
        console.warn(modData);
        console.groupEnd();
    }

    // Add elements as children where they belong and return root elem
    title_container.appendChild(name);
    title_container.insertAdjacentText("beforeend", " by ");
    title_container.appendChild(authorAnchor);
    front_container.appendChild(title_container);
    front_container.appendChild(desc);
    container.appendChild(front_container);
    end_container.appendChild(categories);
    end_container.appendChild(cfButton);
    container.appendChild(end_container);
    li.appendChild(container);
    return li;
}

/**
 * 
 * @param {import('./mod_types').Mod} modData 
 * @returns 
 */
function createListElementDetailed(modData) {
    const li = document.createElement('li');

    const front_container = document.createElement('div');
    const end_container = document.createElement('div');

    const title_container = document.createElement('div');
    const name = document.createElement('a');
    const authorAnchor = document.createElement('a');

    const categories = document.createElement('ul');
    const desc = document.createElement('p');
    const cfButton = document.createElement('a');
    const cfButtonIcon = document.createElement('i');

    let botContainer;


    li.classList.add('item');
    li.classList.add('detailed');
    li.classList.add('container');
    front_container.classList.add('front_container');
    end_container.classList.add('end_container');
    name.classList.add('name');
    authorAnchor.classList.add('author');
    categories.classList.add('item_categories');
    desc.classList.add('desc');
    cfButton.classList.add('out_link');

    try {
        botContainer = document.createElement('div');
        let dlCount = document.createElement('div');
        let dateUpdated = document.createElement('div');
        let latestSupportedVers = document.createElement('div');

        dlCount.classList.add('dl_count');
        dateUpdated.classList.add('date_updated');
        latestSupportedVers.classList.add('latest_version');
        botContainer.classList.add('bot_container');

        dlCount.textContent = modData.downloadCount.toLocaleString();
        dateUpdated.textContent = new Date(modData.dateModified).toLocaleDateString();
        latestSupportedVers.textContent = modData.latestMCVersion;

        botContainer.appendChild(dlCount);
        botContainer.appendChild(dateUpdated);
        botContainer.appendChild(latestSupportedVers);


        // Fill content of elements
        name.textContent = modData.name;
        try {
            const mod_author = modData.authors[0];
            const link_value = `https://www.curseforge.com/members/${mod_author.cf_slug}/projects`;
            authorAnchor.textContent = mod_author.name;
            authorAnchor.setAttribute('href', link_value);
            authorAnchor.setAttribute('target', '_blank');
            authorAnchor.setAttribute('rel', 'noreferrer');
        } catch {
            authorAnchor.innerText = "undefined";
        }

        for (const category of modData.categories) {
            // if not "Fabric"
            if (category !== fabric_category_id) {
                const catElem = document.createElement('li');
                catElem.textContent = CATEGORIES[category].name;
                categories.appendChild(catElem);
            }
        }
        desc.textContent = modData.summary;
        cfButtonIcon.textContent = 'launch'
        cfButtonIcon.classList.add('material-icons');
        let cflink = 'https://www.curseforge.com/minecraft/mc-mods/' + modData.cf_slug;
        cfButton.setAttribute('href', cflink);
        cfButton.setAttribute('target', '_blank');

        cfButton.appendChild(cfButtonIcon);
        name.setAttribute('href', cflink);
        name.setAttribute('target', '_blank');
        authorAnchor.setAttribute('href', `https://www.curseforge.com/members/${modData.author}/projects`);
        authorAnchor.setAttribute('target', '_blank');

    } catch (err) {
        console.group()
        console.warn("Failed to fill mod info.");
        console.warn(err);
        console.warn(modData);
        console.groupEnd();
    }

    // Add elements as children where they belong and return root elem
    title_container.appendChild(name);
    title_container.insertAdjacentText("beforeend", " by ");
    title_container.appendChild(authorAnchor);
    front_container.appendChild(title_container);
    front_container.appendChild(desc);
    li.appendChild(front_container);
    end_container.appendChild(categories);
    end_container.appendChild(cfButton);
    li.appendChild(end_container);

    li.appendChild(botContainer);
    return li;
}

// var BATCH_SIZE = 25;
var numElemsBuilt;
var numResults;
var updateLoadbar = () => {
    if (!loadbar_container) {
        return;
    }
    numElemsBuilt = resultsListElement.children.length;
    const percentComplete = numElemsBuilt / numResults * 100;
    loadbar_content.style.width = `calc(${percentComplete}% - 4px`;
    loadbar_text.textContent = `Showing ${numElemsBuilt}/${numResults} mods (${percentComplete.toFixed(0)}%)`;

    if (numElemsBuilt === numResults) {
        setTimeout(() => {
            loadbar_text.textContent = "All mods loaded!";
            hideLoadbar(1000);
        }, 100);
        batchesRemain = false;
    } else {
    }

    console.log("callback!");
}
function hideLoadbar(delay) {
    if (!loadbar_container) {
        return;
    }
    setTimeout(() => {
        gsap.to(loadbar_container, {
            duration: 1,
            opacity: 0
        })
        setTimeout(() => {
            setHidden(loadbar_container);
        }, 1000)
    }, delay);
}
function showLoadbar(delay) {
    if (!loadbar_container) {
        return;
    }
    setTimeout(() => {
        setHidden(loadbar_container);
        setTimeout(() => {
            gsap.to(loadbar_container, {
                duration: 1,
                opacity: 1
            })
        }, 1000)
    }, delay);
}
function buildTableBatched(modsData) {
    var start = performance.now();
    table.scrollTop = 0;
    showLoadbar(0);
    numResults = modsData.length;
    batchesRemain = true;
    numElemsBuilt = 0;
    resetBatches();
    storeBatches(modsData, 0, Math.min(BATCH_SIZE, modsData.length), false);
    runBatches(modsData, 0, -1, 10, updateLoadbar);

    console.log(performance.now() - start);
}
const initialNumBatches = 10;
function buildList(resultsArray) {
    let listBuildTime = performance.now();

    resetBatches();
    storeBatches(resultsArray, 0, Math.min(BATCH_SIZE, resultsArray.length));
    // runBatches(resultsArray, idx, Math.min(BATCH_SIZE, resultsArray.length), -1, 10);//Math.floor(window.innerHeight/40)
    runBatches(resultsArray, 0, -1, initialNumBatches);//Math.floor(window.innerHeight/40)

    listBuildTime = performance.now() - listBuildTime;
    listBuildTimeAvg = (listBuildTimeAvg * (searchCount - 1) + listBuildTime) / searchCount;
    console.log(`List Build - A:${listBuildTimeAvg.toFixed(3)} ms, I:${(listBuildTime).toFixed(3)} ms, numMatches: ${resultsArray.length}`)
}


var listBuildTimeAvg = 0;
var fuzzysortAvg = 0;
var searchCount = 0;
var createBatch = (batchIdx, data_batches) => {
    for (const result_data of data_batches[batchIdx]) {
        try {
            batch_containers[batchIdx].appendChild(currentListCreationFunc(result_data));

        } catch (err) {
            batch_containers[batchIdx].appendChild(document.createElement('li')).setAttribute('class', 'item');

            console.warn(err)
            console.warn(result_data)
        }
    }
}
// var firstLoadedBatchIdx;
var lastLoadedBatchIdx;

var firstElem;
var batchesRemain;
var table;
function lazyLoadBatches() {
    table = document.getElementById("search_results_list");
    firstElem = table.firstChild;
    table.addEventListener('scroll', (e) => {
        // console.log(batch_containers)
        // console.log(last_contentful_container_idx)
        if (batch_containers.length < initialNumBatches)
            return;
        let numPxBelowBot, numPxAboveTop;
        // if (last_contentful_container_idx <= batch_containers.length)
        numPxBelowBot = pxBelowBottom(batch_containers[last_contentful_container_idx]);
        // if (first_contentful_container_idx <= batch_containers.length)
        numPxAboveTop = pxAboveTop(batch_containers[first_contentful_container_idx]);
        let added = 0;
        let addedLessThanDiff = true;

        if (numPxBelowBot < 64) {
            while (addedLessThanDiff) {
                // nextBatchFunc(()=>{
                //     let first = batch_containers[first_contentful_container_idx];
                //     // if (pxToTop(first) < 64)
                //         clearInner(first);
                // });
                if (last_contentful_container_idx + 1 < batch_containers.length) {
                    createBatch(last_contentful_container_idx + 1, dataBatches);
                    clearInner(batch_containers[first_contentful_container_idx]);
                    first_contentful_container_idx += 1;
                    last_contentful_container_idx += 1
                }
                if (added < numPxBelowBot) {
                    addedLessThanDiff = false;
                }
                added -= LI_HEIGHT * BATCH_SIZE;
            }
        } else if (numPxAboveTop < 64) {
            while (addedLessThanDiff) {
                if (first_contentful_container_idx > 0) {
                    createBatch(first_contentful_container_idx - 1, dataBatches);
                    clearInner(batch_containers[last_contentful_container_idx]);

                    first_contentful_container_idx -= 1;
                    last_contentful_container_idx -= 1
                }
                if (added < numPxAboveTop) {
                    addedLessThanDiff = false;
                }
                added -= LI_HEIGHT * BATCH_SIZE;
            }


        }

    }, { passive: true })
}
/**
 * 
 * @param {HTMLElement} node 
 */
function clearInner(node) {
    while (node.hasChildNodes()) {
        clear(node.firstChild);
    }
}
function clear(node) {
    while (node.hasChildNodes()) {
        clear(node.firstChild);
    }
    node.parentNode.removeChild(node);
}
// Logic createListElement, true, LI_HEIGHT, BATCH_SIZE, createBatch
var loadbar_container;
var loadbar_text;
var loadbar_content;

loader.addCompletionFunc(() => {
    loadbar_container = document.getElementById('loadbar_container');
    loadbar_text = document.getElementById("loadbar_text");
    loadbar_content = document.getElementById("loadbar_content");
    const MAX_FAILS = 100;
    let failCount = 0;
    for (const mod of mod_data) {
        try {
            mod.elem = createListElement(mod);
        } catch (err) {
            console.warn(`Could not load elem for mod`)
            // console.warn(mod);
            // console.error(err);
            failCount++;
            if (failCount > MAX_FAILS) {
                break;
            }
        }
    }
});
loader.addCompletionFunc(() => setResultsListElement(document.getElementById("search_results_list")))
function getLiHeight() {
    const fmt = (val) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);
    const pseudoPadding = parseInt(fmt(style.getPropertyValue('--pseudo-padding')));
    const titleFontSize = parseInt(fmt(style.getPropertyValue('--title-font-size')));
    const descFontSize = parseInt(fmt(style.getPropertyValue('--desc-font-size')));
    const descLineCount = parseInt(style.getPropertyValue('--desc-line-count'));
    const borderThickness = parseInt(style.getPropertyValue('--border-thickness'));
    return 2 * pseudoPadding + 2 * borderThickness + titleFontSize + descFontSize * descLineCount;
}
function getLiHeightDetailed() {
    const fmt = (val) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);
    const pseudoPadding = parseInt(fmt(style.getPropertyValue('--pseudo-padding')));
    const titleFontSize = parseInt(fmt(style.getPropertyValue('--title-font-size')));
    const descFontSize = parseInt(fmt(style.getPropertyValue('--desc-font-size')));
    const descLineCount = parseInt(style.getPropertyValue('--desc-line-count'));
    const borderThickness = parseInt(style.getPropertyValue('--border-thickness'));
    return 2 * pseudoPadding + 2 * borderThickness + titleFontSize + descFontSize * descLineCount + 36 + 8;
}

var viewModes = [
    createListElement,
    createListElementDetailed
]
var modeLiHeights = [
    getLiHeight,
    getLiHeightDetailed
]
var currentViewIdx = 0;
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
    updateViewModes();
}
executeIfWhenDOMContentLoaded(() => {
    document.getElementById("list_view_cycle_button").addEventListener('click', cycleListViewModes);
})

loader.addCompletionFunc(() => {

    initSearch({
        results_persist: true,
        // listElemCreationFunc: createListElement,
        batchCreationFunc: createBatch,
        // listCreationFunc: buildList,
        lazyLoadBatches: true,
        batch_size: 20,
        li_height: getLiHeightDetailed(),
    })
    updateViewModes();
});
loader.addCompletionFunc(() => console.log(getLiHeightDetailed()));
init();
