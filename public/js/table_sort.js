
var sortable_cols = {
    "t_name": "name",
    "t_auth": "author",
    "t_dl":   "downloadCount",
    "t_vers": "latestMCVersion",
    "t_date": "dateModified",
};
/**
 * @param {string} name 
 */
function formatName(name) {
    return name.trim().replace(/[\[\(\{].*?fabric.*?[\]\)\}]/ig, '').trim();
}
/**
 * @param {string} name 
 */
function sortableName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}
/**
 * @param {string} vers 
 */
function versionOrd(vers) {
    const nums = vers.split('.');
    let weight = 100000;
    let out = 0;
    for (const x of nums) {
        let strNum = x.replace(/[^0-9]/g, '');
        out += parseFloat(strNum) * weight;
        weight /= 100;
    }
    if (nums[nums.length-1].endsWith('-Snapshot')) {
        out -= 1
    }
    if (Number.isNaN(out)) {
        out = -1;
    }
    return out;
}
/**
 * 
 * @param {string} date 
 */
function dateOrd(date) {
    return new Date(date).valueOf();
}

/**
 * 
 * @param {Array<import("./mod_types.js").Mod>} mods 
 */
export function initSortCache(mods) {
    for (const mod of mods) {
        mod["name"] = formatName(mod.name)  
        mod["s_name"] = sortableName(mod.name);
        // mod["s_author"] = 
        // mod["s_downloadCount"] = 
        mod["s_latestMCVersion"] = versionOrd(mod.latestMCVersion);
        mod["s_dateModified"] = dateOrd(mod.dateModified);
    }
}

var sort_funcs = {
    "name": (a, b) => {
        return (a["s_name"] > b["s_name"]) ? 1: -1
        
    },
    "author": (a, b) => {
        if (!(a["author"] && b["author"])) {
            return 1;
        }
        return (a["author"].toLowerCase() > b["author"].toLowerCase()) ? 1: -1
    },
    "downloadCount": (a, b) => {
        return (a["downloadCount"] < b["downloadCount"]) ? 1: -1
    },
    "latestMCVersion": (a, b) => { 
        return (a["s_latestMCVersion"] < b["s_latestMCVersion"]) ? 1: -1
    },
    "dateModified": (a, b) => {
        return (a["s_dateModified"] < b["s_dateModified"]) ? 1: -1
    },

}

var default_order = {
    "name": 'ascending',
    "author": 'ascending',
    "downloadCount": 'descending',
    "latestMCVersion": 'descending',
    "dateModified": 'descending',
}
var sortMode = null;
var reverseNum = 1;
function finalizeSortFunc(func) {
    if (!func)
        return func;
    return (a, b) => func(a, b) * reverseNum;
}

var onModeChangeFuncs = [];

const sortBtns = document.getElementsByClassName('tbl_sort');

for (const btn of sortBtns) {
    btn.col_field = sortable_cols[btn.parentElement.id];
    btn.parentElement.addEventListener('click', (e) => {
        
        /**
         * @type {HTMLElement}
         */
        const elem = btn;
        // if already selected, rotate order, or deselect.
        if (sortMode === elem.col_field) {  
            if (reverseNum === -1) {
                reverseNum = 1;
                sortMode = null;
            } else {
                reverseNum = -1;
            }1
            elem.classList.toggle('ascending');
        } else {
            sortMode = elem.col_field;
            reverseNum = 1;
            if (default_order[sortMode] === 'ascending') {
                elem.classList.add('ascending');
            }
        }
        updateSortIndicator();
        
        
        for (const func of onModeChangeFuncs) {
            func(sortMode);
        }
    })

}

function updateSortIndicator() {
    for (const btn of sortBtns) {
        if (btn.col_field == sortMode) {
            btn.classList.add('active'); 
        } else {
            btn.classList.remove('active');
        }
        if (btn.classList.contains("active")) {
            if (btn.classList.contains("ascending")) {
                btn.innerText = "north";
            } else {
                btn.innerText = "south";
            }
        } else {
            btn.innerText = "sort";
        }
    }
}

export function getSortFunc() {
    return finalizeSortFunc(sort_funcs[sortMode]) || null;
}
export function registerListener(callback) {
    onModeChangeFuncs.push(callback);
}
