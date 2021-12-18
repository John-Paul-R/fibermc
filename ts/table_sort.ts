import { Mod, Author } from "./mod_types.js";

type SortColumnClass = "t_name" | "t_auth" | "t_dl" | "t_vers" | "t_date";
type SortableModField =
    | "name"
    | "author"
    | "downloadCount"
    | "latestMCVersion"
    | "dateModified";

type ColumnClassToModPropertyMap = Record<SortColumnClass, SortableModField>;

var sortable_cols: ColumnClassToModPropertyMap = {
    t_name: "name",
    t_auth: "author",
    t_dl: "downloadCount",
    t_vers: "latestMCVersion",
    t_date: "dateModified",
};

type ModSortFunc = (a: Mod, b: Mod) => number;

var sort_funcs: Record<string, ModSortFunc> = {
    name: (a, b) => {
        return a["s_name"] > b["s_name"] ? 1 : -1;
    },
    author: (a, b) => {
        if (!(a["author"] && b["author"])) {
            return 1;
        }
        return a["author"][0].name.toLowerCase() >
            b["author"][0].name.toLowerCase()
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

type SortMode = SortableModField | null;
var sortMode: SortMode = null;
var reverseNum = 1;
function finalizeSortFunc(func: ModSortFunc) {
    if (!func) return func;
    return (a: Mod, b: Mod) => func(a, b) * reverseNum;
}

var onModeChangeFuncs: Array<(mode: SortMode) => void> = [];

interface TableSortButtonElement extends Element {
    col_field: SortableModField;
}

interface TableSortableHeaderElement extends Element {
    id: SortColumnClass;
}

const sortBtns = document.getElementsByClassName(
    "tbl_sort"
) as HTMLCollectionOf<TableSortButtonElement>;

const isTableSortableHeaderElement = (
    el: Element
): el is TableSortableHeaderElement =>
    !!el.id && Object.keys(sortable_cols).includes(el.id);

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
            throw new Error(
                "Table sort button parent element missing a valid sort css class (see sortable_columns)."
            );
        }

        btn.col_field = sortable_cols[btn.parentElement.id];
        btn.parentElement.addEventListener("click", (e) => {
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
                }
                1;
                elem.classList.toggle("ascending");
            } else {
                sortMode = elem.col_field;
                reverseNum = 1;
                if (default_order[sortMode] === "ascending") {
                    elem.classList.add("ascending");
                }
            }
        });

        updateSortIndicator();

        for (const func of onModeChangeFuncs) {
            func(sortMode);
        }
    }
})();

function updateSortIndicator() {
    for (const btn of sortBtns) {
        if (btn.col_field == sortMode) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
        if (btn.classList.contains("active")) {
            if (btn.classList.contains("ascending")) {
                btn.textContent = "north";
            } else {
                btn.textContent = "south";
            }
        } else {
            btn.textContent = "sort";
        }
    }
}

export function getSortFunc() {
    return sortMode ? finalizeSortFunc(sort_funcs[sortMode]) : undefined;
}
export function registerListener(callback: (mode: SortMode) => void) {
    onModeChangeFuncs.push(callback);
}
