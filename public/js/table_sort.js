


var sortable_cols = {
    "t_name": "name",
    "t_auth": "author",
    "t_dl":   "downloadCount",
    "t_vers": "latestMCVersion",
    "t_date": "dateModified",
};
/**
 * 
 * @param {string} name 
 */
function formatName(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/^\W*\[fabric\]/g, '');
}
/**
 * 
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

    if (Number.isNaN(out)) {
        out = -1;
    }
    return out;
}

export function initSortCache(mods) {
    for (const mod of mods) {
        
        mod["s_name"] = formatName(mod["name"]);
        // mod["s_author"] = 
        // mod["s_downloadCount"] = 
        mod["s_latestMCVersion"] = versionOrd(mod["latestMCVersion"]);
        // mod["s_dateModified"] = 
    }

}

var sort_funcs = {
    "name": (a, b) => {
        return (a["s_name"] > b["s_name"]) ? 1: -1
        
    },
    "author": (a, b) => {
        // console.log(a)
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
        return (a["dateModified"] < b["dateModified"]) ? 1: -1
    },

}
// def versionOrd(vers):
//     nums = vers.split('.')
//     weight = 100000
//     out = 0
//     for x in nums:
//         strNum = ''.join(list(filter(str.isdigit, x)))
//         out += toNum(strNum)*weight
//         weight /= 100
//     return out


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
    btn.addEventListener('click', (e) => {
        // if already selected, rotate order, or deselect.
        if (sortMode === e.target.col_field) {  
            if (reverseNum === -1) {
                reverseNum = 1;
                sortMode = null;
            } else {
                reverseNum = -1;
            }
            e.target.classList.toggle('ascending');
        } else {
            sortMode = e.target.col_field;
            reverseNum = 1;
            if (default_order[sortMode] === 'ascending') {
                e.target.classList.add('ascending');
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
    }

}
console.log("TEST");

export function getSortFunc() {
    return finalizeSortFunc(sort_funcs[sortMode]) || null;
}
export function registerListener(callback) {
    onModeChangeFuncs.push(callback);
}
