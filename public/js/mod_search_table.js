
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
    data_batches as dataBatches
} from './mod_search_logic.js';
import {
    executeIfWhenDOMContentLoaded, setHidden
} from './util.js';


function createListElement(modData) {
    const tr = document.createElement('tr');
    tr.setAttribute('class', 'mod_row');

    const name = document.createElement('td');
    const name_link = document.createElement('a');
    name_link.textContent = modData.name;
    let link = modData.getLink();
    name_link.setAttribute('href', link);
    name_link.setAttribute('target', '_blank');
    name_link.setAttribute('rel', 'noreferrer');
    name.appendChild(name_link);

    const desc = document.createElement('td');
    desc.textContent = modData.summary;

    const author = document.createElement('td');
    const author_link = document.createElement('a');
    const a_link = modData.getAuthorLink();
    author_link.textContent = modData.author;
    author_link.setAttribute('href', a_link);
    author_link.setAttribute('target', '_blank');
    author_link.setAttribute('rel', 'noreferrer');
    author.appendChild(author_link);

    const categories = document.createElement('td');
    categories.setAttribute('class', 'item_categories');
    for (const category of modData.categories) {
        // if not "Fabric"
        if (category !== fabric_category_id) {
            const catElem = document.createElement('li');
            catElem.textContent = CATEGORIES[category].name;
            categories.appendChild(catElem);    
        }
    }

    const dlCount = document.createElement('td');
    dlCount.textContent = modData.downloadCount.toLocaleString();

    const versions = document.createElement('td');
    versions.textContent = modData["latestMCVersion"]
    const last_updated = document.createElement('td');
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
    tr.appendChild(desc);
    tr.appendChild(author);
    tr.appendChild(categories);
    tr.appendChild(dlCount);
    tr.appendChild(versions);
    tr.appendChild(last_updated);

    return tr;
}

function buildTable(modsData) {
    var start = performance.now();
    for (const mod of modsData) {
        resultsListElement.appendChild(createListElement(mod));
    }
    console.log(performance.now()-start);
}

var BATCH_SIZE = 25;
var numElemsBuilt;
var numResults;
var updateLoadbar = ()=>{
    numElemsBuilt = resultsListElement.children.length;
    const percentComplete = numElemsBuilt/numResults*100;
    loadbar_content.style.width = `calc(${percentComplete}% - 4px`;
    loadbar_text.textContent = `Showing ${numElemsBuilt}/${numResults} mods (${percentComplete.toFixed(0)}%)`;    

    if (numElemsBuilt === numResults) {
        setTimeout(()=>{
            loadbar_text.textContent = "All mods loaded!";
            hideLoadbar(1000);
        }, 100);
        batchesRemain = false;
    } else {
    }
    
    console.log("callback!");
}
function hideLoadbar(delay) {
    setTimeout(()=>{
        gsap.to(loadbar_container, {
            duration: 1,
            opacity: 0
        })
        setTimeout(()=>{
            setHidden(loadbar_container);
        }, 1000)
    }, delay);
}
function showLoadbar(delay) {
    setTimeout(()=>{
        setHidden(loadbar_container);
        setTimeout(()=>{
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

    console.log(performance.now()-start);
}

var createBatch = (batchIdx, data_batches) => {
    for (const result_data of data_batches[batchIdx]) {
        // setHidden(result_data.elem, false);
        if (result_data.elem)
            resultsListElement.appendChild(result_data.elem);
    }
    lastLoadedBatchIdx = batchIdx;
    if (batchIdx == data_batches.length-1) {
        batchesRemain = false;
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
    table.addEventListener('scroll', (e)=> {
        let numPxBelowBot = pxBelowBottom(resultsListElement.lastChild, table);
        // const numPxAboveTop = pxAboveTop(firstElem);
        if (numPxBelowBot < 1024) {
            while (numPxBelowBot < 4096 && batchesRemain){
                
                createBatch(lastLoadedBatchIdx+1, dataBatches);
                // clearInner(batch_containers[first_contentful_container_idx]);
                numPxBelowBot = pxBelowBottom(resultsListElement.lastChild, table);
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
    }, {passive: true})    
}


// Logic createListElement, true, LI_HEIGHT, BATCH_SIZE, createBatch
var loadbar_container;
var loadbar_text;
var loadbar_content;

loader.addCompletionFunc(()=>{
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
loader.addCompletionFunc(()=>setResultsListElement(document.getElementById("search_results_content")))
loader.addCompletionFunc(()=>initSearch({
        results_persist: true,
        listElemCreationFunc: createListElement,
        batchCreationFunc: createBatch,
        listCreationFunc: buildTableBatched,
        lazyLoadBatches: lazyLoadBatches,
    }))

init();
