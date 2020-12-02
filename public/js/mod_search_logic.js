import {
    executeIfWhenDOMContentLoaded, setHidden
} from './util.js';
import { AsyncDataResourceLoader } from './resource_loader.js';

export { 
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
    data_batches
};

//==============
// DATA LOADING
//==============
// Load mod data from external file
var loader = new AsyncDataResourceLoader({
    completionWaitForDCL: true
}).addResource('../data/mod_list.min.json', [
        (jsonData) => { 
            setModData(jsonData.mods);
            // Sort func
            const descending = (a, b) => (b.downloadCount - a.downloadCount);
            mod_data.sort(descending);
            console.log(mod_data);

            setCategories(jsonData.categories);
            initCategoriesSidebar();
            console.log(CATEGORIES);
        }
    ])

function init() {

    loader
        .addCompletionFunc(
            ()=>{
                searchTextChanged({target: {value: false} });
                console.log('mod_data loaded. Running empty search.');
            }
        )
        .fetchResources();
}

// Data loaded from resource loader
/**
 * @type {Array<Object>}
 */
var mod_data;
function setModData(n_mod_data) {
    mod_data = n_mod_data;
}
/**
 * @type {Array<Object>}
 */
var CATEGORIES;
function setCategories(n_categories) {
    CATEGORIES = n_categories;
}

//====================
// Filter Search Data
//====================
function getSelectedCategoryIds() {
    let selected_cat_ids = []
    for (const category of CATEGORIES) {
        const cat_elem = category.htmlElement;
        if (cat_elem.selected) {
            selected_cat_ids.push(cat_elem.cat_id);
        }
    }
    return selected_cat_ids;
}
// Apply filter to search data (based on user selections)
function getFilteredList() {
    const selected_cat_ids = getSelectedCategoryIds();

    let search_objs = mod_data;
    if (selected_cat_ids.length === 0) {
        
    } else {
        // Include only mods from selected categories
        search_objs = mod_data.filter(el => {
            for (const cat_id of selected_cat_ids) {
                if (el.categories.includes(cat_id)) {
                    return true;
                }
            }
            return false;
        });
    }
    return search_objs;
}
var fabric_category_id;
var categories_sidebar_elem;
function initCategoriesSidebar() {
    //TODO Group "Selected" items?
    //TODO "select multiple" toggle
    //TODO Option to sort categories by name or by num mods in category
    //TODO Display "searching in these categories" under searchbar. With option to click them to remove.

    categories_sidebar_elem = document.getElementById('categories_list');
    for (let i=0; i<CATEGORIES.length; i++) {
        if (CATEGORIES[i].name.toUpperCase() === "FABRIC") {
            fabric_category_id = i;
            break;
        }
    }
    updateModCounts();
    // TODO Restructure this, jfc
    for (let i=0; i<CATEGORIES.length; i++) {
        const cat_elem = document.createElement('li');
        CATEGORIES[i].htmlElement = cat_elem;
        cat_elem.cat_id = i;//category.categoryId;
    }
    const sorted_CATEGORIES = CATEGORIES.slice().sort(function (a, b) {
        return b.modCount-a.modCount;
      });
    for (let i=0; i<sorted_CATEGORIES.length; i++) {
        const category = sorted_CATEGORIES[i];
        const cat_elem = category.htmlElement;
        const cat_count = document.createElement('span');
        cat_elem.selected = false;
        cat_elem.textContent = category.name+' '
        cat_elem.appendChild(cat_count);
        cat_count.textContent = category.modCount;
        applySelected(cat_elem);
        cat_elem.addEventListener('click', onClick);
        categories_sidebar_elem.appendChild(cat_elem);
    }


    function onClick(e) {
        const cat_elem = e.target;
        cat_elem.selected = !cat_elem.selected;
        applySelected(cat_elem);
        searchTextChanged();
        
    }
    function applySelected(cat_elem) {
        if (cat_elem.selected) {
            cat_elem.style.border = '2px solid var(--color-accent-1)';
        } else {
            cat_elem.style=null;//.border = '2px solid var(--color-element-1-1)';
        }
    }
}
//==============
// Search Logic
//==============
// Performance monitoring vars
var fuzzysortAvg = 0;
var searchCount = 0;
/**
 * 
 * @param {string} queryText 
 * @param {boolean} selectBest
 * 
 * @returns {Array<Object>} 
 */
function search(queryText, search_objects, selectBest=false) {
    console.info("Search Query: " + queryText)
    // let objects = mod_data.map(el => { return {
    //     name: el.name,
    //     slug: el.slug,
    // }; });
    var fuzzysortStart = performance.now();

    let results = fuzzysort.go(queryText.trim(), search_objects, {
        keys: ['name', 'slug'],
        allowTypo: true,
        threshold: -500,
        // Create a custom combined score to sort by. -100 to the desc score makes it a worse match
        scoreFn: (a) => Math.max(
            a[0]?a[0].score:-1000,
            a[1]?a[1].score-50:-1000,
        )
    });

    // Performance logging
    var fuzzysortTime = performance.now() - fuzzysortStart;
    searchCount += 1;
    fuzzysortAvg = (fuzzysortAvg * (searchCount - 1) + fuzzysortTime) / searchCount;
    console.log(`fuzzysort.js - A:${fuzzysortAvg.toFixed(3)} ms, I:${(fuzzysortTime).toFixed(3)} ms, found: "${results[0] ? results[0].obj.name : ""}", numMatches: ${results.length}`)

    // let bestResult = results[0]

    return results;
}

//================
// Input Handling
//================
function searchTextChanged(queryEvent) {
    let results = null;
    const search_objects = getFilteredList();
    if (queryEvent && queryEvent.target.value){
        results = search(queryEvent.target.value, search_objects).map((el) => el.obj);
        console.log(queryEvent.target.value);
    } else {
        console.log("No query data was found.")
        // If ALL mods should be shown in the even the search query was empty
        // (Ex: if the page, by default, is a mod list, not a separate page w/ a
        // search overlay)
        if (results_persist) {
            results = search_objects;
        }
    }
    updateSearchResultsListElement(results);
    // queryDisplayElement.innerText = query.target.value;
}

//=======
// Other
//=======
// Update the stored counts of mods per category
// TODO (Move this to backend?)
function updateModCounts() {
    for (const CAT of CATEGORIES) {
        CAT.modCount = 0;
    }
    for (const mod of mod_data) {
        for(const cat_id of mod.categories) {
            CATEGORIES[cat_id].modCount += 1;
        }
    }
}

function updateSearchResultsListElement(resultsArray) {
    while (resultsListElement.children.length > 0) {
        resultsListElement.removeChild(resultsListElement.lastChild);
    }
    const elems = resultsListElement.children;
    // for (let i = 1; i < elems.length; i++) {
    //     setHidden(elems[i], true);
    // }
    if (resultsArray) {
        setHidden(resultsListElement, false);
    
        buildList(resultsArray);
    } else {
        setHidden(resultsListElement, true);
    }
    if (results_persist) {
        resultsListElement.scrollTop = 0;
    }
}

//======
// Init
//======
var buildList;
var createBatch;
var createListElement;
var searchHTMLElements;
/**
 * @type {HTMLElement}
 */
var resultsListElement;
function setResultsListElement(elem) {
    resultsListElement = elem;
}
var queryDisplayElement;
var results_persist = false;
var LI_HEIGHT, BATCH_SIZE;
/**
 * 
 * @param {Object}      options 
 * @param {boolean}     options.results_persist
 * @param {number}      options.li_height
 * @param {number}      options.batch_size
 * @param {Function}    options.listElemCreationFunc
 * @param {Function}    options.batchCreationFunc
 * @param {Function}    options.listCreationFunc
 * @param {boolean}     options.lazyLoadBatches
 */
function initSearch(options) {
    results_persist=options.results_persist;
    LI_HEIGHT = options.li_height;
    BATCH_SIZE = options.batch_size;
    function resultsViewBuilder(options) {
        var defaultOptions;
        //if (!options) {
            defaultOptions = {
                results_persist: false,
                li_height: 64,
                batch_size: 20,
                listElemCreationFunc: null,
                batchCreationFunc: null,
                listCreationFunc: null,
                lazyLoadBatches: true,
            }
        //}

        if (options.listElemCreationFunc) {
            createListElement = options.listElemCreationFunc;
        } else {
            console.error("Error: No mod list-element creation function supplied to function 'initSearch'");
        }

        if (options.batchCreationFunc) {
            createBatch = options.batchCreationFunc;
        } else {
            createBatch = (batchIdx, data_batches) => {
                for (const result_data of data_batches[batchIdx]) {
                    batch_containers[batchIdx].appendChild(createListElement(result_data));
                }
            };
        }

        if (options.listCreationFunc) {
            buildList = options.listCreationFunc;
        } else {
            buildList = buildListBatches;
            console.warn("No list creation function supplied. Falling back to default.")
        }
        
        if (options.lazyLoadBatches) {
            if (options.lazyLoadBatches === true) {
                resultsListElement.addEventListener('scroll', (e)=> {
                    const numPxBelowBot = pxBelowBottom(batch_containers[last_contentful_container_idx]);
                    const numPxAboveTop = pxAboveTop(batch_containers[first_contentful_container_idx]);
                    let added = 0;
                    let addedLessThanDiff = true;
                    
                    if (numPxBelowBot < 64) {
                        while (addedLessThanDiff){
                            if (last_contentful_container_idx+1 < batch_containers.length) {
                                createBatch(last_contentful_container_idx+1, data_batches);
                                clearInner(batch_containers[first_contentful_container_idx]);
                                first_contentful_container_idx+=1;
                                last_contentful_container_idx+=1
                            }
                            if (added < numPxBelowBot) {
                                addedLessThanDiff = false;
                            }
                            added -= LI_HEIGHT*BATCH_SIZE;
                        }
                    } else if (numPxAboveTop < 64) {
                        while (addedLessThanDiff){
                            if (first_contentful_container_idx > 0){
                                createBatch(first_contentful_container_idx-1, data_batches);
                                clearInner(batch_containers[last_contentful_container_idx]);
                
                                first_contentful_container_idx-=1;
                                last_contentful_container_idx-=1
                            }
                            if (added < numPxAboveTop) {
                                addedLessThanDiff = false;
                            }
                            added -= LI_HEIGHT*BATCH_SIZE;
                        }
                    }
                }, {passive: true})    
            } else {
                options.lazyLoadBatches();
            }
        }
    
    }
    resultsViewBuilder(options);
    // searchElements = document.getElementsByClassName("searchField");
    searchHTMLElements = [];//Array.from(searchElements);
    searchHTMLElements.push(document.getElementById("search_input"));
    
    for (let i=0; i<searchHTMLElements.length; i++) {
        searchHTMLElements[i].addEventListener('input', (e)=>setTimeout(searchTextChanged, 0, e, ));
        searchHTMLElements[i].addEventListener('keydown', (e) => {
            
            if (e.key === "Enter") {
                search(e.target.value, true);
            }
        });
        // console.info(searchElements[i], " will now listen for input events and trigger searchAtlas.");
    }
    resultsListElement = resultsListElement || document.getElementById("search_results_list");
    if (resultsListElement.className.includes('persist')) {
        results_persist = true;
    }

    // Add Stylesheet 
    var sheet = createStyleSheet('mod-list-constructed');
    sheet.insertRule(`ul#search_results_list {
        max-width: 900px;
        width: 900px;
    }`, 0)
    // sheet.insertRule(`.item_batch {
    //     height: ${LI_HEIGHT*BATCH_SIZE}px;
    // }`)
    console.log(sheet.cssRules);
    queryDisplayElement = document.getElementById("search_query_text");
    console.info("atlas_search.js initialization complete!");
}

//======
// Util
//======
var listBuildTimeAvg = 0;
var nextBatchFunc;
var data_batches;
var batch_containers;
var first_contentful_container_idx;
var last_contentful_container_idx;
const storeBatches = (results, startIdx, batchSize, useContainers=true) => {
    const endIdx = startIdx + batchSize;
    const data_batch = [];
    if (useContainers) {
        const batch_container = document.createElement('div');
        // batch_container.setAttribute('class', 'item_batch');
        batch_container.style.height = LI_HEIGHT*batchSize+'px';
        // batch_container.style.minHeight = LI_HEIGHT*batchSize+'px';
    
        batch_containers.push(batch_container);
        resultsListElement.appendChild(batch_container);
    }

    for (let i = startIdx; i < endIdx; i++) {
        data_batch.push(results[i]);
    }
    data_batches.push(data_batch);

    const nextBatchSize = Math.min(batchSize, results.length - endIdx);
    if (nextBatchSize > 0)
        storeBatches(results, endIdx, nextBatchSize, useContainers);
}

let runBatches = (results, batchIdx, remainingBatches=0, waitForScrollAfter=0, callback=null) => {
    if (batchIdx >= data_batches.length) {
        nextBatchFunc = ()=>{};
        return;
    } else if (batchIdx == 0) {
        first_contentful_container_idx = batchIdx;
    }
    // const batch_elem = document.createElement('div');
    createBatch(batchIdx, data_batches);

    if (remainingBatches > 0 || remainingBatches === -1) {
        // const nextBatchSize = Math.min(batchSize, results.length - endIdx);
        const waitScroll = waitForScrollAfter > 1 || waitForScrollAfter == -1;
        const nextBatchFn = ()=>runBatches(results, batchIdx+1, 
            (remainingBatches===-1 ? -1 : remainingBatches-1), 
            (waitForScrollAfter===-1 ? -1 : waitForScrollAfter>1 ? waitForScrollAfter-1 : 1),
            callback
        );

        if (!waitScroll) {
            last_contentful_container_idx = batchIdx;
            nextBatchFunc = nextBatchFn;
        } else {
            setTimeout(nextBatchFn, 0);
        }

    }
    // resultsListElement.appendChild(batch_elem);
    if (callback) {
        callback();
    }
}
function resetBatches() {
    data_batches = [];
    batch_containers = [];
}
function buildListBatches(resultsArray) {
    let listBuildTime = performance.now();
    
    resetBatches();
    storeBatches(resultsArray, 0, Math.min(BATCH_SIZE, resultsArray.length));
    // runBatches(resultsArray, idx, Math.min(BATCH_SIZE, resultsArray.length), -1, 10);//Math.floor(window.innerHeight/40)
    runBatches(resultsArray, 0, -1, 10);//Math.floor(window.innerHeight/40)

    listBuildTime = performance.now() - listBuildTime;
    listBuildTimeAvg = (listBuildTimeAvg * (searchCount - 1) + listBuildTime) / searchCount;
    console.log(`List Build - A:${listBuildTimeAvg.toFixed(3)} ms, I:${(listBuildTime).toFixed(3)} ms, numMatches: ${resultsArray.length}`)
}
function createStyleSheet(id, media) {
    var el   = document.createElement('style');
    // WebKit hack
    el.appendChild(document.createTextNode(''));
    // el.type  = 'text/css';
    el.rel   = 'stylesheet';
    el.media = media || 'screen';
    el.id    = id;
    document.head.appendChild(el);
    return el.sheet;
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
/** 
 * @param {HTMLElement} el 
 */
function pxBelowBottom(el, scrollable=null) {
    // var rect = el.getBoundingClientRect();
    let parent = scrollable || el.parentElement;
    let out = el.offsetTop - (parent.scrollTop+parent.clientHeight);
    return out;
}
/** 
 * @param {HTMLElement} el 
 */
function pxAboveTop(el, scrollable=null) {
    let parent = scrollable || el.parentElement;
    let out = (parent.scrollTop) - el.offsetTop;
    return out;
}