
import {
    executeIfWhenDOMContentLoaded, setHidden
} from './util.js';
import { AsyncDataResourceLoader } from './resource_loader.js'

export { initSearch };

var loader = new AsyncDataResourceLoader();
/**
 * @type {Array<Object>}
 */
var mod_data;
/**
 * @type {Array<Mod>}
 */
var CATEGORIES;
var timestamp;
var fabric_category_id;
var categories_sidebar_elem;
const descending = (a, b) => (b.downloadCount - a.downloadCount);
loader.addResource('../data/mod_list.db.min.json', [
    (jsonData) => { 
        const temp_mods = jsonData.mods;
        console.log(temp_mods)
        let new_mods = []  
        for (let i = 0; i < temp_mods.length; i++) {
            const temp_mod = temp_mods[i];
            new_mods.push(new Mod(temp_mod));
        }
        mod_data = new_mods;
        mod_data.sort(descending);
        timestamp = jsonData.timestamp;
        console.log(mod_data);

        CATEGORIES = jsonData.categories;
        initCategoriesSidebar();
        console.log(CATEGORIES);
    }
]);
loader.addCompletionFunc(()=>executeIfWhenDOMContentLoaded(
    ()=>{
        searchTextChanged({target: {value: false} });
        console.log('mod_data loaded. Running empty search.');
    }
));
loader.addCompletionFunc(() => updateTimestamp(timestamp));
loader.fetchResources();

var searchHTMLElements;
var results_persist = false;

function formatDate(date) {
    date = new Date(date);
    return (`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`);
  }
function updateTimestamp(timestamp) {
    document.getElementById("last_updated_timestamp").textContent = `List updated: ${formatDate(timestamp)}`;
}

var search_objects;
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
function updateModCounts() {
    for (let i = 0; i < CATEGORIES.length; i++) {
        CATEGORIES[i] = {
            name: CATEGORIES[i],
            modCount: 0,
        }
    }
    for (const mod of mod_data) {
        for(const cat_id of mod.categories) {
            CATEGORIES[cat_id].modCount += 1;
        }
    }
}
function getFilteredList() {
    const selected_cat_ids = getSelectedCategoryIds();

    let search_objs = mod_data;
    if (selected_cat_ids.length === 0) {
        
    } else {
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

function searchTextChanged(query) {
    let results = null;
    search_objects = getFilteredList();
    if (query && query.target.value){
        results = search(query.target.value).map((el) => el.obj);
        console.log(query.target.value);
    } else {
        console.log("No query data was found.")
        if (results_persist) {
            // console.log('test');
            results = search_objects;
        }
    }
    updateSearchResultsListElement(results);
    // queryDisplayElement.innerText = query.target.value;
}
var fuzzysortAvg = 0;
var searchCount = 0;
/**
 * 
 * @param {string} queryText 
 * @param {boolean} selectBest
 * 
 * @returns {Array<Object>} 
 */
function search(queryText, selectBest=false) {
    console.info("Search Query: " + queryText)
    // let objects = mod_data.map(el => { return {
    //     name: el.name,
    //     slug: el.slug,
    //     // tier: el.TieredData[getNodeRegionTier(el)].Tier.toString()
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
            // a[2]?a[2].score-100:-1000
        )
    });
    var fuzzysortTime = performance.now() - fuzzysortStart;
    searchCount += 1;
    fuzzysortAvg = (fuzzysortAvg * (searchCount - 1) + fuzzysortTime) / searchCount;
    console.log(`fuzzysort.js - A:${fuzzysortAvg.toFixed(3)} ms, I:${(fuzzysortTime).toFixed(3)} ms, found: "${results[0] ? results[0].obj.name : ""}", numMatches: ${results.length}`)

    let bestResult = results[0]

    // If there is a match
    if (bestResult) {
        // Go through all partial (& full) matches...
        for(let i=0; i<results.length; i++) {
            // And highlight them as search results
            // let pixiObj = nodePixiObjects[results[i].obj.id];
            // pixiObj.isSearchMatch = true;

            // If this is the best match and 'selectBest' is true
            if (i==0 && selectBest) {
                // Use "selectBest" graphics

            }
            
            // if (results[i].score==0)
            //     break;
        }
    }
    // When using multiple `keys`, results are different. They're indexable to get each normal result
    // fuzzysort.highlight(bestResult[0]) // 'Google <b>Chr</b>ome'
    // fuzzysort.highlight(bestResult[1]) // 'Launch <b>Chr</b>ome'
    // bestResult.obj.title // 'Google Chrome'
    //If possible, perhaps run these each in their own threads?
    //Alternatively, just have them use the dropdown... (or a "Did you mean...?")
    // have alphabatized collection with all of the nodes by name
    // premade collections of all nodes at each tier
    // collections of nodes by region (we have this)
    // console.info(bestResult?(bestResult.obj.name + " - Score: " + bestResult.score):"NO-MATCH-FOUND")
    return results;
}

var LIST_WIDTH = 682;
var LIST_ITEM_WIDTH = 649;
var LI_HEIGHT = 70+16;
var BATCH_SIZE = 20;

var resultsListElement;
var queryDisplayElement;
var initialNumBatches = 10;
function initSearch() {
    // searchElements = document.getElementsByClassName("searchField");
    searchHTMLElements = [];//Array.from(searchElements);
    searchHTMLElements.push(document.getElementById("search_input"));
    
    for (let i=0; i<searchHTMLElements.length; i++) {
        searchHTMLElements[i].addEventListener('input', (e)=>setTimeout(searchTextChanged, 0, e));
        searchHTMLElements[i].addEventListener('keydown', (e) => {
            
            if (e.key === "Enter") {
                // clearSearchDisplayMods(nodePixiObjects);
                search(e.target.value, true);
            }
            // renderStage();
        });
        // console.info(searchElements[i], " will now listen for input events and trigger searchAtlas.");
    }
    resultsListElement = document.getElementById("search_results_list");
    if (resultsListElement.className.includes('persist')) {
        results_persist = true;
    }
    resultsListElement.addEventListener('scroll', (e)=> {
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
            while (addedLessThanDiff){
                // nextBatchFunc(()=>{
                //     let first = batch_containers[first_contentful_container_idx];
                //     // if (pxToTop(first) < 64)
                //         clearInner(first);
                // });
                if (last_contentful_container_idx+1 < batch_containers.length) {
                    createBatch(last_contentful_container_idx+1);
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
                    createBatch(first_contentful_container_idx-1);
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

    // Add Stylesheet 
    var sheet = createStyleSheet('mod-list-constructed');
    // sheet.insertRule(`#search_results_list {
    //     max-width: 900px;
    //     width: 900px;
    // }`, 0);
    sheet.insertRule(`.item_batch {
        height: ${LI_HEIGHT*BATCH_SIZE}px;
        min-height: ${LI_HEIGHT*BATCH_SIZE}px;
    }`);
    console.log(sheet.cssRules);
    queryDisplayElement = document.getElementById("search_query_text");
    console.info("atlas_search.js initialization complete!");
}
executeIfWhenDOMContentLoaded(initSearch);
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
function updateSearchResultsListElement(resultsArray) {
    while (resultsListElement.firstChild) {
        resultsListElement.removeChild(resultsListElement.lastChild);
    }
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

var listBuildTimeAvg = 0;
var nextBatchFunc;
var data_batches;
var batch_containers;
var first_contentful_container_idx;
var last_contentful_container_idx;
function buildList(resultsArray) {
    let listBuildTime = performance.now();
    const storeBatches = (results, startIdx, batchSize) => {
        const endIdx = startIdx + batchSize;
        const data_batch = [];
        const batch_container = document.createElement('div');
        batch_container.classList.add('item_batch');
        // batch_container.style.height = LI_HEIGHT*batchSize+'px';
        // batch_container.style.minHeight = LI_HEIGHT*batchSize+'px';

        for (let i = startIdx; i < endIdx; i++) {
            data_batch.push(results[i]);
        }
        data_batches.push(data_batch);
        batch_containers.push(batch_container);
        resultsListElement.appendChild(batch_container);

        const nextBatchSize = Math.min(batchSize, results.length - endIdx);
        if (nextBatchSize > 0) {
            storeBatches(results, endIdx, nextBatchSize);
        } else {
            batch_container.style.height = data_batch.length * LI_HEIGHT + "px";
            batch_container.style.minHeight = data_batch.length * LI_HEIGHT + "px";
        }
    }

    let runBatches = (results, batchIdx, remainingBatches=0, waitForScrollAfter=0, callback=null) => {
        if (batchIdx >= data_batches.length) {
            nextBatchFunc = ()=>{};
            return;
        } else if (batchIdx == 0) {
            first_contentful_container_idx = batchIdx;
        }
        // const batch_elem = document.createElement('div');
        createBatch(batchIdx);

        if (remainingBatches > 0 || remainingBatches === -1) {
            // const nextBatchSize = Math.min(batchSize, results.length - endIdx);
            const waitScroll = waitForScrollAfter > 1 || waitForScrollAfter == -1;
            const nextBatchFn = (c)=>runBatches(results, batchIdx+1, 
                (remainingBatches===-1 ? -1 : remainingBatches-1), 
                (waitForScrollAfter===-1 ? -1 : waitForScrollAfter>1 ? waitForScrollAfter-1 : 1),
                c
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
    data_batches = [];
    batch_containers = [];
    storeBatches(resultsArray, 0, Math.min(BATCH_SIZE, resultsArray.length));
    // runBatches(resultsArray, idx, Math.min(BATCH_SIZE, resultsArray.length), -1, 10);//Math.floor(window.innerHeight/40)
    runBatches(resultsArray, 0, -1, initialNumBatches);//Math.floor(window.innerHeight/40)

    listBuildTime = performance.now() - listBuildTime;
    listBuildTimeAvg = (listBuildTimeAvg * (searchCount - 1) + listBuildTime) / searchCount;
    console.log(`List Build - A:${listBuildTimeAvg.toFixed(3)} ms, I:${(listBuildTime).toFixed(3)} ms, numMatches: ${resultsArray.length}`)
}
var listCreationFunc = createListElement;
function createBatch(batchIdx) {
    for (const result_data of data_batches[batchIdx]) {
        try {
            batch_containers[batchIdx].appendChild(listCreationFunc(result_data));

        } catch (err) {
            batch_containers[batchIdx].appendChild(document.createElement('li')).classList.add('item');
            
            console.warn(err)
            console.warn(result_data)
        }
    }
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
function initCategoriesSidebar() {
    //TODO Group "Selected" items?
    //TODO "select multiple" toggle
    //TODO Option to sort categories by name or by num mods in category
    //TODO Display "searching in these categories" under searchbar. With option to click them to remove.

    categories_sidebar_elem = document.getElementById('categories_list');
    updateModCounts();
    for (let i=0; i<CATEGORIES.length; i++) {
        if (CATEGORIES[i].name.toUpperCase() === "FABRIC") {
            fabric_category_id = i;
            break;
        }
    }
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
    /**
     * 
     * @param {HTMLElement} cat_elem 
     */
    function applySelected(cat_elem) {
        if (cat_elem.selected) {
            cat_elem.classList.add('selected');
        } else {
            cat_elem.classList.remove('selected');//.border = '2px solid var(--color-element-1)';
        }
    }
}
  
function createListElement(modData, includeCategories=true) {
    const li = document.createElement('li');
    
    const container = document.createElement('div');
    const front_container = document.createElement('div');
    const end_container = document.createElement('div');

    const title_container = document.createElement('div');
    const name = document.createElement('a');
    const author = document.createElement('a');

    const categories = document.createElement('ul');
    const desc = document.createElement('p');
    const cfButton = document.createElement('a');
    const cfButtonIcon = document.createElement('i');
    
    let startContainer;
    let dlCount;

    li.classList.add('item');
    container.classList.add('container');
    front_container.classList.add('front_container');
    end_container.classList.add('end_container');
    name.classList.add('name');
    author.classList.add('author');
    categories.classList.add('item_categories');
    desc.classList.add('desc');
    cfButton.classList.add('out_link');
    try {
        desc.setAttribute('data-text', modData.summary);


        // Add DL Count Element
        if (results_persist){
            startContainer = document.createElement('div');
            dlCount = document.createElement('p');
    
            dlCount.classList.add('dl_count');
            startContainer.classList.add('start_container');
    
            dlCount.textContent = modData.downloadCount.toLocaleString();
            startContainer.appendChild(dlCount);
            li.appendChild(startContainer)
        }
    
        // Fill content of elements
        name.textContent = modData.name;
        if (modData.authors[0])
            author.textContent = modData.authors[0];
        else 
            author.textContent = "undefined";
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
        let cflink = 'https://www.curseforge.com/minecraft/mc-mods/' + modData.slug;
        cfButton.setAttribute('href', cflink);
        cfButton.setAttribute('target', '_blank');
        
        cfButton.appendChild(cfButtonIcon);
        name.setAttribute('href', cflink);
        name.setAttribute('target', '_blank');
        author.setAttribute('href', `https://www.curseforge.com/members/${modData.authors[0]}/projects`);
        author.setAttribute('target', '_blank');
    
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
    title_container.appendChild(author);
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
 * @param {HTMLElement} el 
 */
function pxBelowBottom(el) {
    // var rect = el.getBoundingClientRect();
    let parent = el.parentElement;
    let out = el.offsetTop - (parent.scrollTop+parent.clientHeight);
    return out;
}
/** 
 * @param {HTMLElement} el 
 */
function pxAboveTop(el) {
    let parent = el.parentElement;
    let out = (parent.scrollTop) - el.offsetTop;
    return out;
}
