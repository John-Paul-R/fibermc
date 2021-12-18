var sortable_cols = {
    t_name: "name",
    t_auth: "author",
    t_dl: "downloadCount",
    t_vers: "latestMCVersion",
    t_date: "dateModified",
};
var sort_funcs = {
    name: (a, b) => {
        return a["s_name"] > b["s_name"] ? 1 : -1;
    },
    author: (a, b) => {
        var _a, _b;
        if (!(a["authors"] && b["authors"])) {
            return 1;
        }
        return ((_a = a["authors"][0]) === null || _a === void 0 ? void 0 : _a.name.toLowerCase()) >
            ((_b = b["authors"][0]) === null || _b === void 0 ? void 0 : _b.name.toLowerCase())
            ? 1
            : -1;
    },
    downloadCount: (a, b) => {
        return a["downloadCount"] < b["downloadCount"] ? 1 : -1;
    },
    latestMCVersion: (a, b) => {
        return a["s_latestMCVersion"] < b["s_latestMCVersion"] ? 1 : -1;
    },
    dateModified: (a, b) => {
        return a["s_dateModified"] < b["s_dateModified"] ? 1 : -1;
    },
};
var default_order = {
    name: "ascending",
    author: "ascending",
    downloadCount: "descending",
    latestMCVersion: "descending",
    dateModified: "descending",
};
var sortMode = null;
var reverseNum = 1;
function finalizeSortFunc(func) {
    if (!func)
        return func;
    return (a, b) => func(a, b) * reverseNum;
}
var onModeChangeFuncs = [];
const sortBtns = document.getElementsByClassName("tbl_sort");
const isTableSortableHeaderElement = (el) => !!el.id && Object.keys(sortable_cols).includes(el.id);
(async function () {
    console.log(sortBtns);
    if (sortBtns.length === 0) {
        return;
    }
    for (const btn of sortBtns) {
        if (!btn.parentElement) {
            throw new Error("Table sort button parent element was null.");
        }
        if (!isTableSortableHeaderElement(btn.parentElement)) {
            console.error(btn, btn.parentElement);
            throw new Error("Table sort button parent element missing a valid sort css class (see sortable_columns).");
        }
        btn.col_field = sortable_cols[btn.parentElement.id];
        btn.parentElement.addEventListener("click", (e) => {
            // if already selected, rotate order, or deselect.
            if (sortMode === btn.col_field) {
                if (reverseNum === -1) {
                    reverseNum = 1;
                    sortMode = null;
                }
                else {
                    reverseNum = -1;
                }
                btn.classList.toggle("ascending");
            }
            else {
                sortMode = btn.col_field;
                reverseNum = 1;
                if (default_order[sortMode] === "ascending") {
                    btn.classList.add("ascending");
                }
            }

            // function updateSortIndicator()
            {
                for (const btn of sortBtns) {
                    if (btn.col_field == sortMode) {
                        btn.classList.add("active");
                    }
                    else {
                        btn.classList.remove("active");
                    }
                    if (btn.classList.contains("active")) {
                        if (btn.classList.contains("ascending")) {
                            btn.textContent = "north";
                        }
                        else {
                            btn.textContent = "south";
                        }
                    }
                    else {
                        btn.textContent = "sort";
                    }
                }
            }


            for (const func of onModeChangeFuncs) {
                func(sortMode);
            }

        });
    }
})();
export function getSortFunc() {
    return sortMode ? finalizeSortFunc(sort_funcs[sortMode]) : undefined;
}
export function registerListener(callback) {
    onModeChangeFuncs.push(callback);
}
//# sourceMappingURL=table_sort.js.map