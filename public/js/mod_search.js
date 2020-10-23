
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
const descending = (a, b) => (b.downloadCount - a.downloadCount);
loader.addResource('../data/FabricModList-QIN0J9_nikkyCFGraphQLResponse.json', [
    (jsonData) => { 
        mod_data = jsonData.data.addons;
        mod_data.sort(descending);
        console.log(mod_data);
    }
]);
loader.addCompletionFunc(()=>executeIfWhenDOMContentLoaded(
    ()=>{
        searchTextChanged({target: {value: false} });
        console.log('mod_data loaded. Running empty search.');
    }
));
loader.fetchResources();

var searchElements;
var results_persist = false;

function searchTextChanged(query) {
    let results = null;
    if (query.target.value){
        results = search(query.target.value).map((el) => el.obj);
        console.log(query.target.value);
    } else {
        console.log("No query data was found.")
        if (results_persist) {
            console.log('test');
            results = mod_data;
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
    let results = fuzzysort.go(queryText.trim(), mod_data, {
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

var resultsListElement;
var queryDisplayElement;
function initSearch() {
    // searchElements = document.getElementsByClassName("searchField");
    searchElements = [];//Array.from(searchElements);
    searchElements.push(document.getElementById("search_input"));
    
    for (let i=0; i<searchElements.length; i++) {
        searchElements[i].addEventListener('input', (e)=>setTimeout(searchTextChanged, 0, e));
        searchElements[i].addEventListener('keydown', (e) => {
            
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
        const numPxBelowBot = pxBelowBottom(batch_containers[last_contentful_container_idx]);
        const numPxAboveTop = pxAboveTop(batch_containers[first_contentful_container_idx]);
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
                added -= 38*BATCH_SIZE;
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
                added -= 38*BATCH_SIZE;
            }
            
            
        }
        
    }, {passive: true})

    queryDisplayElement = document.getElementById("search_query_text");
    console.info("atlas_search.js initialization complete!");
}
executeIfWhenDOMContentLoaded(initSearch);

var BATCH_SIZE = 20;
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
        batch_container.style.height = 38*batchSize+'px';
        for (let i = startIdx; i < endIdx; i++) {
            data_batch.push(results[i]);
        }
        data_batches.push(data_batch);
        batch_containers.push(batch_container);
        resultsListElement.appendChild(batch_container);

        const nextBatchSize = Math.min(batchSize, results.length - endIdx);
        if (nextBatchSize > 0)
            storeBatches(results, endIdx, nextBatchSize);
    }

    let runBatches = (results, batchIdx, remainingBatches=0, waitForScrollAfter=0, callback=null) => {
        if (batchIdx >= data_batches.length) {
            nextBatchFunc = ()=>{};
            return;
        } else if (batchIdx == 0) {
            first_contentful_container_idx = batchIdx;
        }
        // const batch_elem = document.createElement('div');

        for (const result_data of data_batches[batchIdx]) {
            batch_containers[batchIdx].appendChild(createListElement(result_data));
        }
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
    runBatches(resultsArray, 0, -1, 10);//Math.floor(window.innerHeight/40)

    listBuildTime = performance.now() - listBuildTime;
    listBuildTimeAvg = (listBuildTimeAvg * (searchCount - 1) + listBuildTime) / searchCount;
    console.log(`List Build - A:${listBuildTimeAvg.toFixed(3)} ms, I:${(listBuildTime).toFixed(3)} ms, numMatches: ${resultsArray.length}`)
}
function createBatch(batchIdx) {
    for (const result_data of data_batches[batchIdx]) {
        batch_containers[batchIdx].appendChild(createListElement(result_data));
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
  

/**
 * Create a HTML li for this item.
 * @param {Object} modData 
 */
function createListElement(modData, includeCategories=true) {
    const li = document.createElement('li');
    const container = document.createElement('div');
    const name = document.createElement('b');
    const categories = document.createElement('ul');
    const desc = document.createElement('p');
    const cfButton = document.createElement('a');
    const cfButtonIcon = document.createElement('i');

    li.setAttribute('class', 'item');
    container.setAttribute('class', 'container');
    name.setAttribute('class', 'name');
    categories.setAttribute('class', 'categories');
    desc.setAttribute('class', 'desc');

    name.textContent = modData.name;
    for (const category of modData.categories) {
        // if not "Fabric"
        if (category.categoryId !== 4780) {
            const catElem = document.createElement('li');
            catElem.textContent = category.name;
            categories.appendChild(catElem);    
        }
    }
    desc.textContent = modData.summary;
    cfButtonIcon.textContent = 'launch'
    cfButtonIcon.setAttribute('class', 'material-icons');
    cfButton.setAttribute('href', 'https://www.curseforge.com/minecraft/mc-mods/' + modData.slug);
    cfButton.setAttribute('target', '_blank');
    cfButton.appendChild(cfButtonIcon);

    container.appendChild(name);
    container.appendChild(categories);
    container.appendChild(desc);
    container.appendChild(cfButton);
    li.appendChild(container);
    return li;
}

/**
 * Tells how many pixels are left to be scrolled before 
 * the element has been scrolled to it bottom.
 * @param {HTMLElement} el 
 */
function pxToBottom(el) {
    var rect = el.getBoundingClientRect();
    return (el.scrollHeight-el.clientHeight) - el.scrollTop;
}
/** 
 * @param {HTMLElement} el 
 */
function pxBelowBottom(el) {
    var rect = el.getBoundingClientRect();
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


function isScrolledIntoView(el) {
    var rect = el.getBoundingClientRect();
    var elemTop = rect.top;
    var elemBottom = rect.bottom;

    // Only completely visible elements return true:
    var isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
    // Partially visible elements return true:
    //isVisible = elemTop < window.innerHeight && elemBottom >= 0;
    return isVisible;
}
